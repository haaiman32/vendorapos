import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalSalesToday: 0,
    numUsers: 0,
    stockValue: 0,
    lowStockCount: 0
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to Vendors (for the dropdown)
    const qVendors = query(collection(db, 'users'), where('role', '==', 'vendor'));
    const unsubVendors = onSnapshot(qVendors, (snapshot) => {
      const vendorList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // 2. Listen to Users (Global Count)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, numUsers: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => {
      unsubVendors();
      unsubUsers();
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // 3. Listen to Products (Filtered by Vendor if selected)
    const productsRef = collection(db, 'products');
    const qProducts = selectedVendorId === 'all' 
      ? productsRef 
      : query(productsRef, where('vendorId', '==', selectedVendorId));

    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      let totalValue = 0;
      let lowStock = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalValue += (data.price || 0) * (data.stock || 0);
        if ((data.stock || 0) <= 5) lowStock++;
      });
      setStats(prev => ({ ...prev, stockValue: totalValue, lowStockCount: lowStock }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // 4. Listen to Sales (Last 7 Days, Filtered by Vendor if selected)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    
    const salesRef = collection(db, 'sales');
    let qSales;
    
    if (selectedVendorId === 'all') {
      qSales = query(
        salesRef,
        where('timestamp', '>=', Timestamp.fromDate(weekAgo)),
        orderBy('timestamp', 'asc')
      );
    } else {
      qSales = query(
        salesRef,
        where('vendorId', '==', selectedVendorId),
        where('timestamp', '>=', Timestamp.fromDate(weekAgo)),
        orderBy('timestamp', 'asc')
      );
    }
    
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalesData(sales);
      
      // Calculate today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTotal = sales
        .filter((s: any) => s.timestamp?.toDate() >= today)
        .reduce((sum, s: any) => sum + (s.total || 0), 0);
        
      setStats(prev => ({ ...prev, totalSalesToday: todayTotal }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sales');
    });

    return () => {
      unsubProducts();
      unsubSales();
    };
  }, [selectedVendorId]);

  // Process chart data from real sales
  const getChartData = () => {
    const dailyTotals: Record<string, number> = {};
    const labels: string[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString([], { weekday: 'short' });
      labels.push(label);
      dailyTotals[d.toLocaleDateString()] = 0;
    }

    salesData.forEach((sale: any) => {
      const dateKey = sale.timestamp?.toDate().toLocaleDateString();
      if (dailyTotals[dateKey] !== undefined) {
        dailyTotals[dateKey] += sale.total || 0;
      }
    });

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'Daily Sales (RM)',
          data: Object.values(dailyTotals),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          font: { size: 10 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          font: { size: 10 },
        },
      },
    },
  };

  const statCards = [
    { name: 'Total Sales (Today)', value: `RM ${stats.totalSalesToday.toFixed(2)}`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { name: 'Number of Users', value: stats.numUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Stock Value', value: `RM ${stats.stockValue.toFixed(2)}`, icon: Package, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { name: 'Low Stock Items', value: stats.lowStockCount, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Admin Overview</h2>
          <p className="text-sm text-gray-400 mt-1">
            {selectedVendorId === 'all' 
              ? 'Viewing global performance across all vendors' 
              : `Viewing performance for ${vendors.find(v => v.id === selectedVendorId)?.displayName || 'selected vendor'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
            <Users size={16} className="text-gray-500 mr-2" />
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
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors border border-gray-700">
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-green-400">
                <ArrowUpRight size={14} />
                12%
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-1">{stat.name}</div>
            <div className="text-2xl font-black">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Sales Performance</h3>
            <select className="bg-gray-800 border border-gray-700 text-xs rounded-lg px-3 py-2 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6">Recent Sales</h3>
          <div className="space-y-4">
            {[...salesData].reverse().slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-800">
                <div>
                  <div className="text-sm font-bold">RM {sale.total.toFixed(2)}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {sale.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 font-bold">
                  {sale.paymentMethod}
                </div>
              </div>
            ))}
            {salesData.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-sm">
                No sales recorded today.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
