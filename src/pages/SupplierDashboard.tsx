import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Truck, Package, ShoppingCart, TrendingUp, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SupplierDashboardProps {
  userData: any;
}

export default function SupplierDashboard({ userData }: SupplierDashboardProps) {
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const ordersQuery = query(
      collection(db, 'supply_orders'),
      where('supplierId', '==', auth.currentUser.uid)
    );

    const productsQuery = query(
      collection(db, 'supplies'),
      where('supplierId', '==', auth.currentUser.uid)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalSales = orders
        .filter((o: any) => o.status === 'received')
        .reduce((acc: number, o: any) => acc + o.totalAmount, 0);
      
      setStats(prev => ({
        ...prev,
        totalSales,
        pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
        shippedOrders: orders.filter((o: any) => o.status === 'shipped').length
      }));
      setRecentOrders(orders.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).slice(0, 5));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'supply_orders'));

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalProducts: snapshot.size
      }));
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

  const statCards = [
    { title: 'Total Revenue', value: `RM ${stats.totalSales.toFixed(2)}`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { title: 'Shipped Orders', value: stats.shippedOrders, icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-gray-400 animate-pulse">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Supplier Dashboard</h2>
          <p className="text-gray-400">Welcome back, {userData?.displayName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="text-indigo-400" />
            Recent Orders
          </h3>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                  <div>
                    <p className="font-bold text-white">{order.vendorName}</p>
                    <p className="text-xs text-gray-400">RM {order.totalAmount.toFixed(2)} • {order.items.length} items</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                    order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' :
                    order.status === 'received' ? 'bg-green-500/10 text-green-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-indigo-400" />
            Sales Performance
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentOrders.reverse()}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="createdAt" hide />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `RM${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area type="monotone" dataKey="totalAmount" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
