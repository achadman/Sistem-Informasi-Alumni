import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, MapPin, Briefcase, Building2, BookOpen, Map, Phone, Mail, Heart, Calendar, Loader2, Edit3
} from 'lucide-react';
import { pb } from '../lib/pb';
import { motion } from 'framer-motion';
import AddAlumniModal from '../components/AddAlumniModal';

export default function AlumniDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      // Disabling autoCancel to ensure StrictMode doesn't abort the request
      const record = await pb.collection('alumni').getFirstListItem(`id="${id}"`, { requestKey: null });
      setPerson(record);
    } catch (err) {
      if (!err.isAbort) {
        console.error("Gagal mengambil detail alumni:", err);
        setError(`Gagal memuat: ${err.message || 'Data tidak ditemukan di server'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 size={40} className="animate-spin text-brand-primary mb-4" />
        <p className="text-slate-500 font-medium">Memuat detail alumni...</p>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-in fade-in">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <User size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Data Tidak Ditemukan</h2>
        <p className="text-slate-500 mb-8">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Same layout as AlumniProfile
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 hover:text-brand-primary hover:bg-brand-light transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Detail Profil Alumni</h1>
            <p className="text-slate-500 mt-1">
              Rincian biodata dan rekam jejak pada master database kampus.
            </p>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden relative"
      >
        {/* Cover Profile */}
        <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/10 opacity-30 blur-2xl"></div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="absolute top-6 right-6 bg-white/20 hover:bg-white text-white hover:text-brand-primary backdrop-blur-md px-5 py-2.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 border border-white/30"
            >
              <Edit3 size={16} /> Edit Data
            </button>
        </div>

        {/* Floating Avatar */}
        <div className="absolute top-24 left-8 sm:left-12 w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center p-2 z-20">
            <div className="w-full h-full bg-brand-light rounded-full overflow-hidden flex items-center justify-center text-brand-primary font-black text-4xl shadow-inner uppercase tracking-tighter">
              {person.gambar ? (
                <img src={pb.files.getURL(person, person.gambar, { 'thumb': '200x200' })} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                person.nama.charAt(0)
              )}
            </div>
        </div>

        <div className="pt-20 pb-10 px-8 sm:px-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100/60 pb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{person.nama}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-brand-light text-brand-primary font-black uppercase text-xs tracking-wider rounded-lg border border-blue-100">
                    NIM: {person.nim}
                  </span>
                  <StatusBadge status={person.status_kerja || person.status} border={true} />
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tahun Lulus</p>
                <p className="text-2xl font-black text-slate-800">{person.tahun_lulus || '-'}</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BookOpen size={16} /> Rincian Lengkap Rekam Jejak
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BiodataItem 
                  icon={<Briefcase />} 
                  label="Status Utama" 
                  value={person.status_kerja || person.status || '-'}
                />
                <BiodataItem 
                  icon={<Building2 />} 
                  label="Instansi / Afiliasi / Posisi Saat Ini" 
                  value={`${person.np || '-'}${person.jabatan ? ' - ' + person.jabatan : ''}`} 
                  highlight={true}
                />
                <BiodataItem 
                  icon={<User />} 
                  label="Jenis Kelamin" 
                  value={person.gender === 'L' ? 'Laki-Laki' : person.gender === 'P' ? 'Perempuan' : (person.gender || '-')} 
                />
                <BiodataItem 
                   icon={<Heart />} 
                   label="Golongan Darah" 
                   value={person.golongan_darah || '-'} 
                />
                <BiodataItem 
                  icon={<Map />} 
                  label="Provinsi Domisili" 
                  value={person.provinsi || '-'} 
                />
                <BiodataItem 
                  icon={<MapPin />} 
                  label="Kota/Kabupaten" 
                  value={person.kota || '-'} 
                />
                <BiodataItem 
                    icon={<Phone />} 
                    label="Nomor HP" 
                    value={person.no_hp || '-'} 
                 />
                 <BiodataItem 
                    icon={<Mail />} 
                    label="Email" 
                    value={person.email || '-'} 
                 />
                 <BiodataItem 
                   icon={<MapPin />} 
                   label="Alamat Lengkap" 
                   value={person.alamat ? `${person.alamat} ${person.rt ? 'RT '+person.rt:''}${person.rw ? '/RW '+person.rw:''} ${person.kelurahan? 'Kel. '+person.kelurahan:''}` : '-'} 
                 />
                {person.agama && (
                  <BiodataItem 
                    icon={<BookOpen />} 
                    label="Agama" 
                    value={person.agama} 
                  />
                )}
                <BiodataItem 
                  icon={<Calendar />} 
                  label="Keterangan / Status Akademik" 
                  value={person.keterangan || '-'} 
                />
              </div>
            </div>
        </div>
      </motion.div>

      <AddAlumniModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={() => fetchDetail()}
        editData={person}
      />
    </div>
  );
}

function BiodataItem({ icon, label, value, highlight = false }) {
  return (
    <div className={`flex items-start gap-4 p-5 rounded-2xl transition-all group border ${highlight ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50 shadow-sm' : 'bg-slate-500/5 border-slate-100 hover:bg-slate-100/50'}`}>
      <div className={`p-3 rounded-xl transition-all shadow-sm border ${highlight ? 'bg-white text-brand-primary border-blue-100' : 'bg-white text-slate-400 group-hover:text-brand-primary border-slate-100/80'}`}>
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <div className="flex flex-col justify-center min-h-[46px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className={`text-sm font-black mt-1 line-clamp-2 ${highlight ? 'text-blue-900' : 'text-slate-800'}`}>{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status, border = false }) {
  const styles = {
    'Bekerja': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'Wiraswasta': 'bg-indigo-50 text-indigo-600 border-indigo-200',
    'Melanjutkan Studi': 'bg-purple-50 text-purple-600 border-purple-200',
    'Belum Bekerja': 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${styles[status] || styles['Belum Bekerja'] || 'bg-slate-100 text-slate-500'} ${border ? 'border' : ''}`}>
      {status || 'Belum Bekerja'}
    </span>
  );
}
