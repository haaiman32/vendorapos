import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
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
          <h1 className="text-5xl font-bold font-display tracking-tight mb-4">Get in touch.</h1>
          <p className="text-lg text-gray-400 mb-16 font-light">
            Have questions about Vendora? We're here to help you scale your business.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="text-indigo-400" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email Us</p>
                  <a href="mailto:admin@vendora.com" className="text-lg hover:text-indigo-400 transition-colors">admin@vendora.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="text-indigo-400" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Call Us</p>
                  <a href="tel:0174654146" className="text-lg hover:text-indigo-400 transition-colors">017-4654146</a>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="text-indigo-400" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Our Location</p>
                  <p className="text-gray-400 font-light leading-relaxed">
                    UNiKL Jln Tandok, Bangsar,<br />
                    59100 Kuala Lumpur,<br />
                    Federal Territory of Kuala Lumpur
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="text-indigo-400" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Support Hours</p>
                  <p className="text-gray-400 font-light">Monday — Friday<br />9:00 AM — 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24 p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
            <h3 className="text-xl font-bold font-display mb-2">Need immediate support?</h3>
            <p className="text-sm text-gray-400 font-light mb-6">
              Log in to your dashboard to access our priority support system and live chat.
            </p>
            <Link 
              to="/login" 
              className="inline-flex px-6 py-3 bg-white text-black rounded-full font-bold text-xs hover:bg-indigo-500 hover:text-white transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
