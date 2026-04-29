import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, PlusCircle, MapPin, Clock, Users, ChevronRight,
  Loader2, Calendar, DollarSign, ToggleLeft, ToggleRight,
  Edit3, Trash2, Eye, AlertCircle, Search, Filter, Shield
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import { useLocation } from 'react-router-dom';

const STATUS_COLORS = {
  Aktif: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Tutup: 'bg-red-50 text-red-600 border-red-100',
  Draft: 'bg-slate-100 text-slate-500 border-slate-200',
};

const TIPE_ICONS = {
  'Full-time': '🏢',
  'Part-time': '⏰',
  'Kontrak': '📋',
  'Remote': '🏠',
  'Magang': '🎓',
};

export default function IndustryJobPostings() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // all, Aktif, Tutup, Draft
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [applicantCounts, setApplicantCounts] = useState({});
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightedJobId = searchParams.get('jobId');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        console.log('Current User:', user);
        
        // Find company
        let comp;
        try {
          comp = await pb.collection('companies').getFirstListItem(
            `user="${user.id}" || email="${user.email}"`
          );
          console.log('Found Company Record:', comp);
        } catch (e) {
          console.warn('Company profile not found for this user');
        }
        setCompany(comp);

        // Fetch ALL jobs to identify mismatch
        pb.autoCancellation(false);
        const allJobs = await pb.collection('job_postings').getFullList();

        if (comp) {
          // Filter manually in JS to support both ID and Email mapping
          const myJobs = allJobs.filter(j => 
            j.company === comp.id || 
            j.company === comp.email ||
            j.company === user.email
          );
          setJobs(myJobs);

          // Fetch applicant counts for my jobs
          const counts = {};
          await Promise.all(
            myJobs.map(async (job) => {
              try {
                const apps = await pb.collection('applications').getList(1, 1, {
                  filter: `job="${job.id}"`,
                });
                counts[job.id] = apps.totalItems;
              } catch {
                counts[job.id] = 0;
              }
            })
          );
          setApplicantCounts(counts);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleStatusToggle = async (job) => {
    if (!company?.verified) return; // Prevent action if not verified
    const newStatus = job.status === 'Aktif' ? 'Tutup' : 'Aktif';
    try {
      await pb.collection('job_postings').update(job.id, { status: newStatus });
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await pb.collection('job_postings').delete(deleteModal);
      setJobs(prev => prev.filter(j => j.id !== deleteModal));
      setDeleteModal(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredJobs = tab === 'all' ? jobs : jobs.filter(j => j.status === tab);

  const tabs = [
    { key: 'all', label: 'Semua', count: jobs.length },
    { key: 'Aktif', label: 'Aktif', count: jobs.filter(j => j.status === 'Aktif').length },
    { key: 'Draft', label: 'Draft', count: jobs.filter(j => j.status === 'Draft').length },
    { key: 'Tutup', label: 'Ditutup', count: jobs.filter(j => j.status === 'Tutup').length },
  ];

  const formatGaji = (min, max) => {
    if (!min && !max) return null;
    const fmt = (v) => {
      if (v >= 1000000) return `${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)} Jt`;
      if (v >= 1000) return `${(v / 1000).toFixed(0)} Rb`;
      return v;
    };
    if (min && max) return `Rp ${fmt(min)} - ${fmt(max)}`;
    if (min) return `Mulai Rp ${fmt(min)}`;
    return `Hingga Rp ${fmt(max)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat lowongan kerja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 text-center">Hapus Lowongan?</h3>
              <p className="text-slate-400 text-sm text-center mt-2">
                Tindakan ini tidak dapat dibatalkan. Semua data pelamar terkait juga akan terhapus.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Lowongan Kerja</h1>
          <p className="text-secondary text-sm mt-1 font-medium italic opacity-70">
            Kelola lowongan kerja {company ? <span className="text-brand-primary font-bold">{company.nama}</span> : 'perusahaan Anda'}
          </p>
        </div>
        
        {company ? (
          <Link
            to="/industri/lowongan/buat"
            className="flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-blue-500/20 group hover:scale-[1.02]"
          >
            <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform duration-500">
               <PlusCircle size={14} />
            </div>
            Buat Lowongan
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-6 py-3 bg-main border border-border-subtle rounded-2xl text-secondary opacity-50 text-xs font-bold">
            <Loader2 size={14} className="animate-spin" /> Sedang Menghubungkan...
          </div>
        )}
      </div>

      {/* Verification Warning Banner */}
      {company && !company.verified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4"
        >
          <div className="p-2.5 bg-white rounded-xl shadow-sm text-amber-500">
            <Shield size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-amber-900">Akses Terbatas: Menunggu Verifikasi</h4>
            <p className="text-xs text-amber-700/70 mt-1 leading-relaxed">
              Akun Anda sedang ditinjau oleh Admin. Anda dapat melihat daftar lowongan (jika ada), 
              namun belum dapat membuat lowongan baru atau mengubah status lowongan hingga proses verifikasi selesai.
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-main p-1.5 rounded-2xl border border-border-subtle">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all ${
              tab === t.key
                ? 'bg-surface text-brand-primary shadow-sm border border-border-subtle'
                : 'text-secondary opacity-50 hover:text-secondary hover:opacity-100'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${tab === t.key ? 'bg-brand-primary text-white' : 'bg-main text-secondary'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <div className="premium-card py-24 text-center">
          <div className="w-16 h-16 bg-main rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-border-subtle">
            <Briefcase size={28} className="text-secondary opacity-10" />
          </div>
          <p className="font-black text-primary text-lg tracking-tight">
            {tab === 'all' ? 'Belum ada lowongan' : `Tidak ada lowongan ${tab.toLowerCase()}`}
          </p>
          <p className="text-secondary text-sm mt-2 opacity-60">
            {tab === 'all' ? 'Buat lowongan pertama Anda untuk mulai merekrut alumni' : 'Tidak ada lowongan di kategori ini'}
          </p>
          {tab === 'all' && company?.verified && (
            <Link
              to="/industri/lowongan/buat"
              className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-brand-primary text-white text-xs font-black rounded-xl uppercase tracking-widest hover:shadow-lg transition-all active:scale-95"
            >
              <PlusCircle size={16} /> Buat Sekarang
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job, i) => {
            const gaji = formatGaji(job.gaji_min, job.gaji_max);
            const isExpired = job.deadline && new Date(job.deadline) < new Date();

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`premium-card group hover:scale-[1.01] ${highlightedJobId === job.id ? 'border-brand-primary ring-4 ring-brand-primary/20 bg-blue-50/50 shadow-xl shadow-blue-500/10' : ''}`}
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    {/* Title & Status */}
                    <div className="flex items-center gap-2.5 flex-wrap mb-3">
                      <h3 className="font-black text-primary text-lg tracking-tight group-hover:text-brand-primary transition-colors duration-500">{job.judul}</h3>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${
                        job.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        job.status === 'Tutup' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-main text-secondary border-border-subtle'
                      }`}>
                        {job.status}
                      </span>
                      {isExpired && job.status === 'Aktif' && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black border border-amber-500/20">
                          Deadline Lewat
                        </span>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-secondary opacity-60 font-bold uppercase tracking-wider">
                      {job.tipe_kerja && (
                        <span className="flex items-center gap-2">
                          <Briefcase size={12} className="text-brand-primary opacity-50" /> {job.tipe_kerja}
                        </span>
                      )}
                      {job.lokasi && (
                        <span className="flex items-center gap-2">
                          <MapPin size={12} className="text-brand-primary opacity-50" /> {job.lokasi.split(',')[0]}
                        </span>
                      )}
                      {gaji && (
                        <span className="flex items-center gap-2 text-emerald-500/80">
                          <DollarSign size={12} /> {gaji}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border-subtle">
                    {/* Applicant Count Link */}
                    <Link
                      to={`/industri/lowongan/${job.id}/pelamar`}
                      className="flex items-center gap-2.5 px-5 py-2.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-xl text-xs font-black border border-brand-primary/20 transition-all shadow-sm active:scale-95 group/pelamar"
                    >
                      <Users size={14} className="group-hover/pelamar:scale-110 transition-transform" />
                      {applicantCounts[job.id] || 0} Pelamar
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusToggle(job)}
                        disabled={!company?.verified}
                        className={`p-2.5 rounded-xl transition-all border border-border-subtle hover:scale-110 active:scale-90 ${
                          !company?.verified ? 'text-secondary/20 cursor-not-allowed' :
                          job.status === 'Aktif'
                            ? 'text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/20'
                            : 'text-secondary opacity-30 bg-main hover:opacity-100 hover:bg-surface'
                        }`}
                        title={!company?.verified ? 'Verifikasi diperlukan' : (job.status === 'Aktif' ? 'Tutup lowongan' : 'Aktifkan lowongan')}
                      >
                        {job.status === 'Aktif' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      
                      {company?.verified ? (
                        <Link
                          to={`/industri/lowongan/edit/${job.id}`}
                          className="p-2.5 rounded-xl text-secondary opacity-30 bg-main hover:opacity-100 hover:bg-surface hover:text-brand-primary border border-border-subtle transition-all hover:scale-110 active:scale-90"
                          title="Edit lowongan"
                        >
                          <Edit3 size={18} />
                        </Link>
                      ) : (
                        <div className="p-2.5 text-secondary/20 bg-main rounded-xl border border-border-subtle cursor-not-allowed" title="Verifikasi diperlukan">
                          <Edit3 size={18} />
                        </div>
                      )}

                      <button
                        onClick={() => company?.verified && setDeleteModal(job.id)}
                        disabled={!company?.verified}
                        className={`p-2.5 rounded-xl transition-all border border-border-subtle hover:scale-110 active:scale-90 ${
                          !company?.verified ? 'text-secondary/20 cursor-not-allowed' : 'text-secondary opacity-30 bg-main hover:opacity-100 hover:bg-red-500/10 hover:text-red-500'
                        }`}
                        title={!company?.verified ? 'Verifikasi diperlukan' : 'Hapus lowongan'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
