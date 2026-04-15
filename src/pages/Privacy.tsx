import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
              <Shield className="text-indigo-500" size={24} />
            </div>
            <h1 className="text-4xl font-bold font-display tracking-tight">Privacy Policy</h1>
          </div>

          <div className="space-y-8 text-gray-400 leading-relaxed font-light">
            <section>
              <h2 className="text-white font-bold mb-4">1. Introduction</h2>
              <p>
                At Vendora, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our POS and inventory management platform.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-4">2. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us when you create an account, such as your name, email address, and business details. We also collect transaction data processed through our system to provide you with analytics and reports.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide, operate, and maintain our platform.</li>
                <li>To process your transactions and manage your inventory.</li>
                <li>To send you technical notices, updates, and support messages.</li>
                <li>To analyze usage patterns and improve our services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-bold mb-4">4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-4">5. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at admin@vendora.com.
              </p>
            </section>

            <div className="pt-12 border-t border-white/5 text-[10px] uppercase tracking-widest font-bold text-gray-600">
              Last Updated: April 13, 2026
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
