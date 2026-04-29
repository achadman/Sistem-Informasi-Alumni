import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Users, Briefcase, BookmarkCheck,
  Clock, CheckCircle2, AlertCircle, ArrowRight,
  Search, PlusCircle, TrendingUp, Shield
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';

export default function IndustryDashboard() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    jobs: 0,
    applications: 0,
    bookmarks: 0,
  });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const record = await pb.collection('companies').getFirstListItem(`user="${user?.id}"`);
        setCompany(record);

        // Fetch stats
        const [jobs, applications, bookmarks] = await Promise.allSettled([
          pb.collection('job_postings').getList(1, 1, { filter: `company="${record.id}" || company="${record.email}"` }),
          pb.collection('applications').getList(1, 1, { filter: `company="${record.id}" || company="${record.email}"` }),
          pb.collection('bookmarks').getList(1, 1, { filter: `company="${record.id}" || company="${record.email}"` }),
        ]);

        setStats({
          jobs: jobs.status === 'fulfilled' ? jobs.value.totalItems : 0,
          applications: applications.status === 'fulfilled' ? applications.value.totalItems : 0,
          bookmarks: bookmarks.status === 'fulfilled' ? bookmarks.value.totalItems : 0,
        });
      } catch (err) {
        console.error('Failed to fetch company data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchCompany();
  }, [user]);

  const isVerified = company?.verified;

  const statCards = [
    {
      label: 'Lowongan Aktif',
      value: stats.jobs,
      icon: <Briefcase size={20} />,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Lamaran Masuk',
      value: stats.applications,
      icon: <Users size={20} />,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
    },
    {
      label: 'Alumni Dibookmark',
      value: stats.bookmarks,
      icon: <BookmarkCheck size={20} />,
      color: 'violet',
      gradient: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
  ];

  const quickActions = [
    {
      label: 'Cari Alumni',
      description: 'Filter & temukan kandidat terbaik',
      icon: <Search size={22} />,
      to: '/industri/alumni',
      color: 'bg-blue-500 hover:bg-blue-600',
      disabled: !isVerified,
    },
    {
      label: 'Posting Lowongan',
      description: 'Buat lowongan kerja baru',
      icon: <PlusCircle size={22} />,
      to: '/industri/lowongan/buat',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      disabled: !isVerified,
    },
    {
      label: 'Profil Perusahaan',
      description: 'Lengkapi & perbarui profil',
      icon: <Building2 size={22} />,
      to: '/industri/profil',
      color: 'bg-slate-600 hover:bg-slate-700',
      disabled: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat data perusahaan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex items-center gap-5">
          {company?.logo ? (
            <div className="w-14 h-14 rounded-2xl bg-surface p-1 border border-border-subtle shadow-premium overflow-hidden">
              <img
                src={pb.files.getUrl(company, company.logo)}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center shadow-premium shadow-blue-500/20">
              <Building2 size={32} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight leading-tight">
              {company?.nama || 'Dashboard Industri'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <BookmarkCheck size={14} className="text-brand-primary" />
              <p className="text-secondary text-sm font-bold opacity-70 tracking-wide">{company?.industri || 'Portal Perusahaan'}</p>
            </div>
          </div>
        </div>

        {/* Verification Badge */}
        <div className="sm:ml-auto">
          {isVerified ? (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl text-[10px] uppercase font-black border border-emerald-500/20 shadow-sm shadow-emerald-500/5 tracking-widest">
              <CheckCircle2 size={16} />
              Terverifikasi
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 text-amber-500 rounded-2xl text-[10px] uppercase font-black border border-amber-500/20 shadow-sm shadow-amber-500/5 tracking-widest">
              <Clock size={16} />
              Menunggu Verifikasi
            </span>
          )}
        </div>
      </motion.div>

      {/* Pending Verification Banner */}
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-main border border-amber-500/20 rounded-3xl flex items-start gap-5 shadow-sm"
        >
          <div className="p-3 bg-amber-500/10 rounded-2xl flex-shrink-0">
            <AlertCircle size={24} className="text-amber-500" />
          </div>
          <div>
            <p className="text-amber-500 font-black text-sm uppercase tracking-wider">Verifikasi Diperlukan</p>
            <p className="text-secondary text-xs mt-1.5 leading-relaxed font-bold opacity-70">
              Akun perusahaan Anda sedang dalam proses peninjauan oleh tim admin kampus.
              Ini biasanya memakan waktu 1-2 hari kerja. Silakan lengkapi profil Anda jika belum.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="premium-card !p-4 relative group hover:scale-[1.03] duration-500"
          >
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${card.text}`}>
                {React.cloneElement(card.icon, { size: 80 })}
             </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 bg-brand-primary/10 rounded-2xl shadow-sm ${card.text}`}>
                {card.icon}
              </div>
              <TrendingUp size={14} className="text-secondary opacity-30" />
            </div>
            <p className="text-4xl font-black text-primary tracking-tighter relative z-10">{card.value}</p>
            <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-2 relative z-10 opacity-60">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] opacity-40 ml-1">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="h-full"
            >
              {action.disabled ? (
                <div className="h-full p-4 rounded-3xl bg-main border border-border-subtle opacity-40 cursor-not-allowed group relative overflow-hidden">
                  <div className={`w-11 h-11 rounded-xl ${action.color} bg-opacity-20 flex items-center justify-center mb-3`}>
                    <span className="text-white">{action.icon}</span>
                  </div>
                  <p className="font-black text-primary text-sm uppercase tracking-wider">{action.label}</p>
                  <p className="text-secondary text-[11px] mt-2 font-bold opacity-60 leading-relaxed">{action.description}</p>
                  <p className="text-amber-500 text-[10px] mt-4 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Shield size={12} /> Verifikasi Admin
                  </p>
                </div>
              ) : (
                <Link
                  to={action.to}
                  className="h-full block p-4 premium-card hover:border-brand-primary group overflow-hidden"
                >
                  <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center mb-3 transition-all group-hover:scale-110 shadow-lg`}>
                    <span className="text-white">{action.icon}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-primary text-sm uppercase tracking-wider">{action.label}</p>
                      <p className="text-secondary text-[11px] mt-2 font-bold opacity-60 leading-relaxed">{action.description}</p>
                    </div>
                    <div className="p-2 bg-main rounded-xl text-secondary opacity-30 group-hover:text-brand-primary group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Company Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="premium-card !p-5"
      >
        <div className="flex items-center justify-between mb-5 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-brand-primary" />
            <h2 className="font-black text-primary text-sm uppercase tracking-widest">Detail Institusi</h2>
          </div>
          <Link
            to="/industri/profil"
            className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-blue-500 flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 rounded-lg transition-all"
          >
            Perbarui <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Email Resmi', value: company?.email || '-' },
            { label: 'No. Telepon', value: company?.no_hp || '-' },
            { label: 'Kota Operasional', value: company?.kota || '-' },
            { label: 'Provinsi', value: company?.provinsi || '-' },
            { label: 'Website Perusahaan', value: company?.website || '-' },
            { label: 'Sektor Industri', value: company?.industri || '-' },
          ].map(({ label, value }) => (
            <div key={label} className="group">
              <p className="text-[10px] text-secondary font-black uppercase tracking-[0.15em] opacity-40 group-hover:opacity-60 transition-opacity mb-1">{label}</p>
              <p className="text-primary font-black text-sm truncate">{value}</p>
            </div>
          ))}
        </div>
        {company?.deskripsi && (
          <div className="mt-5 pt-5 border-t border-border-subtle">
            <p className="text-[10px] text-secondary font-black uppercase tracking-[0.15em] opacity-40 mb-3">Profil Deskripsi</p>
            <p className="text-secondary text-sm leading-relaxed font-medium opacity-80">{company.deskripsi}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
