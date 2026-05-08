import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, User, MapPin, Building2, BookOpen, Phone, Mail, Calendar, Loader2, Edit3,
  Globe, CheckCircle2, ImageIcon, Star, ExternalLink, Briefcase, FileText
} from 'lucide-react';
import { pb } from '../lib/pb';
import { useAuthStore } from '../store/authStore';
import AddAlumniModal from '../components/AddAlumniModal';
import { getPlatformIcon } from '../components/SocialMediaEditor';

export default function AlumniDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [person, setPerson] = useState(null);
  const [sertifikasiList, setSertifikasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        // Mengambil data alumni berdasarkan ID
        const record = await pb.collection('alumni').getOne(id, { requestKey: null });
        setPerson(record);
        
        // Mengambil data sertifikasi
        try {
          const certs = await pb.collection('alumni_sertifikasi').getFullList({ 
            filter: `alumni = "${id}"`,
            sort: '-tanggal_mulai',
            requestKey: null 
          });
          setSertifikasiList(certs);
        } catch (e) {
          console.warn("Certs Fetch Error:", e);
        }
      } catch (err) {
        console.error("Fetch Detail Error:", err);
        setError("Profil alumni tidak ditemukan atau terjadi masalah pada server.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium text-sm">Menyelaraskan profil alumni...</p>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-10 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <User size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Gagal Memuat Profil</h2>
        <p className="text-slate-500 text-sm mb-8 text-center max-w-xs">{error || 'Data alumni tidak ditemukan.'}</p>
        <button onClick={() => navigate(-1)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
          Kembali Ke Daftar
        </button>
      </div>
    );
  }

  // Helper functions for safe data parsing
  const safeParseJSON = (str, fallback = []) => {
    try {
      if (!str) return fallback;
      const parsed = typeof str === 'string' ? JSON.parse(str) : str;
      return Array.isArray(parsed) ? parsed : fallback;
    } catch { return fallback; }
  };

  const safeSocialMedia = safeParseJSON(person.social_media);
  const skills = safeParseJSON(person.keahlian);
  
  const bannerUrl = person.banner ? pb.files.getURL(person, person.banner) : (person.bannerTemplate || null);
  const avatarUrl = person.gambar ? pb.files.getURL(person, person.gambar, { thumb: '200x200' }) : null;

  const fullAddress = [
    person.alamat,
    person.rt && `RT ${person.rt}`,
    person.rw && `RW ${person.rw}`,
    person.kelurahan && `Kel. ${person.kelurahan}`,
    person.kecamatan && `Kec. ${person.kecamatan}`,
    person.kota_kabupaten || person.kota,
    person.provinsi
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-[#f1f5f9] -m-8 p-6 lg:p-12 lg:px-[2.5%]">
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[1440px] mx-auto space-y-8 pb-12 font-outfit"
    >
      {/* Remove Header Navigation */}

      <div className="flex flex-col xl:flex-row gap-10 items-start">
        
        {/* Left Column: Main Profile Content (approx 65%) */}
        <div className="w-full xl:w-[68%] space-y-8">
          {/* Main Profile Card (LinkedIn Style) */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {/* Banner Area */}
            <div className="h-60 relative overflow-hidden bg-slate-200">
              {bannerUrl ? (
                <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 opacity-90" />
              )}
              {isAdmin && (
                <button onClick={() => setIsModalOpen(true)} className="absolute top-6 right-6 bg-white/95 hover:bg-white text-slate-800 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border border-slate-100 transition-all active:scale-95">
                  <Edit3 size={14} /> Edit Data
                </button>
              )}
            </div>

            {/* Profile Info Area */}
            <div className="px-6 md:px-12 pb-12 relative">
              {/* Avatar and Primary Info (Vertical Stack) */}
              <div className="flex flex-col items-start gap-4 md:gap-6 -mt-16 md:-mt-24 mb-8 md:mb-10 px-1 md:px-2">
                {/* Avatar Container */}
                <div className="relative">
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-[6px] md:border-[8px] border-white bg-white shadow-2xl overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={person.nama} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-7xl font-black text-slate-200">
                        {person.nama?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Info (Under Avatar) */}
                <div className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">{person.nama || 'Tanpa Nama'}</h2>
                    {person.verified && (
                      <div className="p-1.5 bg-blue-600 text-white rounded-full self-start shadow-lg shadow-blue-200" title="Identitas Terverifikasi">
                        <CheckCircle2 size={16} fill="currentColor" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest">
                    <span className="text-blue-600 px-3 md:px-4 py-2 bg-blue-50 rounded-xl border border-blue-100/50">{person.status_kerja || 'Belum Bekerja'}</span>
                    {person.np && <span className="text-slate-700">{person.np}</span>}
                    <span className="text-slate-300 font-light text-lg hidden sm:block">|</span>
                    <span className="text-slate-500">Lulusan {person.tahun_lulus || '-'}</span>
                    <span className="text-slate-500 bg-slate-100 px-3 md:px-4 py-2 rounded-xl border border-slate-200/50">NIM: {person.nim}</span>
                  </div>
                </div>
              </div>

                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <MapPin size={12} className="text-slate-300" />
                  {person.kota_kabupaten || person.kota || 'Lokasi tidak disebutkan'}, {person.provinsi || '-'}
                </div>

                {person.is_open_to_work && (
                  <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Open to Work
                  </div>
                )}

                {/* Social Media Pills */}
                {safeSocialMedia.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {safeSocialMedia.map((sm, i) => (
                      <div key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-500 flex items-center gap-2">
                        {getPlatformIcon(sm.platform, 14)}
                        {sm.username}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

           {/* About Me Section */}
           <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Tentang Saya</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {person.keterangan || "Alumni ini belum menambahkan informasi tentang dirinya."}
              </p>
           </div>
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">
                Biodata Lengkap
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                 <DetailItem label="NIM Mahasiswa" value={person.nim} />
                 <DetailItem label="Program Studi" value={person.prodi} />
                 <DetailItem label="Angkatan / Lulus" value={person.tahun_lulus} />
                 <DetailItem label="Jenis Kelamin" value={person.gender === 'L' ? 'Laki-Laki' : 'Perempuan'} />
                 <DetailItem label="Tempat, Tanggal Lahir" value={(person.tempat_lahir || person.tanggal_lahir) ? `${person.tempat_lahir || '-'}, ${person.tanggal_lahir ? new Date(person.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}` : null} />
                 <DetailItem label="Agama" value={person.agama} />
                 <DetailItem label="Golongan Darah" value={person.golongan_darah} />

                 <div className="sm:col-span-2 pt-6 border-t border-slate-50">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Informasi Karir Saat Ini</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <DetailItem label="Status Pekerjaan" value={person.status_kerja} highlight={true} />
                      <DetailItem label="Nama Instansi" value={person.np} />
                      <DetailItem label="Jabatan" value={person.jabatan} />
                   </div>
                 </div>

                 <div className="sm:col-span-2 pt-6 border-t border-slate-50">
                    <DetailItem label="Alamat Lengkap" value={fullAddress} />
                 </div>
              </div>
           </div>

            {/* Keahlian & Sertifikasi Section (LinkedIn Timeline Style) */}
            {(skills.length > 0 || sertifikasiList.length > 0) && (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm mt-6">
                 {/* Skills Section */}
                 {skills.length > 0 && (
                   <div className="mb-12">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Keahlian Utama</h3>
                    </div>
                     <div className="flex flex-wrap gap-2">
                       {skills.map((skill, i) => (
                         <span key={i} className="px-5 py-2.5 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-xs font-bold hover:border-blue-200 hover:bg-blue-50 transition-all">
                           {skill}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Certificates Timeline */}
                 {sertifikasiList.length > 0 && (
                   <div className="space-y-8">
                     <div className="mb-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Sertifikasi & Pengalaman</h3>
                     </div>
                     
                     <div className="relative ml-4 space-y-12">
                        {/* Vertical Line */}
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-100" />

                        {sertifikasiList.map((cert, i) => {
                          const certUrl = cert.file_sertifikat ? pb.files.getURL(cert, cert.file_sertifikat) : null;
                          const isPdf = cert.file_sertifikat?.toLowerCase().endsWith('.pdf');
                          const thumbCert = isPdf ? null : (cert.file_sertifikat ? pb.files.getURL(cert, cert.file_sertifikat, { thumb: '200x200' }) : null);
                          
                          const docUrl = cert.file_dokumentasi ? pb.files.getURL(cert, cert.file_dokumentasi) : null;
                          const thumbDoc = cert.file_dokumentasi ? pb.files.getURL(cert, cert.file_dokumentasi, { thumb: '200x200' }) : null;
                          
                          const formatDate = (dateStr) => {
                            if(!dateStr) return '';
                            return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
                          };

                          return (
                            <div key={i} className="relative pl-10 group">
                              {/* Timeline Bullet */}
                              <div className="absolute left-[-5px] top-2 w-3 h-3 bg-white border-2 border-slate-300 rounded-full group-hover:border-blue-500 transition-colors z-10" />
                              
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-black text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                                    {cert.nama_keahlian}
                                  </h4>
                                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-2">
                                    {cert.tanggal_mulai ? formatDate(cert.tanggal_mulai) : '-'} 
                                    {cert.tanggal_selesai ? ` — ${formatDate(cert.tanggal_selesai)}` : ' — Sekarang'}
                                  </p>
                                </div>

                                {cert.deskripsi && (
                                  <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                                    {cert.deskripsi}
                                  </p>
                                )}

                                {/* Image Previews (Side by Side) */}
                                <div className="flex flex-wrap gap-3 pt-2">
                                  {certUrl && (
                                    <a 
                                      href={certUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="w-28 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:ring-4 hover:ring-blue-500/10 transition-all flex items-center justify-center group/item"
                                    >
                                      {isPdf ? (
                                        <div className="flex flex-col items-center">
                                          <FileText size={24} className="text-red-500" />
                                          <span className="text-[9px] font-black text-red-500 mt-1 uppercase tracking-widest">Sertif</span>
                                        </div>
                                      ) : (
                                        <img src={thumbCert} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                      )}
                                    </a>
                                  )}
                                  {docUrl && (
                                    <a 
                                      href={docUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="w-28 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:ring-4 hover:ring-emerald-500/10 transition-all group/item"
                                    >
                                      <img src={thumbDoc} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                     </div>
                   </div>
                 )}
              </div>
            )}
        </div>

        {/* Right Sidebar: Contact & Recommendations (approx 32%) */}
        <div className="w-full xl:w-[32%] space-y-8">
           {/* Contact Card (Top of Sidebar) */}
           <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Informasi Kontak</h3>
              <div className="space-y-5">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                       <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                       <p className="text-xs font-bold text-slate-800 truncate">{person.email || '-'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                       <Phone size={18} />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telepon</p>
                       <p className="text-xs font-bold text-slate-800 truncate">{person.no_hp || '-'}</p>
                    </div>
                 </div>
              </div>
           </div>

           <RecommendationSidebar 
              role={user?.role} 
              currentAlumniId={person.id} 
              currentProdi={person.prodi}
           />
        </div>
      </div>

      {/* Edit Modal for Admin */}
      {isAdmin && (
        <AddAlumniModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={() => {}} // Optional: refresh data after save
          editData={person} 
        />
      )}
    </motion.div>
    </div>
  );
}

function DetailItem({ label, value, highlight = false }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</span>
      <span className={`text-sm font-black ${highlight ? 'text-blue-600' : 'text-slate-800'}`}>
        {value || <span className="text-slate-300 font-medium italic">Data tidak tersedia</span>}
      </span>
    </div>
  );
}

function RecommendationSidebar({ role, currentAlumniId, currentProdi }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        setLoading(true);
        if (role === 'alumni') {
          // Show recommended companies/jobs for alumni
          const res = await pb.collection('lowongan').getList(1, 5, {
            sort: '-created',
            expand: 'industri'
          });
          setRecommendations(res.items.map(item => ({
            id: item.id,
            title: item.judul_lowongan,
            subtitle: item.expand?.industri?.nama_industri,
            image: item.expand?.industri?.logo ? pb.files.getURL(item.expand?.industri, item.expand?.industri.logo) : null,
            initial: item.judul_lowongan?.charAt(0),
            link: `/lowongan/detail/${item.id}`
          })));
        } else {
          // Show similar alumni for industry/admin
          const res = await pb.collection('alumni').getList(1, 5, {
            filter: `id != "${currentAlumniId}" && prodi = "${currentProdi}"`,
            sort: '@random'
          });
          setRecommendations(res.items.map(alumni => ({
            id: alumni.id,
            title: alumni.nama,
            subtitle: alumni.status_kerja || 'Alumni Serupa',
            image: alumni.gambar ? pb.files.getURL(alumni, alumni.gambar, { thumb: '100x100' }) : null,
            initial: alumni.nama?.charAt(0),
            link: `/alumni/detail/${alumni.id}`
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [currentAlumniId, currentProdi, role]);

  if (loading) return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
       <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl"></div>)}
       </div>
    </div>
  );

  const title = role === 'alumni' ? 'Rekomendasi Perusahaan' : 'Alumni Lain yang Mirip';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
        {title}
      </h3>
      <div className="space-y-5">
        {recommendations.length > 0 ? recommendations.map((item) => (
          <div key={item.id} className="group flex items-center gap-4 cursor-pointer" onClick={() => window.location.href = item.link}>
             <div className="w-12 h-12 rounded-2xl border-2 border-slate-100 overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xs font-black text-slate-300">
                    {item.initial}
                  </div>
                )}
             </div>
             <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">{item.title}</h4>
                <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{item.subtitle}</p>
             </div>
          </div>
        )) : (
          <p className="text-[10px] font-bold text-slate-300 italic text-center py-4">Tidak ada rekomendasi saat ini.</p>
        )}
      </div>
    </div>
  );
}
