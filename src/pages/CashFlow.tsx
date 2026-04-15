import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History, 
  Calculator, 
  Save, 
  Plus, 
  Minus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CashFlowProps {
  userData: any;
}

interface CashTx {
  id: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  timestamp: any;
}

interface SettleReport {
  id: string;
  date: string;
  openingBalance: number;
  totalSales: number;
  totalCashSales: number;
  totalQrSales: number;
  totalCashIn: number;
  totalCashOut: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  notes: string;
  startTime?: any;
  timestamp: any;
  transactions?: CashTx[];
}

export default function CashFlow({ userData }: CashFlowProps) {
  const [transactions, setTransactions] = useState<CashTx[]>([]);
  const [settlements, setSettlements] = useState<SettleReport[]>([]);
  const [todaySales, setTodaySales] = useState({ total: 0, cash: 0, qr: 0 });
  const [lastSettleTime, setLastSettleTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedSettle, setSelectedSettle] = useState<SettleReport | null>(null);

  // Form states
  const [txForm, setTxForm] = useState({ type: 'in' as 'in' | 'out', amount: '', reason: '' });
  const [settleForm, setSettleForm] = useState({ openingBalance: '', actualCash: '', notes: '' });

  const isAdmin = userData?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!userData?.uid) return;

    // Listen to settlement history
    const settleQuery = query(
      collection(db, 'daily_settles'),
      where('vendorId', '==', userData.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubSettle = onSnapshot(settleQuery, (snapshot) => {
      const settleData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SettleReport[];
      setSettlements(settleData);
      
      if (snapshot.docs.length > 0) {
        const lastSettle = snapshot.docs[0].data();
        setSettleForm(prev => ({ ...prev, openingBalance: lastSettle.actualCash.toString() }));
        if (lastSettle.timestamp) {
          setLastSettleTime(lastSettle.timestamp.toDate());
        }
      } else {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        setLastSettleTime(startOfDay);
      }
      setLoading(false);
    });

    return () => unsubSettle();
  }, [userData.uid]);

  useEffect(() => {
    if (!userData?.uid || !lastSettleTime) return;

    // Listen to manual cash transactions since last settlement
    const txQuery = query(
      collection(db, 'cash_transactions'),
      where('vendorId', '==', userData.uid),
      where('timestamp', '>', Timestamp.fromDate(lastSettleTime)),
      orderBy('timestamp', 'desc')
    );

    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CashTx[]);
    });

    // Listen to sales since last settlement
    const salesQuery = query(
      collection(db, 'sales'),
      where('vendorId', '==', userData.uid),
      where('timestamp', '>', Timestamp.fromDate(lastSettleTime))
    );

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const sales = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        acc.total += data.total || 0;
        if (data.paymentMethod === 'Cash') acc.cash += data.total || 0;
        else acc.qr += data.total || 0;
        return acc;
      }, { total: 0, cash: 0, qr: 0 });
      setTodaySales(sales);
    });

    return () => {
      unsubTx();
      unsubSales();
    };
  }, [userData.uid, lastSettleTime]);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.reason) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'cash_transactions'), {
        vendorId: userData.uid,
        type: txForm.type,
        amount: parseFloat(txForm.amount),
        reason: txForm.reason,
        timestamp: serverTimestamp()
      });
      setTxForm({ type: 'in', amount: '', reason: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cash_transactions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    const opening = parseFloat(settleForm.openingBalance) || 0;
    const actual = parseFloat(settleForm.actualCash) || 0;
    
    const totalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
    const expected = opening + todaySales.cash + totalIn - totalOut;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'daily_settles'), {
        vendorId: userData.uid,
        date: new Date().toISOString().split('T')[0],
        openingBalance: opening,
        totalSales: todaySales.total,
        totalCashSales: todaySales.cash,
        totalQrSales: todaySales.qr,
        totalCashIn: totalIn,
        totalCashOut: totalOut,
        expectedCash: expected,
        actualCash: actual,
        difference: actual - expected,
        notes: settleForm.notes,
        startTime: lastSettleTime ? Timestamp.fromDate(lastSettleTime) : serverTimestamp(),
        timestamp: serverTimestamp(),
        transactions: transactions // Store snapshot of transactions for the receipt
      });
      setShowSettleModal(false);
      setSettleForm(prev => ({ ...prev, actualCash: '', notes: '' }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'daily_settles');
    } finally {
      setSubmitting(false);
    }
  };

  const totalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
  const expectedCash = (parseFloat(settleForm.openingBalance) || 0) + todaySales.cash + totalIn - totalOut;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="text-indigo-400" />
            Cash Flow & Settlement
          </h2>
          <p className="text-gray-400 text-sm mt-1">Track manual cash movements and perform daily reconciliation.</p>
        </div>
        <button
          onClick={() => setShowSettleModal(true)}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <CheckCircle2 size={18} />
          Settle Day (EOD)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Calculator size={120} />
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock size={20} className="text-indigo-400" />
                Current Shift
              </h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-800 px-2 py-1 rounded-lg">
                Since {lastSettleTime ? lastSettleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
              </span>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-2xl">
                <span className="text-gray-400 text-sm">Opening Balance</span>
                <span className="font-bold text-white">RM {parseFloat(settleForm.openingBalance || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <div className="flex flex-col">
                  <span className="text-emerald-400 text-sm">Total Sales</span>
                  <span className="text-[10px] text-gray-500">Cash: RM {(todaySales.cash || 0).toFixed(2)} | QR: RM {(todaySales.qr || 0).toFixed(2)}</span>
                </div>
                <span className="font-bold text-emerald-400">+ RM {(todaySales.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <span className="text-blue-400 text-sm">Manual Cash In</span>
                <span className="font-bold text-blue-400">+ RM {totalIn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                <span className="text-red-400 text-sm">Manual Cash Out</span>
                <span className="font-bold text-red-400">- RM {totalOut.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center p-4 bg-indigo-600 rounded-2xl shadow-xl">
                  <span className="text-indigo-100 font-bold">Expected Cash</span>
                  <span className="text-xl font-black text-white">RM {expectedCash.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add Transaction Form */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Plus size={20} className="text-indigo-400" />
              Manual Movement
            </h3>
            <form onSubmit={handleAddTx} className="space-y-4">
              <div className="flex p-1 bg-gray-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'in' })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    txForm.type === 'in' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ArrowUpCircle size={14} />
                  Cash In
                </button>
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'out' })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    txForm.type === 'out' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ArrowDownCircle size={14} />
                  Cash Out
                </button>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">Amount (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">Reason / Description</label>
                <input
                  type="text"
                  required
                  value={txForm.reason}
                  onChange={(e) => setTxForm({ ...txForm, reason: e.target.value })}
                  placeholder="e.g. Change for drawer"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Record Transaction
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Transaction History & Settlements */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Manual Transactions */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/30">
              <h3 className="font-bold flex items-center gap-2">
                <History size={18} className="text-indigo-400" />
                Today's Manual Movements
              </h3>
              <span className="text-xs text-gray-500">{transactions.length} entries</span>
            </div>
            <div className="divide-y divide-gray-800">
              {transactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  No manual cash movements recorded today.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.type === 'in' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{tx.reason}</p>
                        <p className="text-[10px] text-gray-500">{tx.timestamp?.toDate().toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'in' ? '+' : '-'} RM {tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Settlement History */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/30">
              <h3 className="font-bold flex items-center gap-2">
                <Calendar size={18} className="text-indigo-400" />
                Recent Settlements (EOD)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Expected</th>
                    <th className="px-6 py-4 text-right">Actual</th>
                    <th className="px-6 py-4 text-right">Difference</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                        No settlement history found.
                      </td>
                    </tr>
                  ) : (
                    settlements.map((s) => (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedSettle(s)}
                        className="hover:bg-gray-800/30 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-white">{new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-[10px] text-gray-500">{s.timestamp?.toDate().toLocaleTimeString()}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-300">RM {s.expectedCash.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-white">RM {s.actualCash.toFixed(2)}</td>
                        <td className={`px-6 py-4 text-right text-sm font-bold ${s.difference === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {s.difference > 0 ? '+' : ''}RM {s.difference.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            s.difference === 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {s.difference === 0 ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                            {s.difference === 0 ? 'Balanced' : 'Discrepancy'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Modal */}
      <AnimatePresence>
        {showSettleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-indigo-600">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calculator size={24} />
                  Daily Reconciliation (EOD)
                </h3>
                <button 
                  onClick={() => setShowSettleModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Expected Cash</p>
                    <p className="text-xl font-black text-white">RM {(expectedCash || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">QR Sales</p>
                    <p className="text-xl font-black text-white">RM {(todaySales.qr || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Since</p>
                    <p className="text-sm font-bold text-white">
                      {lastSettleTime ? lastSettleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Start of Day'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/30 rounded-2xl border border-gray-800 space-y-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cash Movement Details</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Opening Balance:</span>
                    <span className="text-white">RM {parseFloat(settleForm.openingBalance || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Cash Sales:</span>
                    <span className="text-white">RM {(todaySales.cash || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Manual Cash In:</span>
                    <span className="text-emerald-400">+ RM {(totalIn || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Manual Cash Out:</span>
                    <span className="text-red-400">- RM {(totalOut || 0).toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleSettle} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Opening Balance (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={settleForm.openingBalance}
                        onChange={(e) => setSettleForm({ ...settleForm, openingBalance: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Actual Cash in Drawer (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        autoFocus
                        value={settleForm.actualCash}
                        onChange={(e) => setSettleForm({ ...settleForm, actualCash: e.target.value })}
                        placeholder="Count your cash..."
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Settlement Notes</label>
                    <textarea
                      rows={3}
                      value={settleForm.notes}
                      onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
                      placeholder="Any discrepancies or notes for the day..."
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      Settling the day will finalize your cash reconciliation report. 
                      Make sure you have counted all physical cash in your drawer correctly.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSettleModal(false)}
                      className="flex-1 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      Finalize Settlement
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Settlement Receipt Modal */}
      <AnimatePresence>
        {selectedSettle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white text-gray-900 rounded-none shadow-2xl my-8 font-mono"
            >
              <div id="receipt-content" className="p-8 space-y-6">
                <div className="text-center border-b-2 border-dashed border-gray-300 pb-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Vendora POS</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1">END OF DAY REPORT</p>
                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-bold">PERIOD</p>
                    <p className="text-[10px]">
                      {selectedSettle.startTime?.toDate().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      <span className="mx-2">→</span>
                      {selectedSettle.timestamp?.toDate().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span>OPENING BALANCE</span>
                    <span className="font-bold">RM {(selectedSettle.openingBalance || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span>TOTAL SALES</span>
                    <span className="font-bold">RM {(selectedSettle.totalSales || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-gray-500">
                    <span>- CASH SALES</span>
                    <span>RM {(selectedSettle.totalCashSales || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-gray-500">
                    <span>- QR SALES</span>
                    <span>RM {(selectedSettle.totalQrSales || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span>MANUAL CASH IN</span>
                    <span className="font-bold text-emerald-600">+ RM {(selectedSettle.totalCashIn || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MANUAL CASH OUT</span>
                    <span className="font-bold text-red-600">- RM {(selectedSettle.totalCashOut || 0).toFixed(2)}</span>
                  </div>

                  {/* Detailed Cash Movements */}
                  {selectedSettle.transactions && selectedSettle.transactions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Cash Movement Breakdown</p>
                      <div className="space-y-2">
                        {selectedSettle.transactions.map((tx, idx) => (
                          <div key={idx} className="flex justify-between text-[10px]">
                            <div className="flex flex-col">
                              <span className="font-bold uppercase">{tx.reason}</span>
                              <span className="text-gray-400">{tx.type === 'in' ? 'Cash In' : 'Cash Out'}</span>
                            </div>
                            <span className={tx.type === 'in' ? 'text-emerald-600' : 'text-red-600'}>
                              {tx.type === 'in' ? '+' : '-'} RM {tx.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between border-t-2 border-gray-900 pt-3 text-sm font-black">
                    <span>EXPECTED CASH</span>
                    <span>RM {(selectedSettle.expectedCash || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black">
                    <span>ACTUAL CASH</span>
                    <span>RM {(selectedSettle.actualCash || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className={`flex justify-between border-t border-gray-200 pt-3 font-bold ${(selectedSettle.difference || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span>DIFFERENCE</span>
                    <span>{(selectedSettle.difference || 0) >= 0 ? 'EXTRA' : 'SHORTAGE'} RM {Math.abs(selectedSettle.difference || 0).toFixed(2)}</span>
                  </div>
                </div>

                {selectedSettle.notes && (
                  <div className="p-4 bg-gray-100 rounded-lg text-[10px] italic">
                    <p className="font-bold mb-1 not-italic uppercase tracking-widest">Notes:</p>
                    {selectedSettle.notes}
                  </div>
                )}

                <div className="text-center border-t-2 border-dashed border-gray-300 pt-6">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Report Generated by {userData?.displayName}</p>
                </div>
              </div>

              <div className="p-8 pt-0 flex gap-3 no-print">
                <button
                  onClick={() => setSelectedSettle(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <History size={16} />
                  Print
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
