import { Link } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, ArrowRight, Globe, Smartphone, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div id="homepage-container" className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 selection:text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight font-display">VENDORA</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[13px] font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors">Sign In</Link>
            <Link 
              to="/register" 
              className="px-5 py-2 bg-white text-black text-[13px] font-bold rounded-full hover:bg-indigo-500 hover:text-white transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 md:pt-64 md:pb-40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter uppercase font-display mb-8 leading-[0.95] text-white">
              RESTOCK<br />
              REORDER<br />
              REPEAT
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              Vendora provides the tools you need to manage inventory, 
              sales, and growth in one minimalist interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="px-8 py-4 bg-indigo-600 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all group"
              >
                Start Free Trial
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-sm flex items-center justify-center hover:bg-white/10 transition-all"
              >
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-6">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-indigo-400" size={20} />
              </div>
              <h3 className="text-xl font-bold font-display">Lightning POS</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Process transactions with zero friction. Optimized for speed and ease of use across all devices.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                <Package className="text-indigo-400" size={20} />
              </div>
              <h3 className="text-xl font-bold font-display">Inventory Control</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Real-time stock tracking with intelligent alerts. Manage your catalog with precision.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-indigo-400" size={20} />
              </div>
              <h3 className="text-xl font-bold font-display">Deep Analytics</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Understand your business through data. Detailed reports and performance metrics at your fingertips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <div className="text-3xl font-bold font-display mb-1">500+</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Vendors</div>
          </div>
          <div>
            <div className="text-3xl font-bold font-display mb-1">RM 2M+</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Processed</div>
          </div>
          <div>
            <div className="text-3xl font-bold font-display mb-1">99.9%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Uptime</div>
          </div>
          <div>
            <div className="text-3xl font-bold font-display mb-1">24/7</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Support</div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 tracking-tight">
              Solutions for every <br />
              <span className="text-gray-500">type of business.</span>
            </h2>
            <p className="text-gray-400 max-w-xl font-light">
              Whether you're selling coffee, clothes, or consulting, 
              Vendora adapts to your unique workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.04] transition-all">
              <h4 className="text-lg font-bold font-display mb-4">Retail & Boutiques</h4>
              <p className="text-gray-400 text-sm font-light leading-relaxed">
                Manage thousands of SKUs, track variants, and handle returns with ease. 
                Perfect for clothing stores, electronics, and gift shops.
              </p>
            </div>
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.04] transition-all">
              <h4 className="text-lg font-bold font-display mb-4">Food & Beverage</h4>
              <p className="text-gray-400 text-sm font-light leading-relaxed">
                Quick-service interface for cafes and food stalls. 
                Track ingredients and manage peak-hour rushes without breaking a sweat.
              </p>
            </div>
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.04] transition-all">
              <h4 className="text-lg font-bold font-display mb-4">Service Providers</h4>
              <p className="text-gray-400 text-sm font-light leading-relaxed">
                Ideal for barbers, salons, and repair shops. 
                Combine product sales with service tracking in one unified system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 tracking-tight">
              Simple, transparent pricing.
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto font-light">
              Choose the plan that fits your current scale. 
              Upgrade as you grow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 border border-white/5 rounded-3xl flex flex-col">
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Starter</h4>
                <div className="text-3xl font-bold font-display">Free</div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="text-sm text-gray-400 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  Up to 50 products
                </li>
                <li className="text-sm text-gray-400 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  Basic analytics
                </li>
                <li className="text-sm text-gray-400 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  Single user
                </li>
              </ul>
              <Link to="/register" className="w-full py-3 bg-white/5 border border-white/10 rounded-full text-center text-sm font-bold hover:bg-white/10 transition-all">
                Get Started
              </Link>
            </div>
            <div className="p-8 border-2 border-indigo-600 rounded-3xl flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Most Popular
              </div>
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Pro</h4>
                <div className="text-3xl font-bold font-display">RM 49<span className="text-sm text-gray-500">/mo</span></div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="text-sm text-gray-300 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  Unlimited products
                </li>
                <li className="text-sm text-gray-300 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  Advanced reporting
                </li>
                <li className="text-sm text-gray-300 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  Up to 5 staff accounts
                </li>
                <li className="text-sm text-gray-300 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  Inventory alerts
                </li>
              </ul>
              <Link to="/register" className="w-full py-3 bg-indigo-600 rounded-full text-center text-sm font-bold hover:bg-indigo-500 transition-all">
                Start Free Trial
              </Link>
            </div>
            <div className="p-8 border border-white/5 rounded-3xl flex flex-col">
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Enterprise</h4>
                <div className="text-3xl font-bold font-display">Custom</div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="text-sm text-gray-400 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  Multi-store management
                </li>
                <li className="text-sm text-gray-400 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  API access
                </li>
                <li className="text-sm text-gray-400 font-light flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  Dedicated support
                </li>
              </ul>
              <Link to="/contact" className="w-full py-3 bg-white/5 border border-white/10 rounded-full text-center text-sm font-bold hover:bg-white/10 transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-display mb-8 tracking-tight">
            Ready to scale?
          </h2>
          <p className="text-lg text-gray-400 mb-12 max-w-xl mx-auto font-light">
            Join the next generation of vendors building their future on Vendora.
          </p>
          <Link 
            to="/register" 
            className="inline-flex px-10 py-4 bg-white text-black rounded-full font-bold text-sm hover:bg-indigo-500 hover:text-white transition-all"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-lg font-bold tracking-tight font-display">VENDORA</span>
            <p className="text-xs text-gray-500 max-w-xs font-light">
              Building the future of micro-business commerce. 
              Simple, powerful, and built for growth.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-6">
            <div className="flex items-center gap-8 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <div className="flex items-center gap-6">
              <Globe size={18} className="text-gray-600 hover:text-white cursor-pointer transition-colors" />
              <Smartphone size={18} className="text-gray-600 hover:text-white cursor-pointer transition-colors" />
              <Zap size={18} className="text-gray-600 hover:text-white cursor-pointer transition-colors" />
            </div>
            <div className="text-[10px] text-gray-600 font-medium">
              © 2026 Vendora POS. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
