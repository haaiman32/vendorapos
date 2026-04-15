import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Truck, Package, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, User, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';

interface SupplyOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  supplierId: string;
  items: any[];
  totalAmount: number;
  deliveryFee?: number;
  shippingAddress?: string;
  status: 'pending' | 'shipped' | 'received' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}

export default function SupplierOrders() {
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'supply_orders'), where('supplierId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyOrder));
      setOrders(data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'supply_orders'));

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (order: SupplyOrder, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'supply_orders', order.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Notify vendor about status update
      await notificationService.notifyOrderStatusUpdate(
        order.vendorId,
        order.id,
        newStatus,
        auth.currentUser?.displayName || 'Supplier'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'supply_orders');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
        <Truck className="text-indigo-400" />
        Incoming Supply Orders
      </h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
            <div 
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <User className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{order.vendorName}</h3>
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
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Order Items</h4>
                          <div className="space-y-3">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">{item.name} x{item.quantity}</span>
                                <span className="text-white font-mono">RM {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            {order.deliveryFee && (
                              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-800">
                                <span className="text-gray-500">Delivery Fee</span>
                                <span className="text-white font-mono">RM {order.deliveryFee.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-gray-800">
                              <span className="text-indigo-400">Total</span>
                              <span className="text-indigo-400 font-mono">RM {(order.totalAmount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {order.shippingAddress && (
                          <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <MapPin size={14} />
                              Shipping Address
                            </h4>
                            <p className="text-sm text-white leading-relaxed">{order.shippingAddress}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-center gap-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-2 text-center">Update Status</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(order, 'shipped')}
                              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
                            >
                              <Truck size={18} />
                              Mark Shipped
                            </button>
                          )}
                          {(order.status === 'pending' || order.status === 'shipped') && (
                            <button
                              onClick={() => handleUpdateStatus(order, 'cancelled')}
                              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold transition-all border border-red-600/50"
                            >
                              <XCircle size={18} />
                              Cancel Order
                            </button>
                          )}
                          {order.status === 'received' && (
                            <div className="col-span-2 flex items-center justify-center gap-2 text-green-400 font-bold py-3 bg-green-500/10 rounded-xl border border-green-500/50">
                              <CheckCircle2 size={18} />
                              Order Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="py-12 text-center bg-gray-900/50 border border-gray-800 rounded-3xl">
            <p className="text-gray-500">No orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
