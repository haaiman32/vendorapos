import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Truck, Package, Clock, CheckCircle2, ChevronDown, ChevronUp, Calendar, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';

interface SupplyOrder {
  id: string;
  vendorId: string;
  supplierId: string;
  supplierName: string;
  items: any[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'received' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}

export default function VendorSupplyOrders() {
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'supply_orders'), where('vendorId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyOrder));
      setOrders(data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'supply_orders'));

    return () => unsubscribe();
  }, []);

  const handleConfirmReceived = async (order: SupplyOrder) => {
    try {
      await updateDoc(doc(db, 'supply_orders', order.id), {
        status: 'received',
        updatedAt: serverTimestamp()
      });

      // Notify vendor about status update (self-notification for record)
      await notificationService.notifyOrderStatusUpdate(
        order.vendorId,
        order.id,
        'received',
        order.supplierName
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'supply_orders');
    }
  };

  const totalExpenses = orders
    .filter(o => o.status === 'received')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
          <Truck className="text-indigo-400" />
          My Supply Orders
        </h2>
        
        <div className="bg-indigo-600/10 border border-indigo-500/20 px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Total Supply Expenses</p>
            <p className="text-xl font-bold text-white">RM {totalExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
            <div 
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <Package className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{order.supplierName}</h3>
                  <p className="text-xs text-gray-500">Order ID: {order.id.slice(0, 8)} • {order.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-400">RM {order.totalAmount.toFixed(2)}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                    order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' :
                    order.status === 'received' ? 'bg-green-500/10 text-green-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                {expandedOrder === order.id ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
              </div>
            </div>

            <AnimatePresence>
              {expandedOrder === order.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="border-t border-gray-800"
                >
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Order Details</h4>
                        <div className="space-y-3">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-gray-300">{item.name} x{item.quantity}</span>
                              <span className="text-white font-mono">RM {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-4">
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleConfirmReceived(order)}
                            className="flex items-center justify-center gap-2 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-lg shadow-green-600/20"
                          >
                            <CheckCircle2 size={20} />
                            Confirm Received
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold py-4 bg-yellow-500/10 rounded-xl border border-yellow-500/50">
                            <Clock size={20} />
                            Awaiting Shipment
                          </div>
                        )}
                        {order.status === 'received' && (
                          <div className="flex items-center justify-center gap-2 text-green-400 font-bold py-4 bg-green-500/10 rounded-xl border border-green-500/50">
                            <CheckCircle2 size={20} />
                            Order Received & Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {!loading && orders.length === 0 && (
          <div className="py-12 text-center bg-gray-900/50 border border-gray-800 rounded-3xl">
            <p className="text-gray-500">No supply orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
