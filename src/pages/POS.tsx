import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { notificationService } from '../services/notificationService';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, QrCode, Banknote, Image as ImageIcon, Printer, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  vendorId: string;
}

interface CartItem extends Product {
  quantity: number;
}

const CATEGORIES = ['All', 'Food', 'Beverage', 'Electronics', 'Clothing', 'Others'];

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QR'>('Cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'products'), where('vendorId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    return () => unsubscribe();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.stock));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = Math.max(0, cashReceived - total);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProcessPayment = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Cash' && cashReceived < total) return;

    try {
      const saleData = {
        total,
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        paymentMethod,
        cashReceived: paymentMethod === 'Cash' ? cashReceived : total,
        change: paymentMethod === 'Cash' ? change : 0,
        vendorId: auth.currentUser?.uid,
        timestamp: serverTimestamp()
      };

      const saleRef = await addDoc(collection(db, 'sales'), saleData);
      
      // Update stock
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const newStock = item.stock - item.quantity;
        await updateDoc(productRef, {
          stock: newStock
        });

        // Trigger low stock check
        if (auth.currentUser) {
          notificationService.checkAndNotifyLowStock(auth.currentUser.uid, item.name, newStock);
        }
      }

      setLastSale({ ...saleData, id: saleRef.id });
      setShowSuccess(true);
      setCart([]);
      setCashReceived(0);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Point of Sale</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ShoppingCart size={18} />
          <span>{cart.length} items in cart</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all shadow-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Select Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`p-0 overflow-hidden rounded-xl border text-left transition-all group flex flex-col ${
                    product.stock <= 0 
                      ? 'bg-gray-800/20 border-gray-800 opacity-50 cursor-not-allowed' 
                      : 'bg-gray-800/40 border-gray-700 hover:border-indigo-500 hover:bg-gray-800'
                  }`}
                >
                  <div className="h-32 w-full bg-gray-900 relative overflow-hidden">
                    {product.imageURL ? (
                      <img src={product.imageURL} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-gray-300 border border-white/10">
                      Stock: {product.stock}
                    </div>
                    <div className="absolute bottom-2 left-2 text-[10px] px-2 py-1 rounded-md bg-indigo-600/80 backdrop-blur-md text-white border border-indigo-400/30">
                      {product.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-gray-100 group-hover:text-indigo-400 transition-colors truncate mb-1">
                      {product.name}
                    </div>
                    <div className="text-lg font-black text-indigo-400">
                      RM {product.price.toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
              {products.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                  No products found. Add some in Inventory.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart & Payment */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart size={20} className="text-indigo-400" />
              Shopping Cart
            </h3>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] mb-6 pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {cart.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-800/40 border border-gray-700"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-gray-400">RM {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-gray-900 rounded-lg p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:text-indigo-400 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:text-indigo-400 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {cart.length === 0 && (
                <div className="py-12 text-center text-gray-500 italic">
                  Cart is empty
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-800 space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-gray-400 font-medium">Total Amount</span>
                <span className="text-3xl font-black text-green-400">RM {total.toFixed(2)}</span>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                      paymentMethod === 'Cash' 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <Banknote size={18} />
                    <span className="font-bold">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('QR')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                      paymentMethod === 'QR' 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <QrCode size={18} />
                    <span className="font-bold">QR</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'Cash' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cash Received</label>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-lg"
                    placeholder="0.00"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Change Due:</span>
                    <span className={`font-bold ${change > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                      RM {change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleProcessPayment}
                disabled={cart.length === 0 || (paymentMethod === 'Cash' && cashReceived < total)}
                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
              <p className="text-gray-400 mb-6">Transaction #{lastSale?.id?.slice(-6).toUpperCase()}</p>
              
              <div className="bg-white text-black rounded-2xl p-6 mb-8 text-left space-y-2 shadow-inner overflow-hidden relative" id="receipt-content">
                {/* Decorative receipt edge */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_20%,#fff_20%)] bg-[length:10px_10px] opacity-10"></div>
                
                <div className="text-center border-b border-gray-200 pb-4 mb-4">
                  <h2 className="text-2xl font-black tracking-tighter">VENDORA</h2>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Official Receipt</p>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Receipt No:</span>
                    <span className="font-mono font-bold">#{lastSale?.id?.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-bold">{lastSale?.timestamp?.toDate ? lastSale.timestamp.toDate().toLocaleString() : new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vendor ID:</span>
                    <span className="font-bold">{lastSale?.vendorId?.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-4 pt-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Items</div>
                  {lastSale?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm mb-1">
                      <span className="flex-1">{item.name} <span className="text-gray-400 text-xs">x{item.quantity}</span></span>
                      <span className="font-mono">RM {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4 space-y-1">
                  <div className="flex justify-between text-lg font-black">
                    <span>TOTAL</span>
                    <span>RM {lastSale?.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Payment Method:</span>
                    <span>{lastSale?.paymentMethod}</span>
                  </div>
                  {lastSale?.paymentMethod === 'Cash' && (
                    <>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Cash Received:</span>
                        <span>RM {lastSale?.cashReceived.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-green-600">
                        <span>Change:</span>
                        <span>RM {lastSale?.change.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center mt-8 pt-4 border-t border-dashed border-gray-200">
                  <p className="text-[10px] text-gray-400 italic">Thank you for shopping with Vendora!</p>
                  <p className="text-[8px] text-gray-300 mt-1">Please keep this receipt for your records.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  title="Open in a new tab to use printing features"
                  className="py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Print
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
