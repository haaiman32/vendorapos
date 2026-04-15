import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { ShoppingCart, Search, Package, Loader2, Image as ImageIcon, Plus, Minus, X, CheckCircle2, MapPin, Truck, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';

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

interface CartItem extends Supply {
  quantity: number;
}

export default function VendorSupplies() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [isCustomAddress, setIsCustomAddress] = useState(false);

  const DEFAULT_ADDRESS = "Hostel UNiKL Jln Tandok, Bangsar, 59100 Kuala Lumpur, Federal Territory of Kuala Lumpur";
  const DELIVERY_FEE = 5;

  useEffect(() => {
    // Set initial shipping address from user profile or default
    const fetchUserAddress = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.shippingAddress) {
            setShippingAddress(data.shippingAddress);
          } else if (data.address) {
            setShippingAddress(data.address);
          } else {
            setShippingAddress(DEFAULT_ADDRESS);
          }
        }
      }
    };
    fetchUserAddress();
    const q = query(collection(db, 'supplies'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supply));
      setSupplies(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'supplies'));

    return () => unsubscribe();
  }, []);

  const addToCart = (supply: Supply) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === supply.id);
      if (existing) {
        return prev.map(item => item.id === supply.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...supply, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const grandTotal = totalAmount + DELIVERY_FEE;

  const handlePlaceOrder = async () => {
    if (!auth.currentUser || cart.length === 0) return;

    try {
      // Group items by supplier
      const supplierGroups = cart.reduce((acc: any, item) => {
        if (!acc[item.supplierId]) acc[item.supplierId] = { items: [], total: 0, supplierName: item.supplierName };
        acc[item.supplierId].items.push(item);
        acc[item.supplierId].total += item.price * item.quantity;
        return acc;
      }, {});

      for (const supplierId in supplierGroups) {
        const group = supplierGroups[supplierId];
        const orderRef = await addDoc(collection(db, 'supply_orders'), {
          vendorId: auth.currentUser.uid,
          vendorName: auth.currentUser.displayName || 'Vendor',
          supplierId,
          supplierName: group.supplierName,
          items: group.items.map((i: any) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          totalAmount: group.total + DELIVERY_FEE,
          deliveryFee: DELIVERY_FEE,
          shippingAddress: shippingAddress,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Notify supplier
        await notificationService.notifyNewOrder(
          supplierId,
          auth.currentUser.displayName || 'A Vendor',
          orderRef.id
        );
      }

      setCart([]);
      setIsCartOpen(false);
      setShowConfirmation(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'supply_orders');
    }
  };

  const filteredSupplies = supplies.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
          <ShoppingCart className="text-indigo-400" />
          Browse Supplies
        </h2>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
        >
          <ShoppingCart size={20} />
          View Cart
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs border-2 border-gray-900">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by name, category or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSupplies.map((supply) => (
            <motion.div
              key={supply.id}
              layout
              className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="aspect-video relative bg-gray-900 flex items-center justify-center overflow-hidden">
                {supply.imageURL ? (
                  <img src={supply.imageURL} alt={supply.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon size={40} className="text-gray-700" />
                )}
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] px-2 py-1 bg-indigo-600/80 backdrop-blur-sm rounded-md text-white font-bold uppercase">
                    {supply.category}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-2">
                  <h4 className="font-bold text-white line-clamp-1">{supply.name}</h4>
                  <p className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                    <Package size={12} />
                    {supply.supplierName}
                  </p>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{supply.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-lg font-bold text-white">RM {supply.price.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Per {supply.unit}</p>
                  </div>
                  <button
                    onClick={() => addToCart(supply)}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Plus size={20} />
                  </button>
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
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-md bg-gray-900 h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="text-indigo-400" />
                  Your Supply Cart
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                    <ShoppingCart size={64} className="opacity-20" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                      <div className="w-16 h-16 rounded-lg bg-gray-900 flex-shrink-0 overflow-hidden">
                        {item.imageURL ? (
                          <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-400">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{item.supplierName}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-400 hover:text-white">
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-400 hover:text-white">
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-indigo-400">RM {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400 font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-white">RM {totalAmount.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setShowConfirmation(true)}
                  disabled={cart.length === 0}
                  className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Truck className="text-indigo-400" />
                  Confirm Order
                </h3>
                <button onClick={() => setShowConfirmation(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                    <MapPin size={14} />
                    Shipping Address
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    placeholder="Enter delivery address..."
                  />
                  <div className="mt-2 flex gap-2">
                    <button 
                      onClick={() => setShippingAddress(DEFAULT_ADDRESS)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase"
                    >
                      Use Default
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/30 rounded-2xl border border-gray-800 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Order Summary</p>
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.name} x{item.quantity}</span>
                      <span className="text-white">RM {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-700 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="text-white">RM {totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Delivery Fee</span>
                      <span className="text-white">RM {DELIVERY_FEE.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                      <span className="text-white">Total</span>
                      <span className="text-indigo-400">RM {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all"
                >
                  Back to Cart
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="flex-[2] py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  Confirm & Pay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 bg-green-600 text-white rounded-full font-bold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            Order placed successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
