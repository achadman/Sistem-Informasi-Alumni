import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Search, MapPin, DollarSign, Building2,
  Clock, CheckCircle2, ChevronRight, X, UploadCloud,
  Loader2, AlertCircle, Calendar, User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import { useLocation } from 'react-router-dom';

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
    if (!file && !alumniData.cv && !alumniData.use_profile_as_cv) {
      setError('Anda harus mengunggah CV atau menyalakan fitur CV Otomatis di profil.');
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
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Dokumen CV / Resume</label>
                
                {(alumniData?.cv || alumniData?.use_profile_as_cv) && !file ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-3xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                          {alumniData?.use_profile_as_cv ? 'CV Otomatis (Profil) Siap' : 'CV PDF Tersimpan'}
                        </p>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-500/80 mt-0.5 font-medium leading-tight">
                          {alumniData?.use_profile_as_cv ? 'Data profil Anda akan dikirimkan otomatis sebagai ganti CV.' : 'Akan menggunakan file PDF terakhir yang Anda unggah.'}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => document.getElementById('cv-upload').click()}
                      className="px-4 py-2 shrink-0 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-xl text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors uppercase tracking-widest"
                    >
                      Ubah File
                    </button>
                    <input id="cv-upload" type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                    onClick={() => document.getElementById('cv-upload').click()}
                  >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud size={32} />
                    </div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {file ? file.name : 'Klik untuk Unggah PDF CV'}
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
  const [jobStats, setJobStats] = useState({});
  const location = useLocation();

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
        
        const searchParams = new URLSearchParams(location.search);
        const jobId = searchParams.get('jobId');
        if (jobId) {
          const targetJob = finalJobs.find(j => j.id === jobId);
          if (targetJob) setSelectedJob(targetJob);
          else if (finalJobs.length > 0 && !selectedJob) setSelectedJob(finalJobs[0]);
        } else if (finalJobs.length > 0 && !selectedJob) {
          setSelectedJob(finalJobs[0]);
        }
        
        setFetchError(null);

        // 4. Fetch all applications to get statistics
        try {
          const allApps = await pb.collection('applications').getFullList({
            fields: 'job,status',
            requestKey: null
          });
          const stats = {};
          allApps.forEach(a => {
            if (!stats[a.job]) stats[a.job] = { total: 0, dihubungi: 0 };
            stats[a.job].total += 1;
            if (a.status === 'Dihubungi' || a.status === 'Diinterview') {
               stats[a.job].dihubungi += 1;
            }
          });
          setJobStats(stats);
        } catch (e) {
          console.warn('Failed to fetch global applications for stats', e);
        }

        // 5. Fetch user application status
        if (user) {
          try {
            const alumniRecord = await pb.collection('alumni').getFirstListItem(`user="${user.id}" || nim="${user.username}"`);
            if (alumniRecord) {
              const apps = await pb.collection('applications').getFullList({
                filter: `alumni="${alumniRecord.id}"`,
                fields: 'job'
              });
              setAppliedJobIds(new Set(apps.map(a => a.job)));
            }
          } catch (e) { 
            console.warn('App status check failed', e); 
          }
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
    <div className="space-y-6 pb-12">
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

      {/* Sticky Search Header */}
      <div className="sticky top-0 z-30 bg-main/90 backdrop-blur-xl pb-5 pt-2 -mx-2 px-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight">Eksplorasi Karir</h1>
            <p className="text-secondary font-medium text-sm mt-0.5">{filteredJobs.length} lowongan tersedia</p>
          </div>
          <div className="w-full sm:max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-60" size={18} />
            <input
              type="text" placeholder="Cari posisi atau perusahaan..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-5 py-3.5 bg-surface border border-border-subtle hover:border-brand-primary/40 rounded-2xl shadow-sm placeholder:text-secondary focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-sm font-bold text-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)] min-h-[600px]">
        {/* Left: Job Cards (Fixed/Sticky List) */}
        <div className="lg:w-5/12 h-full overflow-y-auto custom-scrollbar pr-2 space-y-3">

          {filteredJobs.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <Briefcase className="mx-auto text-secondary opacity-20 mb-4" size={40} />
              <p className="font-black text-primary text-lg">Lowongan Tidak Ditemukan</p>
              <p className="text-secondary text-sm mt-1">Coba kata kunci yang berbeda.</p>
            </div>
          ) : (
            filteredJobs.map(job => {
              const company = job.expand?.company;
              const isApplied = appliedJobIds.has(job.id);
              const isActive = selectedJob?.id === job.id;
              const daysAgo = job.created ? Math.floor((Date.now() - new Date(job.created)) / 86400000) : null;
              return (
                <motion.div layout key={job.id} onClick={() => setSelectedJob(job)}
                  className={`p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? 'bg-surface border-brand-primary shadow-lg shadow-blue-500/5'
                      : 'bg-surface border-border-subtle hover:border-brand-primary/40 hover:shadow-soft'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-r" />}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-main border border-border-subtle shrink-0 overflow-hidden flex items-center justify-center p-1.5">
                      {company?.logo ? (
                        <img src={pb.files.getUrl(company, company.logo)} alt={company.nama} className="w-full h-full object-contain" />
                      ) : (
                        <Building2 size={20} className="text-secondary opacity-30" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-black text-sm leading-tight truncate ${isActive ? 'text-brand-primary' : 'text-primary'}`}>{job.judul}</h3>
                      <p className="text-xs font-semibold text-secondary mt-0.5 truncate">{company?.nama || '-'}</p>
                    </div>
                    {daysAgo !== null && <span className="text-[10px] text-secondary opacity-40 shrink-0 mt-0.5">{daysAgo === 0 ? 'Hari ini' : `${daysAgo}h lalu`}</span>}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                      <span className="bg-main text-secondary px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide border border-border-subtle">{job.tipe_kerja || '-'}</span>
                      {job.lokasi && <span className="flex items-center gap-1 text-[11px] font-semibold text-secondary opacity-70"><MapPin size={11} />{job.lokasi.split(',')[0]}</span>}
                      {job.gaji_min && <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">{formatGaji(job.gaji_min, job.gaji_max)}</span>}
                    </div>
                    <div className="flex gap-2 items-center mt-3 pt-3 border-t border-border-subtle/50 w-full justify-between">
                      <div className="flex items-center gap-3">
                         {jobStats[job.id]?.total > 0 && (
                           <span className="text-[10px] font-bold text-secondary flex items-center gap-1"><User size={11}/> {jobStats[job.id].total} Pelamar</span>
                         )}
                         {jobStats[job.id]?.dihubungi > 0 && (
                           <span className="text-[10px] font-bold text-brand-primary flex items-center gap-1"><Briefcase size={11}/> {jobStats[job.id].dihubungi} Diinterview</span>
                         )}
                      </div>
                      {isApplied && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 size={11} /> Sudah Dilamar
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Right: Job Detail (Scrollable) */}
        <div className="lg:w-7/12 h-full overflow-y-auto custom-scrollbar">
          {selectedJob ? (
            <motion.div key={selectedJob.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="premium-card !p-0 overflow-hidden sticky top-6"
            >
              {/* Header */}
              <div className="p-7 border-b border-border-subtle">
                <div className="flex items-start gap-5 mb-6">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-main border border-border-subtle shrink-0 overflow-hidden flex items-center justify-center p-3">
                    {selectedJob.expand?.company?.logo ? (
                      <img src={pb.files.getUrl(selectedJob.expand.company, selectedJob.expand.company.logo)} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 size={36} className="text-secondary opacity-30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className="text-2xl font-black text-primary leading-tight tracking-tight">{selectedJob.judul}</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <p className="text-secondary font-bold">{selectedJob.expand?.company?.nama || 'Perusahaan'}</p>
                        {selectedJob.expand?.company?.verified && <CheckCircle2 size={15} className="text-brand-primary" />}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-border-subtle hidden sm:block"></div>
                      <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest">
                         {jobStats[selectedJob.id]?.total > 0 ? (
                           <span className="text-blue-500 flex items-center gap-1.5"><User size={13}/> {jobStats[selectedJob.id].total} Pelamar</span>
                         ) : (
                           <span className="text-secondary opacity-60">Belum ada pelamar</span>
                         )}
                         {jobStats[selectedJob.id]?.dihubungi > 0 && (
                           <span className="text-emerald-500 flex items-center gap-1.5"><Briefcase size={13}/> {jobStats[selectedJob.id].dihubungi} Diinterview</span>
                         )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info rows — readable, icon + label + value */}
                <div className="space-y-2.5">
                  <InfoRow icon={<MapPin size={15} className="text-red-400" />} label="Lokasi" value={selectedJob.lokasi || 'Tidak ditentukan'} />
                  <InfoRow icon={<Briefcase size={15} className="text-blue-400" />} label="Tipe Kerja" value={selectedJob.tipe_kerja || '-'} />
                  <InfoRow icon={<DollarSign size={15} className="text-emerald-500" />} label="Estimasi Gaji" value={formatGaji(selectedJob.gaji_min, selectedJob.gaji_max)} highlight />
                  <InfoRow icon={<Calendar size={15} className="text-amber-400" />} label="Batas Lamaran" value={selectedJob.deadline ? (() => {
                    const d = new Date(selectedJob.deadline.replace(' ', 'T'));
                    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                  })() : 'Selalu Terbuka'} />
                  <InfoRow icon={<Clock size={15} className="text-slate-400" />} label="Diposting" value={selectedJob.created ? (() => {
                    const d = new Date(selectedJob.created.replace(' ', 'T'));
                    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                  })() : '-'} />
                </div>
              </div>

              {/* Body */}
              <div className="p-7 max-h-[440px] overflow-y-auto custom-scrollbar space-y-7">
                <DetailSection title="Ringkasan Pekerjaan">
                  <div className="text-secondary text-sm leading-[1.85] whitespace-pre-wrap">{selectedJob.deskripsi || selectedJob.keterangan || '-'}</div>
                </DetailSection>

                {selectedJob.persyaratan && (
                  <DetailSection title="Kualifikasi &amp; Persyaratan">
                    <div className="text-secondary text-sm leading-[1.85] whitespace-pre-wrap">{selectedJob.persyaratan}</div>
                  </DetailSection>
                )}

                {selectedJob.expand?.company && (
                  <DetailSection title="Tentang Perusahaan">
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-xl bg-main border border-border-subtle shrink-0 flex items-center justify-center p-1.5">
                        {selectedJob.expand.company.logo
                          ? <img src={pb.files.getUrl(selectedJob.expand.company, selectedJob.expand.company.logo)} className="w-full h-full object-contain" alt="" />
                          : <Building2 size={20} className="text-secondary opacity-30" />}
                      </div>
                      <div>
                        <p className="font-bold text-primary">{selectedJob.expand.company.nama}</p>
                        {selectedJob.expand.company.bidang && <p className="text-sm text-secondary mt-0.5">{selectedJob.expand.company.bidang}</p>}
                        {selectedJob.expand.company.kota && <p className="text-sm text-secondary flex items-center gap-1 mt-0.5"><MapPin size={12}/>{selectedJob.expand.company.kota}</p>}
                      </div>
                    </div>
                  </DetailSection>
                )}
              </div>

              {/* Footer */}
              <div className="p-7 bg-main/40 border-t border-border-subtle flex items-center justify-between gap-4">
                <p className="text-xs font-bold text-secondary opacity-60">
                  Aktif sejak {new Date(selectedJob.created).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </p>
                {appliedJobIds.has(selectedJob.id) ? (
                  <button disabled className="px-8 py-3.5 bg-emerald-500/10 text-emerald-500 font-black rounded-2xl flex items-center gap-2.5 cursor-not-allowed border border-emerald-500/20 text-xs uppercase tracking-widest">
                    <CheckCircle2 size={16} /> Anda Sudah Melamar
                  </button>
                ) : (
                  <button onClick={() => setShowApplyModal(true)}
                    className="px-10 py-3.5 bg-brand-primary hover:opacity-90 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 text-xs uppercase tracking-widest">
                    Lamar Posisi Ini
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="bg-main/30 border-2 border-dashed border-border-subtle rounded-[2.5rem] h-[600px] flex flex-col items-center justify-center text-center p-12 text-secondary">
              <div className="w-20 h-20 bg-surface rounded-[2rem] shadow-soft flex items-center justify-center mb-5">
                <Search size={36} className="text-secondary opacity-20" />
              </div>
              <p className="font-black text-2xl text-primary tracking-tight">Pilih Lowongan</p>
              <p className="font-medium mt-2 max-w-xs text-sm opacity-60">Klik salah satu posisi di kiri untuk melihat detail dan melamar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// Reusable sub-components
const InfoRow = ({ icon, label, value, highlight }) => (
  <div className="flex items-center gap-3 text-sm">
    <div className="w-6 flex-shrink-0 flex justify-center">{icon}</div>
    <span className="text-secondary opacity-60 w-28 shrink-0 font-semibold text-xs uppercase tracking-wide">{label}</span>
    <span className={`font-bold ${highlight ? 'text-emerald-600' : 'text-primary'}`}>{value}</span>
  </div>
);

const DetailSection = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-base font-black text-primary flex items-center gap-2.5">
      <div className="w-1.5 h-5 bg-brand-primary rounded-full" />
      <span dangerouslySetInnerHTML={{ __html: title }} />
    </h3>
    {children}
  </div>
);
