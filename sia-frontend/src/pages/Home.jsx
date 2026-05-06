import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Briefcase, Building2, MapPin, Map,
  GraduationCap, User, Calendar, Loader2, BookOpen,
  CheckCircle2, Bell, LogOut
} from 'lucide-react';
import { pb } from '../lib/pb';
import { motion } from 'framer-motion';

export default function Home() {
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isIndustry = user?.role === 'industri';

  // Redirect industri users ke dashboard mereka
  if (isIndustry) {
    return <Navigate to="/industri" replace />;
  }

  // Redirect admin users ke dashboard admin
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  const [latestJobs, setLatestJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const username = user?.username;
  
  const [alumniData, setAlumniData] = useState(null);
  const [loading, setLoading] = useState(!isAdmin);
  const [error, setError] = useState('');

  const [debugStatus, setDebugStatus] = useState('');
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    if (isAdmin) return;

    const init = async () => {
       setLoading(true);
       try {
         await Promise.all([
           fetchMyAlumniData(username),
           fetchLatestJobs(),
           checkNotifications()
         ]);
       } catch (e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
    };

    if (username) {
      init();
    } else {
      setLoading(false);
      setError("Profil tidak dapat dimuat: Anda masuk sebagai Alumni, namun NIM / Username tidak tercantum di kredensial Anda.");
    }
  }, [isAdmin, username]);

  const checkNotifications = async () => {
    try {
      const activeQ = await pb.collection('questionnaires').getFirstListItem('is_active = true', { sort: '-id', requestKey: null });
      if (activeQ) {
         try {
           await pb.collection('questionnaire_responses').getFirstListItem(`questionnaire_id='${activeQ.id}' && user_id='${user.id}'`, { requestKey: null });
         } catch (e) {
           // Belum diisi
           setHasUnreadNotif(true);
         }
      }
    } catch (e) {}
  };

  const fetchLatestJobs = async () => {
    try {
      const jobsResult = await pb.collection('job_postings').getList(1, 4, {
        requestKey: null
      });
      
      // Fetch companies manually like in AlumniJobs
      const companyIds = [...new Set(jobsResult.items.map(j => j.company))].filter(Boolean);
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

      const finalJobs = jobsResult.items.map(job => ({
        ...job,
        expand: {
          ...job.expand,
          company: companyMap[job.company] || null
        }
      }));

      setLatestJobs(finalJobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const fetchMyApplications = async (alumniId) => {
    try {
      const result = await pb.collection('applications').getList(1, 5, {
        filter: `alumni="${alumniId}"`,
        requestKey: null
      });
      
      const appsWithData = await Promise.all(result.items.map(async (app) => {
        try {
          const job = await pb.collection('job_postings').getOne(app.job);
          let company = null;
          try {
            company = await pb.collection('companies').getOne(app.company);
          } catch {
            try {
              company = await pb.collection('companies').getFirstListItem(`email="${job.company}"`);
            } catch {
              company = null;
            }
          }
          return { ...app, expand: { job, company } };
        } catch (e) {
          return app;
        }
      }));

      setMyApplications(appsWithData);
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  };

  const fetchMyAlumniData = async (nimOrUserId) => {
    try {
      setError('');
      // Gunakan getFirstListItem yang lebih efisien dan robust
      const alumni = await pb.collection('alumni').getFirstListItem(`user="${user?.id}" || nim="${nimOrUserId}"`);
      
      if (alumni) {
        setAlumniData(alumni);
        fetchMyApplications(alumni.id);
      } else {
        setError(`Data biodata alumni belum tersedia untuk akun ini.`);
      }
    } catch (err) {
      console.error("Error fetching alumni data:", err);
      // Fallback: coba cari hanya dengan nim jika user ID gagal
      try {
        const alumni = await pb.collection('alumni').getFirstListItem(`nim="${nimOrUserId}"`);
        setAlumniData(alumni);
        fetchMyApplications(alumni.id);
      } catch (err2) {
        setError('Data profil alumni tidak ditemukan. Harap hubungi admin.');
      }
    }
  };

  const navigate = useNavigate();

  // Alumni View
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
        <div className="relative">
          <div className="absolute -left-4 -top-4 w-12 h-12 bg-brand-primary/10 rounded-full blur-xl hidden dark:block"></div>
          <h1 className="text-3xl lg:text-4xl font-black text-primary tracking-tight relative z-10">
            Portal Navigasi Alumni
          </h1>
          <p className="text-secondary mt-2 font-medium relative z-10 text-sm md:text-base">
            Halo <span className="font-bold text-brand-primary">{alumniData?.nama || user?.name || 'Alumni'}</span>, pantau perkembangan karir Anda di sini.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 relative">
          <div className="flex items-center gap-3">
            {/* Notification Button */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-3 bg-surface border border-border-subtle rounded-xl hover:bg-black/5 hover:border-border-subtle transition-all text-secondary hover:text-primary active:scale-95 shadow-sm"
                title="Notifikasi"
              >
                <Bell size={20} />
                {hasUnreadNotif && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-border-subtle bg-main flex items-center justify-between">
                     <p className="text-sm font-black text-primary">Notifikasi</p>
                     {hasUnreadNotif && <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">1 Baru</span>}
                  </div>
                  <div className="p-1.5 max-h-80 overflow-y-auto">
                     {hasUnreadNotif ? (
                       <button 
                         onClick={() => { setShowNotifMenu(false); navigate('/tracer'); }}
                         className="w-full text-left p-3 hover:bg-brand-primary/5 rounded-xl transition-colors flex items-start gap-3 border border-transparent hover:border-brand-primary/10 group"
                       >
                         <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                           <BookOpen size={14} className="group-hover:scale-110 transition-transform" />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-primary group-hover:text-brand-primary transition-colors">Kuesioner Baru Tersedia!</p>
                           <p className="text-[11px] text-secondary font-medium leading-relaxed mt-1">Sesi pengisian Tracer Study / Kuesioner terbaru telah dibuka. Silakan berpartisipasi sekarang.</p>
                         </div>
                       </button>
                     ) : (
                       <div className="p-6 text-center">
                         <div className="w-10 h-10 bg-main border border-border-subtle rounded-full flex items-center justify-center text-secondary mx-auto mb-2">
                           <Bell size={16} className="opacity-40" />
                         </div>
                         <p className="text-xs font-semibold text-secondary opacity-60">Belum ada notifikasi baru.</p>
                       </div>
                     )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Button */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-11 h-11 rounded-xl bg-brand-primary border border-blue-600 shadow-sm flex items-center justify-center text-white font-black hover:scale-105 active:scale-95 transition-all overflow-hidden"
              >
                {alumniData?.gambar ? (
                  <img src={pb.files.getUrl(alumniData, alumniData.gambar)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{(alumniData?.nama || user?.name || 'A').charAt(0).toUpperCase()}</span>
                )}
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-border-subtle bg-main">
                     <p className="text-sm font-bold text-primary truncate">{alumniData?.nama || user?.name || 'Alumni'}</p>
                     <p className="text-[10px] font-semibold text-secondary truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                     <button 
                       onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                       className="w-full text-left px-3 py-2 text-sm font-bold text-secondary hover:text-primary hover:bg-main rounded-lg transition-colors flex items-center gap-2"
                     >
                       <User size={16} /> Profil Saya
                     </button>
                     <button 
                       onClick={() => { setShowProfileMenu(false); logout(); }}
                       className="w-full text-left px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                     >
                       <LogOut size={16} /> Keluar Akun
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column (Main Content) - Takes up 8 cols */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
          
          {/* Layanan Karir / Quick Actions */}
          <section className="bg-surface border border-border-subtle rounded-3xl p-6 md:p-8 hover-glow transition-all">
             <div className="mb-6 relative z-10">
                <h2 className="text-xl font-black text-primary uppercase tracking-tight">Layanan Karir</h2>
                <p className="text-xs text-secondary font-medium mt-0.5">Akses cepat menuju pusat bantuan alumni.</p>
             </div>
             <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
                Pusat data karir terintegrasi memudahkan Anda untuk melacak lamaran pekerjaan, melihat statistik sebaran alumni, dan berpartisipasi dalam program tracer study tahunan.
             </p>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                {[
                  { id: 'tracer', label: 'Tracer Study', icon: <BookOpen size={16}/>, link: '/tracer' },
                  { id: 'alumni', label: 'Daftar Alumni', icon: <User size={16}/>, link: '/alumni-directory' },
                  { id: 'map', label: 'Lihat Peta', icon: <Map size={16}/>, link: '/map' },
                  { id: 'kontrak', label: 'Lowongan', icon: <Briefcase size={16}/>, link: '/lowongan' }
                ].map(item => (
                   <button key={item.id} onClick={() => navigate(item.link)} className="flex flex-col items-center justify-center p-4 bg-main rounded-2xl border border-border-subtle cursor-pointer hover:bg-brand-primary/5 hover:border-brand-primary/30 transition-all group active:scale-95 shadow-sm">
                    <div className="w-10 h-10 bg-surface rounded-xl mx-auto mb-3 flex items-center justify-center text-secondary group-hover:text-brand-primary group-hover:bg-main border border-border-subtle group-hover:border-brand-primary/20 shadow-sm transition-all">
                      {item.icon}
                    </div>
                    <p className="text-[11px] font-black uppercase text-secondary group-hover:text-brand-primary tracking-wide">{item.label}</p>
                  </button>
                ))}
             </div>
          </section>

          {/* Latest Jobs Section */}
          <section className="bg-surface border border-border-subtle rounded-3xl p-6 md:p-8 hover-glow transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
               <h2 className="text-xl font-black text-primary uppercase tracking-tight">
                 Lowongan Terbaru
               </h2>
               <button onClick={() => navigate('/lowongan')} className="text-[11px] px-4 py-2 rounded-xl bg-main border border-border-subtle font-bold text-secondary hover:text-primary hover:bg-surface transition-all active:scale-95 shrink-0 self-start sm:self-auto">Lihat Semua Pekerjaan</button>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
               {latestJobs.length > 0 ? latestJobs.map(job => (
                 <div key={job.id} onClick={() => navigate('/lowongan')} className="bg-main border border-border-subtle rounded-2xl p-4 md:p-5 hover:border-brand-primary/30 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between">
                    <div className="flex items-start gap-4 mb-4">
                       <div className="w-12 h-12 bg-white border border-border-subtle rounded-xl flex items-center justify-center p-2 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                          {job.expand?.company?.logo ? (
                            <img src={pb.files.getUrl(job.expand.company, job.expand.company.logo)} className="w-full h-full object-contain" />
                          ) : <Building2 size={20} className="text-slate-300" />}
                       </div>
                       <div className="min-w-0 pt-0.5">
                          <h3 className="font-bold text-sm text-primary truncate group-hover:text-brand-primary transition-colors pr-2">{job.judul}</h3>
                          <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider truncate mt-1.5">{job.expand?.company?.nama}</p>
                       </div>
                    </div>
                     <div className="flex items-center gap-3 text-[11px] font-bold text-secondary pt-3 border-t border-border-subtle">
                        <span className="px-2.5 py-1 bg-surface border border-border-subtle rounded-md text-primary">{job.tipe_kerja}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-brand-primary" /> {job.lokasi || 'Remote'}</span>
                        <span className="ml-auto opacity-40">{job.created ? (() => {
                          const d = new Date(job.created.replace(' ', 'T'));
                          return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                        })() : '-'}</span>
                     </div>
                 </div>
               )) : (
                 <div className="md:col-span-2 bg-main rounded-2xl p-8 border border-dashed border-border-subtle text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-surface border border-border-subtle rounded-full flex items-center justify-center text-secondary mb-3">
                       <Briefcase size={20} className="opacity-40" />
                    </div>
                    <p className="text-sm font-semibold text-secondary">Belum ada lowongan terbaru yang tersedia saat ini.</p>
                 </div>
               )}
            </div>
          </section>

          {/* Riwayat Lamaran Pekerjaan */}
          <section className="bg-surface border border-border-subtle rounded-3xl p-6 md:p-8 hover-glow transition-all">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-black text-primary uppercase tracking-tight">
                 Riwayat Lamaran
               </h2>
            </div>
            
            <div className="space-y-3">
               {myApplications.length > 0 ? myApplications.map(app => (
                 <div key={app.id} className="bg-main border border-border-subtle rounded-2xl p-4 flex items-center justify-between group hover:border-brand-primary/20 transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                       <div className="w-10 h-10 bg-surface border border-border-subtle rounded-xl flex items-center justify-center p-1.5 shrink-0">
                          {app.expand?.company?.logo ? (
                            <img src={pb.files.getUrl(app.expand.company, app.expand.company.logo)} className="w-full h-full object-contain" />
                          ) : <Building2 size={18} className="text-slate-300" />}
                       </div>
                       <div className="min-w-0">
                          <h3 className="font-bold text-sm text-primary truncate">{app.expand?.job?.judul || 'Posisi tidak tersedia'}</h3>
                          <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider mt-0.5">{app.expand?.company?.nama || 'Perusahaan'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                         app.status === 'Diterima' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                         app.status === 'Ditolak' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                         'bg-amber-500/10 text-amber-500 border-amber-500/20'
                       }`}>
                         {app.status || 'Pending'}
                       </span>
                       <span className="text-[10px] font-bold text-secondary opacity-30 hidden sm:block">
                         {new Date(app.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                       </span>
                    </div>
                 </div>
               )) : (
                 <div className="bg-main rounded-2xl p-8 border border-dashed border-border-subtle text-center">
                    <p className="text-sm font-semibold text-secondary opacity-60">Belum ada riwayat lamaran.</p>
                    <button onClick={() => navigate('/lowongan')} className="mt-4 text-[11px] font-black text-brand-primary uppercase tracking-widest hover:underline">Eksplorasi Karir Sekarang</button>
                 </div>
               )}
            </div>
          </section>



          {/* Hero-like CTA for Tracer Study */}
          {hasUnreadNotif && (
            <div className="p-6 md:p-8 bg-brand-primary overflow-hidden relative rounded-3xl shadow-lg shadow-blue-500/20 border border-blue-500/30 group">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-[150px] -mt-[150px] pointer-events-none group-hover:bg-white/20 transition-all duration-700"></div>
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-[60px] -ml-[100px] -mb-[100px] pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                   <div className="inline-flex px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black tracking-widest uppercase mb-3 text-white border border-white/20 shadow-sm">Agenda Wajib Tahunan</div>
                   <h2 className="text-2xl font-black mb-2 text-white">Tracer Study Akreditasi</h2>
                   <p className="text-blue-50 font-medium text-sm md:text-base max-w-lg leading-relaxed">
                      Hanya butuh beberapa menit untuk membantu kami memperbaiki kualitas lulusan kampus. Kontribusi Anda sangat berarti!
                   </p>
                </div>

                <button onClick={() => navigate('/tracer')} className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2 bg-white text-brand-primary hover:bg-slate-50 font-black py-3.5 px-8 rounded-xl transition-all shadow-xl active:scale-95 uppercase tracking-wider text-sm w-full md:w-auto">
                   Mulai Survey
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar Widgets) - Takes up 4 cols */}
        <div className="lg:col-span-4 space-y-6 lg:space-y-8">
           
           {/* Profile Widget */}
            <div className="bg-surface rounded-3xl p-6 lg:p-8 border border-border-subtle hover-glow transition-all relative overflow-hidden">
               <h3 className="text-lg font-black text-primary uppercase tracking-tight mb-1">Status Profil</h3>
               <p className="text-xs text-secondary font-medium mb-6">Kelengkapan data Anda saat ini</p>
              
              <div className="space-y-3">
                 <div className="bg-main rounded-xl p-4 flex items-center justify-between border border-border-subtle">
                    <span className="text-sm font-bold text-primary">Bio Dasar</span>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                 </div>
                 <div className="bg-main rounded-xl p-4 flex items-center justify-between border border-border-subtle">
                    <span className="text-sm font-bold text-primary">Data Karir</span>
                    {alumniData?.status_kerja ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-transparent">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                 </div>
                 <div className="bg-main rounded-xl p-4 flex items-center justify-between border border-border-subtle">
                    <span className="text-sm font-bold text-primary">Dokumen CV</span>
                    {(alumniData?.cv || alumniData?.use_profile_as_cv) ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-transparent">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                 </div>
              </div>
              
              <button 
                onClick={() => navigate('/profile')} 
                className="w-full mt-6 py-3.5 bg-brand-primary text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]"
              >
                Perbarui Profil
              </button>
           </div>
           
           <div className="bg-surface rounded-3xl p-6 lg:p-8 border border-border-subtle hover-glow transition-all">
              <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-5 border-b border-border-subtle pb-3 opacity-80">Tautan Pintasan</h3>
              <div className="space-y-3">
                 {[
                   { label: 'Situs Utama Kampus', icon: <Building2 size={14} /> },
                   { label: 'Bantuan IT / Support', icon: <User size={14} /> },
                   { label: 'Kontak Admin Prodi', icon: <GraduationCap size={14} /> }
                 ].map(link => (
                   <div key={link.label} className="flex items-center justify-between group cursor-pointer p-3 rounded-xl hover:bg-main border border-transparent hover:border-border-subtle transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 flex items-center justify-center bg-main border border-border-subtle rounded-lg text-secondary group-hover:text-brand-primary transition-colors shadow-sm">{link.icon}</div>
                         <span className="text-xs font-bold text-primary transition-colors">{link.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-secondary opacity-30 group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// Helper icons/components if needed
const ChevronRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const X = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
