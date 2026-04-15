import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  MoreVertical,
  Mail,
  User as UserIcon,
  IdCard,
  Ban,
  CheckCircle,
  Loader2,
  Edit2,
  Upload,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfile {
  uid: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  email: string;
  studentId?: string;
  mobileNumber?: string;
  gender?: string;
  residentialAddress?: string;
  businessAddress?: string;
  shippingAddress?: string;
  photoURL?: string;
  role: string;
  status: 'active' | 'suspended';
  createdAt: any;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log('UserManagement: Setting up listener');
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('UserManagement: Received snapshot', snapshot.size);
      try {
        const usersData = snapshot.docs.map(doc => ({ 
          ...doc.data(),
          uid: doc.id 
        } as UserProfile));
        setUsers(usersData);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('UserManagement: Error processing snapshot', err);
        setError('Failed to process user data.');
        setLoading(false);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { uid, ...data } = editingUser;
      const displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.username || data.displayName;
      
      const updateData: any = {
        username: data.username || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        displayName: displayName,
        studentId: data.studentId || '',
        mobileNumber: data.mobileNumber || '',
        gender: data.gender || 'Male',
        photoURL: data.photoURL || '',
        role: data.role
      };

      if (data.role?.toLowerCase() === 'supplier') {
        updateData.businessAddress = data.businessAddress || '';
      } else if (data.role?.toLowerCase() === 'vendor') {
        updateData.shippingAddress = data.shippingAddress || '';
      }
      
      await updateDoc(doc(db, 'users', uid), updateData);
      setEditingUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${editingUser.uid}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setDeletingUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!editingUser) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${editingUser.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setEditingUser({ ...editingUser, photoURL: url });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.studentId?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="text-gray-400 animate-pulse">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-center p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
        <ShieldAlert className="text-red-500" size={48} />
        <h3 className="text-xl font-bold text-red-500">Error Loading Users</h3>
        <p className="text-gray-400 text-sm max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-indigo-400" />
          User Management
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Personal ID</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 overflow-hidden">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserIcon size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{user.displayName || 'Unnamed User'}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail size={12} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
                      @{user.username || 'n/a'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <IdCard size={16} className="text-gray-500" />
                      {user.studentId || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                      user.role?.toLowerCase() === 'admin' ? 'bg-purple-500/10 text-purple-400' : 
                      user.role?.toLowerCase() === 'supplier' ? 'bg-indigo-500/10 text-indigo-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${
                      user.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {user.status === 'active' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-gray-500 hover:text-indigo-400 transition-colors"
                        title="Edit Profile"
                      >
                        <Edit2 size={18} />
                      </button>
                      {user.role?.toLowerCase() !== 'admin' && (
                        <>
                          <button
                            onClick={() => toggleUserStatus(user.uid, user.status)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              user.status === 'active' 
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                                : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                            }`}
                          >
                            {user.status === 'active' ? <Ban size={14} /> : <CheckCircle size={14} />}
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 italic">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Edit User Profile</h3>
                <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center overflow-hidden">
                      {editingUser.photoURL ? (
                        <img src={editingUser.photoURL} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={32} className="text-gray-600" />
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-500 transition-all shadow-lg">
                      <Upload size={14} className="text-white" />
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
                  <p className="text-[10px] text-gray-500 mt-2">Update user's profile picture</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">First Name</label>
                      <input
                        type="text"
                        value={editingUser.firstName || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Last Name</label>
                      <input
                        type="text"
                        value={editingUser.lastName || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Username</label>
                    <input
                      type="text"
                      value={editingUser.username || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Mobile Number</label>
                      <input
                        type="tel"
                        value={editingUser.mobileNumber || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, mobileNumber: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Personal ID</label>
                      <input
                        type="text"
                        value={editingUser.studentId || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, studentId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Gender</label>
                    <select
                      value={editingUser.gender || 'Male'}
                      onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {editingUser.role?.toLowerCase() !== 'admin' && (
                    <div className="space-y-4">
                      {editingUser.role?.toLowerCase() === 'supplier' && (
                        <div>
                          <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Business Address</label>
                          <textarea
                            rows={2}
                            value={editingUser.businessAddress || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, businessAddress: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                          />
                        </div>
                      )}
                      {editingUser.role?.toLowerCase() === 'vendor' && (
                        <div>
                          <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Shipping Address</label>
                          <textarea
                            rows={2}
                            value={editingUser.shippingAddress || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, shippingAddress: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="vendor">Vendor</option>
                      <option value="supplier">Supplier</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-2">Email (Read-only)</label>
                    <input
                      type="email"
                      disabled
                      value={editingUser.email}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-500 cursor-not-allowed outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-red-500/20 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Delete Account?</h3>
                <p className="text-gray-400 text-sm mb-8">
                  Are you sure you want to delete <span className="text-white font-bold">{deletingUser.displayName || deletingUser.email}</span>? 
                  This action will remove their profile data and cannot be undone.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeletingUser(null)}
                    className="flex-1 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(deletingUser.uid)}
                    className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-600/20"
                  >
                    Delete Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
