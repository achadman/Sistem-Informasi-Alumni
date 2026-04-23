import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Search, MapPin, DollarSign, Building2,
  Clock, CheckCircle2, ChevronRight, X, UploadCloud,
  Loader2, AlertCircle, Calendar
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';

const ApplyJobModal = ({ job, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [catatan, setCatatan] = useState('');

  const [alumniData, setAlumniData] = useState(null);
  const [isDataComplete, setIsDataComplete] = useState(false);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const record = await pb.collection('alumni').getFirstListItem(`nim="${user?.username}"`);
        setAlumniData(record);
        if (record.prodi && record.ipk > 0) {
          setIsDataComplete(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.username) fetchAlumni();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alumniData?.id) {
      setError('Data alumni tidak ditemukan.');
      return;
    }
    if (!file && !alumniData.cv) {
      setError('Anda harus mengunggah CV untuk melamar lowongan ini.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('alumni', alumniData.id);
      formData.append('job', job.id);
      formData.append('company', job.company);
      formData.append('status', 'Pending');
      if (catatan) formData.append('catatan', catatan);
      if (file) formData.append('surat_lamaran', file);

      await pb.collection('applications').create(formData);
      onSuccess();
    } catch (err) {
      setError('Gagal mengirim lamaran.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-800"
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Lamar Lowongan</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{job.judul}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-600 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {!isDataComplete ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 mb-6">
              <div className="flex gap-4">
                <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={24} />
                <div>
                  <p className="font-black text-amber-900 dark:text-amber-200">Profil Belum Lengkap</p>
                  <p className="text-amber-700/80 dark:text-amber-400/80 text-sm mt-1 mb-4 font-medium">
                    Lengkapi Program Studi dan IPK Anda di menu Profil Saya agar perusahaan dapat menilai kualifikasi Anda.
                  </p>
                  <a href="/profile" className="inline-flex px-6 py-2.5 bg-amber-600 dark:bg-amber-500 hover:bg-amber-700 dark:hover:bg-amber-400 text-white text-xs font-black rounded-xl transition-all uppercase tracking-wider">
                    Lengkapi Sekarang
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <form id="apply-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl text-sm font-bold flex items-center gap-3">
                  <AlertCircle size={18} /> {error}
                </div>
              )}
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Unggah CV Baru (PDF)</label>
                <div 
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                  onClick={() => document.getElementById('cv-upload').click()}
                >
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud size={32} />
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                    {file ? file.name : (alumniData?.cv ? 'Sudah ada CV di profil' : 'Klik untuk Unggah PDF')}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">Format PDF, Maksimal 5MB</p>
                  <input 
                    id="cv-upload" 
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>
                {alumniData?.cv && !file && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1 italic flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Menggunakan CV tersimpan di database profil.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Pesan Tambahan (Opsional)</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 font-medium text-sm resize-none transition-all leading-relaxed"
                  placeholder="Ceritakan mengapa Anda cocok untuk posisi ini..."
                />
              </div>
            </form>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
          >
            Batal
          </button>
          <button
            form="apply-form"
            type="submit"
            disabled={loading || !isDataComplete}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-3 shadow-xl shadow-blue-200 dark:shadow-none"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Kirim Lamaran</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function AlumniJobs() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchJobsAndApplications = async () => {
      try {
        // 1. Fetch jobs
        const jobsResult = await pb.collection('job_postings').getFullList({
          expand: 'company',
        });
        
        // 2. Identify unique company identifiers
        const companyIds = [...new Set(jobsResult.map(j => j.company))].filter(Boolean);

        // 3. Fetch companies manually by email/ID
        const companiesData = await Promise.all(
          companyIds.map(async (idOrEmail) => {
            try {
              return await pb.collection('companies').getFirstListItem(`email="${idOrEmail}"`);
            } catch {
              try {
                return await pb.collection('companies').getOne(idOrEmail);
              } catch {
                return null;
              }
            }
          })
        );

        const companyMap = {};
        companiesData.filter(Boolean).forEach(c => {
          companyMap[c.email] = c;
          companyMap[c.id] = c;
        });

        const finalJobs = jobsResult.map(job => ({
          ...job,
          expand: {
            ...job.expand,
            company: companyMap[job.company] || null
          }
        }));

        setJobs(finalJobs);
        if (finalJobs.length > 0 && !selectedJob) setSelectedJob(finalJobs[0]);
        setFetchError(null);

        // 4. Fetch user application status
        if (user?.id) {
          try {
            const alumniRecord = await pb.collection('alumni').getFirstListItem(`user="${user.id}" || nim="${user.username}"`);
            if (alumniRecord) {
              const apps = await pb.collection('applications').getFullList({
                filter: `@request.auth.id != "" && alumni="${alumniRecord.id}"`,
                fields: 'job'
              });
              setAppliedJobIds(new Set(apps.map(a => a.job)));
            }
          } catch (e) { console.warn('App status check skipped'); }
        }
      } catch (err) {
        console.error('Fetch Error:', err);
        setFetchError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchJobsAndApplications();
  }, [user]);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredJobs = jobs.filter(job => 
    job.judul.toLowerCase().includes(search.toLowerCase()) || 
    job.expand?.company?.nama.toLowerCase().includes(search.toLowerCase())
  );

  const formatGaji = (min, max) => {
    if (!min && !max) return 'Gaji tidak ditampilkan';
    const fmt = (v) => {
      if (v >= 1000000) return `${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)} Jt`;
      if (v >= 1000) return `${(v / 1000).toFixed(0)} Rb`;
      return v;
    };
    if (min && max) return `Rp ${fmt(min)} - ${fmt(max)}`;
    if (min) return `Min Rp ${fmt(min)}`;
    return `Maks Rp ${fmt(max)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-50 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin shadow-lg" />
          <p className="text-slate-400 dark:text-slate-600 font-black text-sm uppercase tracking-widest">Memuat Bursa Karir...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="p-6 bg-red-50 text-red-600 rounded-[2rem] border border-red-100 font-bold max-w-md text-center">
          <p className="text-lg mb-2">Terjadi Kesalahan</p>
          <p className="text-sm opacity-80 font-medium">{fetchError}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
        >
          Coba Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 bg-emerald-500/10 backdrop-blur-lg text-emerald-500 border border-emerald-500/20 rounded-2xl shadow-2xl font-black text-sm"
          >
            <CheckCircle2 size={20} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && selectedJob && (
          <ApplyJobModal 
            job={selectedJob} 
            onClose={() => setShowApplyModal(false)}
            onSuccess={() => {
              setShowApplyModal(false);
              showToastMsg('Lamaran Anda Berhasil Terkirim!');
              setAppliedJobIds(prev => new Set([...prev, selectedJob.id]));
            }}
          />
        )}
      </AnimatePresence>

      {/* Hero Header - Reduced size */}
      <div className="relative bg-brand-primary p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/10 overflow-hidden group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none group-hover:bg-white/10 transition-all duration-1000"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 leading-tight text-white">Eksplorasi Karir Alumni</h1>
            <p className="text-white/70 font-medium max-w-lg text-sm leading-relaxed">
              Hubungkan diri Anda dengan mitra industri terpercaya.
            </p>
          </div>
          
          <div className="w-full lg:max-w-md bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-inner">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={18} />
              <input 
                type="text"
                placeholder="Cari posisi atau perusahaan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 bg-white text-slate-900 rounded-xl shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-400/30 border-none font-bold text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Job Cards List */}
        <div className="lg:col-span-5 space-y-4 max-h-[900px] overflow-y-auto custom-scrollbar pr-3">
          {filteredJobs.length === 0 ? (
           <div className="premium-card p-16 text-center">
             <div className="w-20 h-20 bg-main rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="text-secondary opacity-20" size={40} />
             </div>
             <p className="font-black text-primary text-xl tracking-tight">Lowongan Tidak Ditemukan</p>
             <p className="text-secondary text-sm mt-2 font-medium">Coba gunakan kata kunci pencarian yang berbeda.</p>
           </div> 
          ) : (
            filteredJobs.map(job => {
              const company = job.expand?.company;
              const isApplied = appliedJobIds.has(job.id);
              const isActive = selectedJob?.id === job.id;

              const createdDate = job.created ? new Date(job.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';

              return (
                <motion.div 
                  layout
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-5 rounded-[2rem] border cursor-pointer transition-all duration-500 relative group overflow-hidden ${
                    isActive 
                      ? 'bg-surface border-brand-primary shadow-xl shadow-blue-500/5' 
                      : 'bg-surface border-border-subtle hover:border-brand-primary/30 hover:shadow-soft hover:translate-x-1'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>}
                  
                  <div className="flex gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-main border border-border-subtle shrink-0 overflow-hidden flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform duration-500">
                      {company?.logo ? (
                        <img src={pb.files.getUrl(company, company.logo)} alt={company.nama} className="w-full h-full object-contain" />
                      ) : (
                        <Building2 size={20} className="text-secondary opacity-30" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-black tracking-tight text-sm truncate ${isActive ? 'text-brand-primary' : 'text-primary'}`}>
                          {job.judul}
                        </h3>
                        <span className="text-[9px] font-black text-secondary opacity-40 shrink-0 uppercase tracking-widest">{createdDate}</span>
                      </div>
                      <p className="text-[11px] font-bold text-secondary mt-0.5 truncate">
                        {company?.nama || 'Perusahaan (Informasi tidak tersedia)'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
                    <div className="flex gap-2">
                      <span className="bg-main text-secondary px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border-subtle">{job.tipe_kerja}</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-secondary opacity-70"><MapPin size={10} /> {job.lokasi?.split(',')[0] || 'Remote'}</span>
                    </div>
                    {isApplied && (
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-[1.2rem] border border-emerald-500/20">
                        <CheckCircle2 size={12} /> Applied
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Right: Job Detail Sticky View */}
        <div className="lg:col-span-7">
          {selectedJob ? (
            <motion.div 
              key={selectedJob.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card !p-0 overflow-hidden sticky top-8 border-brand-primary/10"
            >
              <div className="p-8 md:p-12 border-b border-border-subtle">
                <div className="flex items-start gap-6 md:gap-8 mb-8">
                   <div className="w-24 h-24 rounded-[2rem] bg-main border border-border-subtle shrink-0 overflow-hidden flex items-center justify-center p-3 shadow-soft group">
                      {selectedJob.expand?.company?.logo ? (
                        <img src={pb.files.getUrl(selectedJob.expand.company, selectedJob.expand.company.logo)} alt="Logo" className="w-full h-full object-contain group-hover:scale-110 transition-all duration-700" />
                      ) : (
                        <Building2 size={40} className="text-secondary opacity-30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-2">
                       <h2 className="text-3xl font-black text-primary mb-2 leading-tight tracking-tight">{selectedJob.judul}</h2>
                       <div className="flex items-center gap-2">
                           <p className="text-secondary font-bold text-base">{selectedJob.expand?.company?.nama || 'Informasi Perusahaan Tidak Tersedia'}</p>
                           {selectedJob.expand?.company?.verified && (
                             <CheckCircle2 size={16} className="text-brand-primary" />
                           )}
                       </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DetailCap icon={<Briefcase className="text-blue-500" />} label="Tipe Kerja" value={selectedJob.tipe_kerja} />
                  <DetailCap icon={<MapPin className="text-red-500" />} label="Lokasi" value={selectedJob.lokasi || 'Flexible'} />
                  <DetailCap icon={<DollarSign className="text-emerald-500" />} label="Estimasi Gaji" value={formatGaji(selectedJob.gaji_min, selectedJob.gaji_max)} />
                  <DetailCap icon={<Calendar className="text-amber-500" />} label="Batas Akhir" value={selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : 'Always Open'} />
                </div>
              </div>

              <div className="p-8 md:p-12 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="space-y-10">
                   {/* Description Block */}
                   <div className="space-y-4">
                      <h3 className="text-lg font-black text-primary flex items-center gap-3">
                         <div className="w-1.5 h-5 bg-brand-primary rounded-full"></div>
                         Ringkasan Pekerjaan
                      </h3>
                      <div className="text-secondary text-sm leading-[1.8] font-medium whitespace-pre-wrap pl-4 border-l-2 border-border-subtle">
                        {selectedJob.deskripsi}
                      </div>
                   </div>

                   {/* Requirements Block */}
                   {selectedJob.persyaratan && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-black text-primary flex items-center gap-3">
                           <div className="w-1.5 h-5 bg-brand-primary rounded-full"></div>
                           Kualifikasi & Persyaratan
                        </h3>
                        <div className="text-secondary text-sm leading-[1.8] font-medium whitespace-pre-wrap pl-4 border-l-2 border-border-subtle">
                          {selectedJob.persyaratan}
                        </div>
                      </div>
                   )}
                </div>
              </div>

              <div className="p-8 md:p-10 bg-main/50 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Status Publikasi</p>
                  <p className="text-xs font-bold text-secondary opacity-70">Lowongan aktif sejak {new Date(selectedJob.created).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                </div>
                
                {appliedJobIds.has(selectedJob.id) ? (
                  <button disabled className="px-10 py-4.5 bg-emerald-500/10 text-emerald-500 font-black rounded-2xl flex items-center gap-3 cursor-not-allowed border border-emerald-500/20 text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/5">
                    <CheckCircle2 size={18} /> Lamaran Terkirim
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowApplyModal(true)}
                    className="px-12 py-4.5 bg-brand-primary hover:scale-[1.02] text-white font-black rounded-2xl transition-all shadow-2xl shadow-blue-500/30 active:scale-95 text-xs uppercase tracking-widest"
                  >
                    Lamar Posisi Ini
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
             <div className="bg-main/30 border-2 border-dashed border-border-subtle rounded-[3rem] h-[600px] flex flex-col items-center justify-center text-center p-12 text-secondary">
               <div className="w-24 h-24 bg-surface rounded-[2.5rem] shadow-soft flex items-center justify-center mb-6">
                  <Search size={40} className="text-secondary opacity-20" />
               </div>
               <p className="font-black text-2xl text-primary tracking-tight">Pilih Lowongan Kerja</p>
               <p className="font-medium mt-3 max-w-xs text-sm opacity-60">Klik salah satu posisi di sebelah kiri untuk meninjau rincian deskripsi dan kualifikasi lengkap.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for better organization
const DetailCap = ({ icon, label, value }) => (
  <div className="bg-main/50 p-4 rounded-3xl border border-border-subtle hover:bg-surface transition-all group">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 bg-surface rounded-lg shadow-sm group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 14 })}
      </div>
      <p className="text-[9px] uppercase font-black text-secondary opacity-50 tracking-widest">{label}</p>
    </div>
    <p className="font-black text-primary text-[11px] truncate uppercase">{value}</p>
  </div>
);
