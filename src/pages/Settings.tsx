import React, { useState, useEffect } from 'react';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  User, 
  Settings as SettingsIcon, 
  Save, 
  Shield, 
  Bell, 
  CreditCard, 
  Upload, 
  Loader2, 
  Languages, 
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  userData: any;
}

export default function Settings({ userData }: SettingsProps) {
  const [profile, setProfile] = useState({
    username: userData?.username || '',
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    displayName: userData?.displayName || '',
    studentId: userData?.studentId || '',
    mobileNumber: userData?.mobileNumber || '',
    gender: userData?.gender || 'Male',
    businessAddress: userData?.businessAddress || '',
    shippingAddress: userData?.shippingAddress || '',
    photoURL: userData?.photoURL || '',
    language: userData?.language || 'en',
    notifications: userData?.notifications || {
      lowStock: true,
      inactiveUsers: true,
      emailAlerts: true,
      newOrder: true
    }
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [uploading, setUploading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    lowStockThreshold: 5,
    currency: 'RM',
    tax: 0,
    receiptFooter: 'Thank you for your purchase!'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalSettings(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching global settings:", error);
      }
    };
    fetchGlobalSettings();
  }, []);

  const isAdmin = userData?.role?.toLowerCase() === 'admin';
  const isSupplier = userData?.role?.toLowerCase() === 'supplier';

  const handleImageUpload = async (file: File) => {
    if (!auth.currentUser) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setProfile({ ...profile, photoURL: url });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (auth.currentUser) {
        const displayName = `${profile.firstName} ${profile.lastName}`.trim() || profile.username;
        
        await updateProfile(auth.currentUser, {
          displayName: displayName,
          photoURL: profile.photoURL
        });

        const updateData: any = {
          username: profile.username,
          firstName: profile.firstName,
          lastName: profile.lastName,
          displayName: displayName,
          studentId: profile.studentId,
          mobileNumber: profile.mobileNumber,
          gender: profile.gender,
          photoURL: profile.photoURL,
          language: profile.language,
          notifications: profile.notifications
        };

        if (userData?.role?.toLowerCase() === 'supplier') {
          updateData.businessAddress = profile.businessAddress;
        } else if (userData?.role?.toLowerCase() === 'vendor') {
          updateData.shippingAddress = profile.shippingAddress;
        }

        await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);

        setMessage({ type: 'success', text: 'Settings updated successfully!' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const user = auth.currentUser;
      if (user && user.email) {
        // Re-authenticate first
        const credential = EmailAuthProvider.credential(user.email, passwords.current);
        await reauthenticateWithCredential(user, credential);
        
        // Update password
        await updatePassword(user, passwords.new);
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password. Please check your current password.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await setDoc(doc(db, 'settings', 'global'), globalSettings);
      setMessage({ type: 'success', text: 'Global settings updated!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings');
    } finally {
      setLoading(false);
    }
  };

  // Simple translation helper
  const t = (key: string) => {
    const translations: any = {
      en: {
        profileSettings: 'Profile Settings',
        personalInfo: 'Personal Information',
        firstName: 'First Name',
        lastName: 'Last Name',
        username: 'Username',
        email: 'Email Address',
        mobileNumber: 'Mobile Number',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        id: userData?.role?.toLowerCase() === 'vendor' ? 'Student ID' : 'Personal ID',
        residentialAddress: 'Residential Address',
        businessAddress: 'Business Address',
        shippingAddress: 'Shipping Address',
        saveChanges: 'Save Changes',
        language: 'Interface Language',
        security: 'Security & Password',
        notifications: 'Notifications'
      },
      ms: {
        profileSettings: 'Tetapan Profil',
        personalInfo: 'Maklumat Peribadi',
        firstName: 'Nama Pertama',
        lastName: 'Nama Akhir',
        username: 'Nama Pengguna',
        email: 'Alamat Emel',
        mobileNumber: 'Nombor Telefon',
        gender: 'Jantina',
        male: 'Lelaki',
        female: 'Perempuan',
        id: userData?.role?.toLowerCase() === 'vendor' ? 'ID Pelajar' : 'ID Peribadi',
        residentialAddress: 'Alamat Kediaman',
        businessAddress: 'Alamat Perniagaan',
        shippingAddress: 'Alamat Penghantaran',
        saveChanges: 'Simpan Perubahan',
        language: 'Bahasa Antaramuka',
        security: 'Keselamatan & Kata Laluan',
        notifications: 'Notifikasi'
      }
    };
    return translations[profile.language]?.[key] || translations['en'][key];
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="text-indigo-400" />
          {t('profileSettings')}
        </h2>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <User size={18} />
            {t('profileSettings')}
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
              activeTab === 'security' ? 'bg-indigo-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <Lock size={18} />
            {t('security')}
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
              activeTab === 'notifications' ? 'bg-indigo-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <Bell size={18} />
            {t('notifications')}
          </button>
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-gray-800">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-4">Admin Only</p>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <p className="text-xs text-indigo-300">You have administrative access to global system settings.</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <User size={20} className="text-indigo-400" />
                    {t('personalInfo')}
                  </h3>
                  
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center overflow-hidden shadow-2xl">
                        {profile.photoURL ? (
                          <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={48} className="text-gray-600" />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="animate-spin text-white" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-3 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-500 transition-all shadow-xl">
                        <Upload size={20} className="text-white" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">{t('firstName')} *</label>
                        <input
                          type="text"
                          required
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Harith"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">{t('lastName')} *</label>
                        <input
                          type="text"
                          required
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Aiman"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">{t('username')} *</label>
                        <input
                          type="text"
                          required
                          value={profile.username}
                          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="harith_aiman"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">{t('email')}</label>
                        <input
                          type="email"
                          disabled
                          value={userData?.email}
                          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">{t('mobileNumber')} *</label>
                        <input
                          type="tel"
                          required
                          value={profile.mobileNumber}
                          onChange={(e) => setProfile({ ...profile, mobileNumber: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="012-3456789"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">{t('id')}</label>
                        <input
                          type="text"
                          value={profile.studentId}
                          onChange={(e) => setProfile({ ...profile, studentId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder={userData?.role?.toLowerCase() === 'vendor' ? "e.g. 123456" : "e.g. 900101-14-1234"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">{t('gender')}</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="gender"
                            value="Male"
                            checked={profile.gender === 'Male'}
                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                            className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{t('male')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="gender"
                            value="Female"
                            checked={profile.gender === 'Female'}
                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                            className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{t('female')}</span>
                        </label>
                      </div>
                    </div>

                    {userData?.role?.toLowerCase() !== 'admin' && (
                      <div className="space-y-6">
                        {userData?.role?.toLowerCase() === 'supplier' && (
                          <div>
                            <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">{t('businessAddress')}</label>
                            <textarea
                              rows={3}
                              value={profile.businessAddress}
                              onChange={(e) => setProfile({ ...profile, businessAddress: e.target.value })}
                              placeholder="Enter your business/shop address..."
                              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                            />
                          </div>
                        )}
                        {userData?.role?.toLowerCase() === 'vendor' && (
                          <div>
                            <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">{t('shippingAddress')}</label>
                            <textarea
                              rows={3}
                              value={profile.shippingAddress}
                              onChange={(e) => setProfile({ ...profile, shippingAddress: e.target.value })}
                              placeholder="Enter your default shipping address..."
                              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">
                        <div className="flex items-center gap-2">
                          <Languages size={14} />
                          {t('language')}
                        </div>
                      </label>
                      <select
                        value={profile.language}
                        onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      >
                        <option value="en">English</option>
                        <option value="ms">Bahasa Melayu</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                    >
                      <Save size={18} />
                      {t('saveChanges')}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8"
              >
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Lock size={20} className="text-indigo-400" />
                  Change Password
                </h3>
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    For security reasons, you must provide your current password to set a new one. 
                    If you've forgotten your password, please sign out and use the reset link on the login page.
                  </p>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        required
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        required
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock size={18} />
                    Update Password
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8"
              >
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Bell size={20} className="text-indigo-400" />
                  Notification Preferences
                </h3>
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-2xl border border-gray-800">
                    <div>
                      <p className="font-bold">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive important updates via email</p>
                    </div>
                    <button 
                      onClick={() => setProfile({
                        ...profile, 
                        notifications: { ...profile.notifications, emailAlerts: !profile.notifications.emailAlerts }
                      })}
                      className={`w-12 h-6 rounded-full transition-all relative ${profile.notifications.emailAlerts ? 'bg-indigo-600' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.notifications.emailAlerts ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {isAdmin ? (
                    <div className="flex items-center justify-between p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                      <div>
                        <p className="font-bold text-indigo-300">Inactive User Alerts</p>
                        <p className="text-xs text-gray-500">Notify me when a vendor has been inactive for &gt; 30 days</p>
                      </div>
                      <button 
                        onClick={() => setProfile({
                          ...profile, 
                          notifications: { ...profile.notifications, inactiveUsers: !profile.notifications.inactiveUsers }
                        })}
                        className={`w-12 h-6 rounded-full transition-all relative ${profile.notifications.inactiveUsers ? 'bg-indigo-600' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.notifications.inactiveUsers ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  ) : isSupplier ? (
                    <div className="flex items-center justify-between p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                      <div>
                        <p className="font-bold text-blue-300">New Order Alerts</p>
                        <p className="text-xs text-gray-500">Notify me when a vendor places a new supply order</p>
                      </div>
                      <button 
                        onClick={() => setProfile({
                          ...profile, 
                          notifications: { ...profile.notifications, newOrder: !profile.notifications.newOrder }
                        })}
                        className={`w-12 h-6 rounded-full transition-all relative ${profile.notifications.newOrder ? 'bg-indigo-600' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.notifications.newOrder ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                      <div>
                        <p className="font-bold text-amber-300">Low Stock Alerts</p>
                        <p className="text-xs text-gray-500">Notify me when products fall below the threshold</p>
                      </div>
                      <button 
                        onClick={() => setProfile({
                          ...profile, 
                          notifications: { ...profile.notifications, lowStock: !profile.notifications.lowStock }
                        })}
                        className={`w-12 h-6 rounded-full transition-all relative ${profile.notifications.lowStock ? 'bg-indigo-600' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.notifications.lowStock ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={18} />
                    Save Notification Settings
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isAdmin && activeTab === 'profile' && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Shield size={20} className="text-indigo-400" />
                Global System Settings
              </h3>
              <form onSubmit={handleUpdateGlobal} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Low Stock Threshold</label>
                    <input
                      type="number"
                      value={globalSettings.lowStockThreshold}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, lowStockThreshold: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Currency Symbol</label>
                    <input
                      type="text"
                      value={globalSettings.currency}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, currency: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  Save Global Settings
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
