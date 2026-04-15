import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export default function Terms() {
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
              <FileText className="text-indigo-500" size={24} />
            </div>
            <h1 className="text-4xl font-bold font-display tracking-tight">Terms of Service</h1>
          </div>

          <div className="space-y-8 text-gray-400 leading-relaxed font-light">
            <section>
              <h2 className="text-white font-bold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Vendora, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-4">2. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-4">3. Platform Usage</h2>
              <p>
                Vendora is provided "as is" for POS and inventory management. You agree not to use the platform for any illegal or unauthorized purpose. You must not interfere with or disrupt the integrity or performance of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-4">4. Limitation of Liability</h2>
              <p>
                Vendora shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, whether in an action in contract or tort.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-4">5. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. We will provide notice of any material changes by posting the new terms on the platform.
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
