import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon, 
  Filter,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Sale {
  id: string;
  total: number;
  items: any[];
  paymentMethod: string;
  vendorId: string;
  timestamp: Timestamp;
}

interface ReportsProps {
  userData: any;
}

export default function Reports({ userData }: ReportsProps) {
  const { theme } = useTheme();
  const [sales, setSales] = useState<Sale[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days

  const isAdmin = userData?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    
    const qVendors = query(collection(db, 'users'), where('role', '==', 'vendor'));
    const unsubVendors = onSnapshot(qVendors, (snapshot) => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubVendors();
  }, [isAdmin]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    if (dateRange !== '1') {
      startDate.setDate(startDate.getDate() - (parseInt(dateRange) - 1));
    }
    
    let q;
    if (isAdmin) {
      if (selectedVendorId === 'all') {
        q = query(
          collection(db, 'sales'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'asc')
        );
      } else {
        q = query(
          collection(db, 'sales'),
          where('vendorId', '==', selectedVendorId),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'asc')
        );
      }
    } else {
      q = query(
        collection(db, 'sales'),
        where('vendorId', '==', auth.currentUser.uid),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      setSales(salesData);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sales'));

    return () => unsubscribe();
  }, [dateRange, selectedVendorId, isAdmin]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = sales.length;
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Prepare Chart Data
  const chartData = {
    labels: sales.map(s => s.timestamp.toDate().toLocaleDateString()),
    datasets: [
      {
        label: 'Daily Revenue',
        data: sales.map(s => s.total),
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129, 140, 248, 0.2)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#9ca3af',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: theme === 'dark' ? '#6b7280' : '#707eae', font: { size: 10 } }
      },
      y: {
        grid: { color: theme === 'dark' ? '#1f2937' : '#e2e8f0' },
        ticks: { color: theme === 'dark' ? '#6b7280' : '#707eae', font: { size: 10 } }
      }
    }
  };

  // Top Products Analysis
  const productSales: Record<string, { quantity: number, revenue: number }> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.name]) {
        productSales[item.name] = { quantity: 0, revenue: 0 };
      }
      productSales[item.name].quantity += item.quantity;
      productSales[item.name].revenue += item.price * item.quantity;
    });
  });

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 5);

  // Payment Method Analysis
  const paymentData = sales.reduce((acc, sale) => {
    if (sale.paymentMethod === 'Cash') acc.cash += sale.total;
    else if (sale.paymentMethod === 'QR') acc.qr += sale.total;
    return acc;
  }, { cash: 0, qr: 0 });

  const doughnutData = {
    labels: ['Cash', 'QR'],
    datasets: [
      {
        data: [paymentData.cash, paymentData.qr],
        backgroundColor: ['#10b981', '#3b82f6'],
        borderColor: ['#064e3b', '#1e3a8a'],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: theme === 'dark' ? '#9ca3af' : '#707eae',
          font: { size: 10 },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = paymentData.cash + paymentData.qr;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` RM ${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Total', 'Payment Method', 'Items'];
    const rows = sales.map(s => [
      s.id,
      s.timestamp.toDate().toLocaleString(),
      s.total.toFixed(2),
      s.paymentMethod,
      s.items.map(i => `${i.name} (x${i.quantity})`).join('; ')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendora_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="text-indigo-400" />
          Advanced Reports
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
              <Filter size={16} className="text-gray-500 mr-2" />
              <select 
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="bg-transparent text-sm outline-none cursor-pointer text-gray-300"
              >
                <option value="all" className="bg-gray-900">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id} className="bg-gray-900">{vendor.displayName}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
            <CalendarIcon size={16} className="text-gray-500 mr-2" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-sm outline-none cursor-pointer text-gray-300"
            >
              <option value="1" className="bg-gray-900">Today</option>
              <option value="7" className="bg-gray-900">Last 7 Days</option>
              <option value="30" className="bg-gray-900">Last 30 Days</option>
              <option value="90" className="bg-gray-900">Last 90 Days</option>
            </select>
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-indigo-400 mb-4">
            <TrendingUp size={24} />
            <span className="text-sm font-bold uppercase tracking-wider">Total Revenue</span>
          </div>
          <div className="text-3xl font-black">RM {totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-gray-500 mt-2">Gross sales in selected period</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-green-400 mb-4">
            <ShoppingBag size={24} />
            <span className="text-sm font-bold uppercase tracking-wider">Transactions</span>
          </div>
          <div className="text-3xl font-black">{totalTransactions}</div>
          <p className="text-xs text-gray-500 mt-2">Completed orders</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-blue-400 mb-4">
            <CreditCard size={24} />
            <span className="text-sm font-bold uppercase tracking-wider">Avg. Order</span>
          </div>
          <div className="text-3xl font-black">RM {avgOrderValue.toFixed(2)}</div>
          <p className="text-xs text-gray-500 mt-2">Average revenue per sale</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-400" />
              Sales Trend
            </h3>
          </div>
          <div className="h-[300px]">
            {sales.length > 0 ? (
              <Line data={chartData} options={chartOptions as any} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 italic">
                No data available for chart
              </div>
            )}
          </div>
        </div>

        {/* Top Products & Payment Methods */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <PieChartIcon size={18} className="text-indigo-400" />
              Top Products
            </h3>
            <div className="space-y-4">
              {topProducts.map(([name, stats], idx) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-indigo-400 border border-gray-700">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{name}</div>
                      <div className="text-[10px] text-gray-500">RM {stats.revenue.toFixed(2)} revenue</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-indigo-400">
                    {stats.quantity} units
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="py-12 text-center text-gray-500 italic text-sm">
                  No sales data yet
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-400" />
              Payment Methods
            </h3>
            <div className="h-[200px]">
              {sales.length > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions as any} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 italic text-sm">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Cash</p>
                <p className="text-sm font-bold text-emerald-400">RM {paymentData.cash.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">QR</p>
                <p className="text-sm font-bold text-blue-400">RM {paymentData.qr.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold">Transaction History</h3>
          <div className="text-xs text-gray-500">Showing {sales.length} records</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[...sales].reverse().map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{sale.timestamp.toDate().toLocaleDateString()}</div>
                    <div className="text-[10px] text-gray-500">{sale.timestamp.toDate().toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-300 max-w-xs truncate">
                      {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                      sale.paymentMethod === 'Cash' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-indigo-400">
                    RM {sale.total.toFixed(2)}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500 italic">
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
