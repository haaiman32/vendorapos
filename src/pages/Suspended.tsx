import { LogOut, ShieldAlert } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';

export default function Suspended() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-red-500/10"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-red-500" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Account Suspended</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Your account has been suspended by the administrator. 
          If you believe this is a mistake, please contact support or your system administrator.
        </p>
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
