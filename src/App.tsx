import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Support from './pages/Support';
import CashFlow from './pages/CashFlow';
import Suspended from './pages/Suspended';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierSupplies from './pages/SupplierSupplies';
import SupplierOrders from './pages/SupplierOrders';
import VendorSupplies from './pages/VendorSupplies';
import VendorSupplyOrders from './pages/VendorSupplyOrders';
import Layout from './components/Layout';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';

import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubDoc = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Auto-fix: Ensure role exists and is correct for admin emails
        const adminEmails = ['admin@vendora.com'];
        const isAdminEmail = adminEmails.includes(user.email || '');
        
        if (isAdminEmail && data.role?.toLowerCase() !== 'admin') {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(userDocRef, { role: 'admin' });
          // onSnapshot will fire again
          return;
        }
        
        // If it's haaiman and currently admin, change back to vendor as requested
        if (user.email === 'haaiman32@gmail.com' && data.role === 'admin') {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(userDocRef, { role: 'vendor' });
          return;
        }
        
        if (!data.role) {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(userDocRef, { role: 'vendor' });
          // onSnapshot will fire again
          return;
        }

        setUserData(data);
        setLoading(false);
      } else {
        // User exists in Auth but not in Firestore - Auto-create profile fallback
        // Add a delay to prevent race conditions with Register.tsx or Login.tsx creating the doc.
        setTimeout(async () => {
          const { getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const checkDoc = await getDoc(userDocRef);
          
          if (!checkDoc.exists()) {
            const adminEmails = ['admin@vendora.com'];
            const isAdmin = adminEmails.includes(user.email || '');
            
            const newData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              role: isAdmin ? 'admin' : 'vendor',
              status: 'active',
              createdAt: serverTimestamp()
            };
            
            try {
              await setDoc(userDocRef, newData);
              // onSnapshot will fire again with the new data
            } catch (error) {
              console.error("Error auto-creating user profile:", error);
              // Fallback to prevent hang
              setUserData(newData);
              setLoading(false);
            }
          }
        }, 3000);
      }
    }, (error) => {
      // Only handle error if user is still logged in
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
      setLoading(false);
    });

    return () => unsubDoc();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] animate-pulse delay-75"></div>
        
        <div className="relative flex flex-col items-center z-10 transition-all duration-500">
          {/* Abstract spinning rings */}
          <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-indigo-400/50 animate-[spin_1.5s_linear_infinite]"></div>
            {/* Middle ring */}
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-500 border-l-purple-400/50 animate-[spin_2s_linear_infinite_reverse]"></div>
            {/* Inner ring */}
            <div className="absolute inset-4 rounded-full border border-transparent border-t-blue-400 border-r-blue-400/50 animate-[spin_1s_linear_infinite]"></div>
            
            {/* Center Logo 'V' */}
            <div className="text-3xl font-black bg-gradient-to-br from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
              V
            </div>
          </div>
          
          {/* Loading text with glowing effect */}
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-xl font-bold tracking-[0.2em] text-white/90 uppercase drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
              Vendora
            </h2>
            
            {/* Modern progress bar */}
            <div className="w-40 h-1 bg-gray-800/80 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 w-1/2 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] origin-left"></div>
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
            </div>
            
            <p className="text-xs text-indigo-200/50 uppercase tracking-widest font-medium mt-1">
              Initializing...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle suspended users
  if (user && userData?.status === 'suspended') {
    return (
    <LanguageProvider initialLanguage={userData?.language || 'en'}>
      <Router>
        <Routes>
          <Route path="*" element={<Suspended />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

return (
  <LanguageProvider initialLanguage={userData?.language || 'en'}>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={
          userData?.role?.toLowerCase() === 'admin' ? '/dashboard' : 
          userData?.role?.toLowerCase() === 'supplier' ? '/supplier/dashboard' : 
          '/pos'
        } />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={
          userData?.role?.toLowerCase() === 'admin' ? '/dashboard' : 
          userData?.role?.toLowerCase() === 'supplier' ? '/supplier/dashboard' : 
          '/pos'
        } />} />
        
        <Route element={user ? <Layout user={user} userData={userData} /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={
            userData?.role?.toLowerCase() === 'admin' ? <Dashboard /> : 
            userData?.role?.toLowerCase() === 'vendor' ? <Navigate to="/pos" /> :
            userData?.role?.toLowerCase() === 'supplier' ? <Navigate to="/supplier/dashboard" /> :
            <div className="p-8 text-center text-gray-400">Loading user profile...</div>
          } />
          <Route path="/supplier/dashboard" element={
            userData?.role?.toLowerCase() === 'supplier' ? <SupplierDashboard userData={userData} /> : <Navigate to="/" />
          } />
          <Route path="/supplier/supplies" element={
            userData?.role?.toLowerCase() === 'supplier' ? <SupplierSupplies userData={userData} /> : <Navigate to="/" />
          } />
          <Route path="/supplier/orders" element={
            userData?.role?.toLowerCase() === 'supplier' ? <SupplierOrders /> : <Navigate to="/" />
          } />
          <Route path="/vendor/supplies" element={
            userData?.role?.toLowerCase() === 'vendor' ? <VendorSupplies /> : <Navigate to="/" />
          } />
          <Route path="/vendor/supply-orders" element={
            userData?.role?.toLowerCase() === 'vendor' ? <VendorSupplyOrders /> : <Navigate to="/" />
          } />
          <Route path="/pos" element={
            userData?.role?.toLowerCase() === 'vendor' ? <POS /> : 
            userData?.role?.toLowerCase() === 'admin' ? <Navigate to="/dashboard" /> :
            userData?.role?.toLowerCase() === 'supplier' ? <Navigate to="/supplier/dashboard" /> :
            <div className="p-8 text-center text-gray-400">Loading user profile...</div>
          } />
          <Route path="/users" element={
            userData?.role?.toLowerCase() === 'admin' ? <UserManagement /> : <Navigate to="/" />
          } />
          <Route path="/inventory" element={
            (userData?.role?.toLowerCase() === 'vendor' || userData?.role?.toLowerCase() === 'admin') ? <Inventory userData={userData} /> : <Navigate to="/" />
          } />
          <Route path="/reports" element={
            (userData?.role?.toLowerCase() === 'vendor' || userData?.role?.toLowerCase() === 'admin') ? <Reports userData={userData} /> : <Navigate to="/" />
          } />
          <Route path="/settings" element={<Settings userData={userData} />} />
          <Route path="/support" element={<Support userData={userData} />} />
          <Route path="/cashflow" element={
            userData?.role?.toLowerCase() === 'vendor' ? <CashFlow userData={userData} /> : <Navigate to="/dashboard" />
          } />
        </Route>
      </Routes>
    </Router>
  </LanguageProvider>
);
}
