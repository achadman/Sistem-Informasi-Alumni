import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, CheckCircle2, XCircle, Clock, Eye, Loader2,
  Globe, Mail, Phone, MapPin, Shield, AlertCircle, Users, ExternalLink,
  Search, Filter, MoreHorizontal, User, Check
} from 'lucide-react';
import { pb } from '../lib/pb';
import { formatDate } from '../lib/utils';

export default function AdminCompanyVerification() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // pending, all
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await pb.collection('companies').getFullList({ 
        requestKey: null 
      });
      setCompanies(result);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError(err.message || 'Gagal memuat data perusahaan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleVerify = async (companyId, verify) => {
    setProcessingId(companyId);
    try {
      await pb.collection('companies').update(companyId, { verified: verify });
      setCompanies(prev =>
        prev.map(c => c.id === companyId ? { ...c, verified: verify } : c)
      );
      showToast(verify ? 'Perusahaan diverifikasi! Email notifikasi terkirim.' : 'Verifikasi dibatalkan');
    } catch (err) {
      showToast('Gagal memperbarui status.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = companies.filter(c => !c.verified).length;
  const verifiedCount = companies.filter(c => c.verified).length;
  
  const displayed = companies.filter(c => {
    if (tab === 'pending' && c.verified) return false;
    if (tab === 'verified' && !c.verified) return false;
    if (searchQuery && !c.nama.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] -m-8 p-6 lg:p-10 lg:px-[2.5%] font-outfit">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm border backdrop-blur-xl ${
              toast.type === 'error'
                ? 'bg-red-500 text-white border-red-400'
                : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-500" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<Building2 size={28} className="text-blue-600" />}
            iconBg="bg-blue-50"
            label="TOTAL PERUSAHAAN"
            value={companies.length}
          />
          <StatCard 
            icon={<Shield size={28} className="text-emerald-600" />}
            iconBg="bg-emerald-50"
            label="TERVERIFIKASI"
            value={verifiedCount}
          />
          <StatCard 
            icon={<Clock size={28} className="text-amber-600" />}
            iconBg="bg-amber-50"
            label="PENDING"
            value={pendingCount}
            badge={pendingCount > 0 ? "Butuh Tindakan" : null}
          />
        </div>

        {/* Main Table Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex flex-col gap-1">
               <h2 className="text-xl font-bold text-slate-800">Daftar Perusahaan</h2>
               <p className="text-sm text-slate-400">Tinjau dan verifikasi pendaftaran perusahaan.</p>
             </div>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Cari Perusahaan..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-full transition-all" 
                 />
               </div>
               <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                 <button onClick={() => setTab('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Semua</button>
                 <button onClick={() => setTab('pending')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'pending' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Pending</button>
                 <button onClick={() => setTab('verified')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'verified' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Terverifikasi</button>
               </div>
             </div>
          </div>
          
          {/* Table Content */}
          <div className="w-full overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                <p className="text-slate-400 font-medium">Sinkronisasi data...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 size={24} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Tidak Ada Data</h3>
                <p className="text-slate-400 mt-1 text-sm">Belum ada perusahaan yang sesuai kriteria.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Nama Perusahaan</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Industri</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tanggal Update</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Kontak</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayed.map((company, i) => (
                    <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black shrink-0">
                             {company.logo ? (
                               <img src={pb.files.getURL(company, company.logo, { thumb: '100x100' })} alt="" className="w-full h-full object-cover rounded-xl" />
                             ) : company.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm line-clamp-1">{company.nama}</p>
                            <p className="text-[10px] text-slate-400 font-medium">ID: {company.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-600">{company.industri || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-600">{formatDate(company.updated)}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{company.nama_pic || '-'}</p>
                            <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{company.email}</p>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          company.verified 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${company.verified ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                          {company.verified ? 'Terverifikasi' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === company.id ? null : company.id); }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        
                        {/* Dropdown Action Menu */}
                        <AnimatePresence>
                          {openDropdownId === company.id && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-12 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-[30] overflow-hidden"
                            >
                              <Link 
                                to={`/admin/perusahaan/${company.id}`}
                                className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-blue-50 border-b border-slate-50"
                              >
                                <Eye size={16} className="text-blue-500" /> Detail Profil
                              </Link>
                              <button 
                                disabled={processingId === company.id}
                                onClick={() => handleVerify(company.id, !company.verified)} 
                                className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                              >
                                {processingId === company.id ? (
                                   <Loader2 size={16} className="animate-spin text-slate-400" />
                                ) : company.verified ? (
                                   <><XCircle size={16} className="text-amber-500" /> Batalkan Verifikasi</>
                                ) : (
                                   <><CheckCircle2 size={16} className="text-emerald-500" /> Verifikasi Sekarang</>
                                )}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Table Footer */}
          {!loading && displayed.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
              <p>Menampilkan <span className="text-slate-800">{displayed.length}</span> dari <span className="text-slate-800">{companies.length}</span> perusahaan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, badge }) {
  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 flex items-center gap-5 shadow-sm relative overflow-hidden">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-black text-slate-800 leading-none">{value}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase tracking-wider mb-0.5">
              {badge}
            </span>
          )}
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 pointer-events-none"></div>
    </div>
  );
}
