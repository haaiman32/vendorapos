import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { Package, Plus, Trash2, Edit2, Search, Loader2, Image as ImageIcon, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Supply {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  imageURL?: string;
  supplierId: string;
  supplierName: string;
}

const CATEGORIES = ['Raw Materials', 'Packaging', 'Equipment', 'Office Supplies', 'Others'];

interface SupplierSuppliesProps {
  userData: any;
}

export default function SupplierSupplies({ userData }: SupplierSuppliesProps) {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [newSupply, setNewSupply] = useState({ name: '', description: '', price: '', unit: 'pack', category: 'Raw Materials', imageURL: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'supplies'), where('supplierId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supply));
      setSupplies(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'supplies'));

    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!auth.currentUser) return null;
    setUploading(true);
    try {
      const storageRef = ref(storage, `supplies/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'supplies'), {
        ...newSupply,
        price: parseFloat(newSupply.price),
        supplierId: auth.currentUser.uid,
        supplierName: userData?.displayName || 'Unknown Supplier',
        createdAt: serverTimestamp()
      });
      setNewSupply({ name: '', description: '', price: '', unit: 'pack', category: 'Raw Materials', imageURL: '' });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'supplies');
    }
  };

  const handleUpdateSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupply) return;

    try {
      const { id, ...data } = editingSupply;
      await updateDoc(doc(db, 'supplies', id), {
        ...data,
        price: parseFloat(data.price.toString())
      });
      setEditingSupply(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'supplies');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supply?')) return;
    try {
      await deleteDoc(doc(db, 'supplies', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'supplies');
    }
  };

  const filteredSupplies = supplies.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
          <Package className="text-indigo-400" />
          Manage Supplies
        </h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={20} />
          Add New Supply
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search supplies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupplies.map((supply) => (
            <motion.div
              key={supply.id}
              layout
              className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-all"
            >
              <div className="aspect-video relative bg-gray-900 flex items-center justify-center overflow-hidden">
                {supply.imageURL ? (
                  <img src={supply.imageURL} alt={supply.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon size={48} className="text-gray-700" />
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    onClick={() => setEditingSupply(supply)}
                    className="p-2 bg-gray-900/80 rounded-lg text-gray-400 hover:text-indigo-400 backdrop-blur-sm transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(supply.id)}
                    className="p-2 bg-gray-900/80 rounded-lg text-gray-400 hover:text-red-400 backdrop-blur-sm transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-white">{supply.name}</h4>
                    <p className="text-xs text-gray-400">{supply.category}</p>
                  </div>
                  <p className="text-indigo-400 font-bold">RM {supply.price.toFixed(2)}</p>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{supply.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 bg-gray-700 rounded-md text-gray-300">Per {supply.unit}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
          </div>
        )}

        {!loading && filteredSupplies.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No supplies found.
          </div>
        )}
      </div>

      {/* Add/Edit Modals would go here - simplified for now */}
      <AnimatePresence>
        {(isAdding || editingSupply) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-white">
                {isAdding ? 'Add New Supply' : 'Edit Supply'}
              </h3>
              <form onSubmit={isAdding ? handleAddSupply : handleUpdateSupply} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">Supply Name</label>
                  <input
                    type="text"
                    required
                    value={isAdding ? newSupply.name : editingSupply?.name}
                    onChange={(e) => isAdding ? setNewSupply({...newSupply, name: e.target.value}) : setEditingSupply({...editingSupply!, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">Description</label>
                  <textarea
                    value={isAdding ? newSupply.description : editingSupply?.description}
                    onChange={(e) => isAdding ? setNewSupply({...newSupply, description: e.target.value}) : setEditingSupply({...editingSupply!, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">Price (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={isAdding ? newSupply.price : editingSupply?.price}
                      onChange={(e) => isAdding ? setNewSupply({...newSupply, price: e.target.value}) : setEditingSupply({...editingSupply!, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">Unit</label>
                    <input
                      type="text"
                      required
                      value={isAdding ? newSupply.unit : editingSupply?.unit}
                      onChange={(e) => isAdding ? setNewSupply({...newSupply, unit: e.target.value}) : setEditingSupply({...editingSupply!, unit: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. kg, box"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingSupply(null); }}
                    className="flex-1 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg"
                  >
                    {isAdding ? 'Add Supply' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
