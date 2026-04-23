import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, GraduationCap, Star, MapPin, Download,
  Clock, Eye, Phone, CheckCircle2, XCircle, ChevronDown,
  Loader2, Briefcase, FileText, Building2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Antrean', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
  { value: 'Shortlisted', label: 'Shortlisted', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30' },
  { value: 'Interview', label: 'Wawancara', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30' },
  { value: 'Hired', label: 'Diterima', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' },
  { value: 'Rejected', label: 'Ditolak', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' },
];

const STATUS_ICONS = {
  Pending: <Clock size={13} />,
  Shortlisted: <Star size={13} />,
  Interview: <Users size={13} />,
  Hired: <CheckCircle2 size={13} />,
  Rejected: <XCircle size={13} />,
};

export default function IndustryApplicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job details
        const jobData = await pb.collection('job_postings').getOne(jobId, {
          expand: 'company',
        });
        setJob(jobData);

        // Fetch applications with expanded alumni data
        const apps = await pb.collection('applications').getFullList({
          filter: `job="${jobId}"`,
          expand: 'alumni',
          sort: '-created',
        });
        setApplications(apps);
      } catch (err) {
        console.error('Failed to fetch applicants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId]);

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      await pb.collection('applications').update(appId, { status: newStatus });
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      );
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status) =>
    STATUS_OPTIONS.find(s => s.value === status)?.color || STATUS_OPTIONS[0].color;

  const filteredApps = filterStatus === 'all'
    ? applications
    : applications.filter(a => a.status === filterStatus);

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = applications.filter(a => a.status === s.value).length;
    return acc;
  }, { all: applications.length });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat data pelamar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/industri/lowongan')}
            className="p-3 bg-surface border border-border-subtle rounded-xl hover:bg-main text-secondary hover:text-primary transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-primary tracking-tight">
              Manajemen Pelamar
            </h1>
            {job && (
              <div className="flex items-center gap-2 mt-1">
                <Briefcase size={14} className="text-secondary opacity-50" />
                <p className="text-secondary text-sm font-medium truncate max-w-[200px] sm:max-w-md">{job.judul}</p>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${
                  job.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  job.status === 'Tutup' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-main text-secondary border-border-subtle'
                }`}>{job.status}</span>
              </div>
            )}
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 px-5 py-3 bg-brand-primary/10 text-brand-primary rounded-2xl border border-brand-primary/20 shadow-sm shadow-blue-500/5">
          <Users size={16} />
          <span className="font-black text-sm tracking-tight">{applications.length} Pelamar Terdaftar</span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap bg-main p-1.5 rounded-2xl border border-border-subtle overflow-x-auto custom-scrollbar no-scrollbar-on-mobile">
        {[{ key: 'all', label: 'Semua Status' }, ...STATUS_OPTIONS.map(s => ({ key: s.value, label: s.label }))].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-[10px] uppercase font-black transition-all border whitespace-nowrap tracking-widest ${
              filterStatus === tab.key
                ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-blue-500/20'
                : 'bg-surface text-secondary opacity-60 border-border-subtle hover:bg-main hover:opacity-100'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-main text-secondary opacity-50'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applicant List */}
      {filteredApps.length === 0 ? (
        <div className="premium-card py-24 text-center">
          <div className="w-20 h-20 bg-main rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-border-subtle">
            <Users size={32} className="text-secondary opacity-10" />
          </div>
          <p className="font-black text-primary text-xl tracking-tight">
            {filterStatus === 'all' ? 'Belum ada pelamar' : `Filter "${filterStatus}" Nihil`}
          </p>
          <p className="text-secondary text-sm mt-3 max-w-sm mx-auto font-medium opacity-60 leading-relaxed">
            {filterStatus === 'all' ? 'Ajak alumni untuk melamar dengan membagikan link lowongan Anda.' : 'Coba ubah filter untuk melihat data lainnya.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApps.map((app, i) => {
            const alumni = app.expand?.alumni;
            const skills = (() => {
              try { return JSON.parse(alumni?.keahlian || '[]'); } catch { return []; }
            })();

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group"
              >
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  {/* Avatar & Profile Identity */}
                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-800 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 overflow-hidden shadow-lg shadow-blue-200 dark:shadow-none">
                      {alumni?.foto ? (
                        <img src={pb.files.getUrl(alumni, alumni.foto)} alt={alumni.nama} className="w-full h-full object-cover" />
                      ) : (
                        alumni?.nama?.charAt(0) || 'A'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-900 dark:text-slate-100 text-lg tracking-tight truncate max-w-[200px] sm:max-w-none">{alumni?.nama || 'Alumni Tidak Diketahui'}</p>
                        {alumni?.is_open_to_work && (
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wider">
                            Open to Work
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                          <GraduationCap size={14} className="text-slate-300 dark:text-slate-600" />
                          {alumni?.prodi || 'Program Studi -'}
                          {alumni?.angkatan && <span>'{String(alumni.angkatan).slice(-2)}</span>}
                        </span>
                        {alumni?.ipk > 0 && (
                          <span className="flex items-center gap-1 text-xs font-black text-amber-500 dark:text-amber-400">
                            <Star size={14} fill="currentColor" /> {Number(alumni.ipk).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills & Info */}
                  <div className="flex-1 min-w-0 sm:pl-1 lg:pl-0">
                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {skills.length > 0 ? skills.slice(0, 5).map(skill => (
                        <span key={skill} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold border border-slate-100 dark:border-slate-700">
                          {skill}
                        </span>
                      )) : <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 italic">Belum mencantumkan keahlian</span>}
                      {skills.length > 5 && <span className="text-[10px] font-black text-slate-400 ml-1">+{skills.length - 5}</span>}
                    </div>

                    {/* Applicant's Note */}
                    {app.catatan && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors border-l-4 border-l-blue-400 dark:border-l-blue-600 mb-2">
                        "{app.catatan}"
                      </div>
                    )}
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest pl-1">
                      Terdaftar: {new Date(app.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Actions & Status Control */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50 dark:border-slate-800">
                    {/* Status Dropdown */}
                    <div className="relative group">
                      <button
                        disabled={updatingId === app.id}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black border transition-all active:scale-95 shadow-sm ${getStatusStyle(app.status)}`}
                      >
                        {updatingId === app.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          STATUS_ICONS[app.status] || <Clock size={13} />
                        )}
                        {STATUS_OPTIONS.find(o => o.value === app.status)?.label || app.status}
                        <ChevronDown size={12} className="ml-1 opacity-60" />
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-20 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all scale-95 group-hover:scale-100 origin-top-right overflow-hidden">
                        <div className="p-1.5 space-y-0.5">
                          {STATUS_OPTIONS.map(s => (
                            <button
                              key={s.value}
                              onClick={() => handleStatusChange(app.id, s.value)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-colors ${
                                app.status === s.value 
                                  ? 'bg-slate-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400' 
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                              }`}
                            >
                              <div className={app.status === s.value ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}>
                                {STATUS_ICONS[s.value]}
                              </div>
                              {s.label}
                              {app.status === s.value && <CheckCircle2 size={12} className="ml-auto text-blue-500" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Access Files */}
                    <div className="flex gap-2">
                       {app.surat_lamaran && (
                          <a
                            href={pb.files.getUrl(app, app.surat_lamaran)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-lg transition-all"
                            title="Unduh CV / Dokumen"
                          >
                            <Download size={18} />
                          </a>
                       )}
                       <button 
                         onClick={() => navigate(`/admin/alumni/${alumni?.id}`)} 
                         className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-lg transition-all"
                         title="Lihat Profil Detail"
                       >
                         <Eye size={18} />
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
