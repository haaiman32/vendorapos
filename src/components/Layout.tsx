import { ReactNode, useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Settings, 
  LogOut, 
  User as UserIcon,
  BarChart3,
  Users,
  Home as HomeIcon,
  MessageSquare,
  Wallet,
  Truck,
  Clock,
  Sun,
  Moon,
  Bell,
  Check,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface LayoutProps {
  user: User;
  userData: any;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: any;
}

function NotificationBell({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter((n: any) => !n.read).forEach((n: any) => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notifications');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all border border-gray-700 relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-gray-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                <h3 className="font-bold text-sm">{t('notifications')}</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto text-gray-700 mb-2" size={32} />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div 
                      key={n.id}
                      className={`p-4 border-b border-gray-800/50 transition-colors relative group ${!n.read ? 'bg-indigo-600/5' : 'hover:bg-gray-800/30'}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-bold ${!n.read ? 'text-white' : 'text-gray-400'}`}>
                          {n.title}
                        </h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="p-1 hover:bg-indigo-600/20 rounded text-indigo-400"
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(n.id)}
                            className="p-1 hover:bg-red-600/20 rounded text-red-400"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-gray-600">
                        {n.createdAt?.toDate().toLocaleString()}
                      </span>
                      {!n.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout({ user, userData }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isAdmin = userData?.role?.toLowerCase() === 'admin';
  const isSupplier = userData?.role?.toLowerCase() === 'supplier';
  const isVendor = userData?.role?.toLowerCase() === 'vendor';

  const navItems = isAdmin ? [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('users'), path: '/users', icon: Users },
    { name: t('support'), path: '/support', icon: MessageSquare },
    { name: t('settings'), path: '/settings', icon: Settings },
  ] : isSupplier ? [
    { name: t('dashboard'), path: '/supplier/dashboard', icon: LayoutDashboard },
    { name: t('supplies'), path: '/supplier/supplies', icon: Package },
    { name: t('supplyOrders'), path: '/supplier/orders', icon: Truck },
    { name: t('support'), path: '/support', icon: MessageSquare },
    { name: t('settings'), path: '/settings', icon: Settings },
  ] : [
    { name: t('pos'), path: '/pos', icon: ShoppingCart },
    { name: t('inventory'), path: '/inventory', icon: Package },
    { name: t('buySupplies'), path: '/vendor/supplies', icon: Truck },
    { name: t('supplyOrders'), path: '/vendor/supply-orders', icon: Clock },
    { name: t('cashFlow'), path: '/cashflow', icon: Wallet },
    { name: t('reports'), path: '/reports', icon: BarChart3 },
    { name: t('support'), path: '/support', icon: MessageSquare },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 font-sans">
      {/* Top Bar */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-gray-800">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Vendora {isAdmin ? 'Admin' : isSupplier ? 'Supplier' : 'POS'}</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Smart POS & Inventory</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <NotificationBell userId={user.uid} />
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all border border-gray-700"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link to="/settings" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold">{userData?.displayName || user.email}</span>
              <span className="text-xs text-gray-400 capitalize">{userData?.role}</span>
            </div>
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-gray-700 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                <UserIcon size={20} className="text-gray-400" />
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="space-y-2 sticky top-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
