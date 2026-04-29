import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, User, MapPin, Building2, BookOpen, Phone, Mail, Calendar, Loader2, Edit3,
  Globe, CheckCircle2, ImageIcon, Star, ExternalLink, Briefcase
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto py-6 space-y-6 pb-12"
    >
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all active:scale-90">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">Alumni Detail</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Viewing Mode</p>
        </div>
      </div>

      {/* Main Profile Card (LinkedIn Style) */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
        {/* Banner Area */}
        <div className="h-52 relative overflow-hidden bg-slate-100">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700 opacity-80" />
          )}
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-slate-200 transition-all">
              <Edit3 size={14} /> Edit Data
            </button>
          )}
        </div>

        {/* Profile Info Area */}
        <div className="px-10 pb-10">
          <div className="relative">
            {/* Avatar */}
            <div className="absolute -top-16 left-0 w-36 h-36 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={person.nama} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-5xl font-black text-slate-200">
                  {person.nama?.charAt(0)}
                </div>
              )}
            </div>

            {/* Action Buttons (Right side of profile) */}
            <div className="flex justify-end pt-6 gap-3">
              {person.is_open_to_work && (
                <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Open to Work
                </div>
              )}
            </div>
          </div>

          <div className="mt-16">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{person.nama || 'Tanpa Nama'}</h2>
              {person.verified && (
                <div className="p-1 bg-blue-50 text-blue-600 rounded-full" title="Identitas Terverifikasi">
                  <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold">
              <span className="text-blue-600">{person.status_kerja || 'Belum Bekerja'}</span>
              {person.np && <span className="text-slate-800">{person.np}</span>}
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">Lulusan {person.tahun_lulus || '-'}</span>
              <span className="text-slate-400 font-medium">NIM: {person.nim}</span>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <MapPin size={12} className="text-slate-300" />
              {person.kota_kabupaten || person.kota || 'Lokasi tidak disebutkan'}, {person.provinsi || '-'}
            </div>

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
      </div>

      {/* Profile Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bio & Skills */}
        <div className="md:col-span-4 space-y-6">
          {/* Skills Card */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Star size={14} className="text-blue-500" /> Keahlian Utama
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? skills.map((skill, i) => (
                <span key={i} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black">
                  {skill}
                </span>
              )) : (
                <p className="text-xs text-slate-300 italic">Belum menambahkan keahlian</p>
              )}
            </div>
          </div>

          {/* Contact Summary Card */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Phone size={14} className="text-blue-500" /> Informasi Kontak
            </h3>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><Mail size={14} /></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                    <p className="text-xs font-bold text-slate-800">{person.email || '-'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Telepon</p>
                    <p className="text-xs font-bold text-slate-800">{person.no_hp || '-'}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Full Details */}
        <div className="md:col-span-8">
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" /> Biodata Lengkap
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                 <DetailItem label="NIM Mahasiswa" value={person.nim} />
                 <DetailItem label="Program Studi" value={person.prodi} />
                 <DetailItem label="Angkatan / Lulus" value={person.tahun_lulus} />
                 <DetailItem label="Jenis Kelamin" value={person.gender === 'L' ? 'Laki-Laki' : 'Perempuan'} />
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
