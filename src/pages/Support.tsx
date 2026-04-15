import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  User as UserIcon,
  Reply,
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';

interface SupportProps {
  userData: any;
}

interface Ticket {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  subject: string;
  message: string;
  status: 'pending' | 'in-progress' | 'resolved';
  adminReply?: string;
  createdAt: any;
  updatedAt?: any;
}

export default function Support({ userData }: SupportProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isAdmin = userData?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    const reportsRef = collection(db, 'reports');
    let q;

    if (isAdmin) {
      q = query(reportsRef, orderBy('createdAt', 'desc'));
    } else {
      q = query(
        reportsRef, 
        where('vendorId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, userData.uid]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.message) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        vendorId: userData.uid,
        vendorName: userData.displayName || 'Vendor',
        vendorEmail: userData.email,
        subject: newTicket.subject,
        message: newTicket.message,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setNewTicket({ subject: '', message: '' });
      // Show success message or toast
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText) return;

    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'reports', selectedTicket.id), {
        adminReply: replyText,
        status: 'resolved', // Auto-resolve on reply, or let admin choose
        updatedAt: serverTimestamp()
      });

      // Notify vendor
      await notificationService.notifySupportReply(
        selectedTicket.vendorId,
        selectedTicket.subject
      );

      setReplyText('');
      setSelectedTicket(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reports');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'in-progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'resolved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'in-progress': return <Loader2 size={14} className="animate-spin" />;
      case 'resolved': return <CheckCircle2 size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-indigo-400" />
            {isAdmin ? 'Vendor Support Tickets' : 'Support & Bug Reports'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {isAdmin 
              ? 'Review and respond to issues reported by vendors.' 
              : 'Report bugs or ask for help. Our team will get back to you.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form (Vendor) */}
        {!isAdmin && (
          <div className="lg:col-span-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 sticky top-8">
              <h3 className="text-lg font-bold mb-6">Submit New Report</h3>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="e.g. Printer not working"
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    placeholder="Describe the problem in detail..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  Send Report
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Right Column: List or Detail */}
        <div className={`${isAdmin ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
          {selectedTicket && !isAdmin ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900/50 border border-gray-800 rounded-3xl overflow-hidden sticky top-8"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/30">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                  <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Back to List
                </button>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusIcon(selectedTicket.status)}
                  {selectedTicket.status}
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-8">{selectedTicket.subject}</h3>
                
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
                      <UserIcon size={20} className="text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white">You</span>
                        <span className="text-xs text-gray-500">{selectedTicket.createdAt?.toDate().toLocaleString()}</span>
                      </div>
                      <div className="p-5 bg-gray-800/50 rounded-2xl rounded-tl-none text-sm text-gray-300 leading-relaxed border border-gray-700/50">
                        {selectedTicket.message}
                      </div>
                    </div>
                  </div>

                  {selectedTicket.adminReply && (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0">
                        <ShieldAlert size={20} className="text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-emerald-400">Admin Support</span>
                          <span className="text-xs text-gray-500">
                            {selectedTicket.updatedAt?.toDate().toLocaleString()}
                          </span>
                        </div>
                        <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl rounded-tl-none text-sm text-gray-200 leading-relaxed">
                          {selectedTicket.adminReply}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {!isAdmin && <h3 className="text-lg font-bold text-white">Your Support Tickets</h3>}
              <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                {loading ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800">
                    <p className="text-gray-500">No support tickets found.</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <motion.div
                      layout
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                        selectedTicket?.id === ticket.id 
                          ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                          : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status}
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {ticket.createdAt?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {ticket.subject}
                      </h4>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                            <UserIcon size={12} className="text-gray-400" />
                          </div>
                          <span className="text-xs text-gray-400 font-medium">{ticket.vendorName}</span>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                        {ticket.message}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                          {ticket.adminReply ? 'Replied' : 'Waiting'}
                        </span>
                        <ChevronRight size={16} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Reply Modal */}
      <AnimatePresence>
        {isAdmin && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-bold">Reply to Ticket</h3>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <AlertCircle size={20} className="rotate-45" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{selectedTicket.vendorName}</span>
                    <span className="text-[10px] text-gray-500">{selectedTicket.createdAt?.toDate().toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-2">{selectedTicket.subject}</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{selectedTicket.message}</p>
                </div>

                <form onSubmit={handleAdminReply} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Your Response</label>
                    <textarea
                      required
                      rows={6}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your solution here..."
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={18} /> : <Reply size={18} />}
                      Send Reply & Resolve
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldAlert({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
