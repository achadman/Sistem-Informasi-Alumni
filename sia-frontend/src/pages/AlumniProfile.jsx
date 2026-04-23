import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Briefcase, Building2, MapPin, Map,
  User, Calendar, Loader2, BookOpen, Edit3, X, Camera, Save,
  Lock, KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { pb } from '../lib/pb';
import { motion, AnimatePresence } from 'framer-motion';
import RegionSelect from '../components/RegionSelect';

export default function AlumniProfile() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const username = user?.username || (user?.email ? user.email.split('@')[0] : null);
  
  const [alumniData, setAlumniData] = useState(null);
  const [loading, setLoading] = useState(!isAdmin);
  const [error, setError] = useState('');

  // States for Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // States for Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isAdmin) {
      setError("Halaman profil pribadi diperuntukkan bagi akun alumni.");
      return;
    }

    if (username) {
      fetchMyAlumniData(username);
    } else {
      setLoading(false);
      setError("Profil tidak dapat dimuat: Anda masuk sebagai Alumni, namun NIM tidak tercantum di kredensial Anda.");
    }
  }, [isAdmin, username]);

  const fetchMyAlumniData = async (nim) => {
    try {
      setLoading(true);
      setError('');
      const records = await pb.collection('alumni').getList(1, 1, {
        filter: `nim = "${nim}"`
      });
      
      if (records.items && records.items.length > 0) {
        setAlumniData(records.items[0]);
      } else {
        setError(`Data biodata alumni belum tersedia. Sistem tidak dapat menemukan profil dengan pola NIM/NPM: ${nim}. Silakan hubungi admin kampus.`);
      }
    } catch (err) {
      if (!err.isAbort) {
        console.error("API Error in AlumniProfile.jsx:", err);
        setError('Terjadi kesalahan saat mengambil biodata. Coba periksa koneksi internet atau hak akses database.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    setFormData({ ...alumniData });
    setPreviewImage(null);
    setIsEditing(true);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, gambar: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const dataToSave = new FormData();
      // Only attach text fields that are editable
      dataToSave.append('status_kerja', formData.status_kerja || '');
      dataToSave.append('np', formData.np || '');
      dataToSave.append('keterangan', formData.keterangan || '');
      dataToSave.append('gender', formData.gender || '');
      dataToSave.append('provinsi', formData.provinsi || '');
      dataToSave.append('kota_kabupaten', formData.kota_kabupaten || '');
      dataToSave.append('kecamatan', formData.kecamatan || '');
      dataToSave.append('kelurahan', formData.kelurahan || '');
      dataToSave.append('rt', formData.rt || '');
      dataToSave.append('rw', formData.rw || '');
      dataToSave.append('agama', formData.agama || '');
      
      // If photo was changed, it's a File object, else it might be string (existing PB filename)
      if (formData.gambar instanceof File) {
        dataToSave.append('gambar', formData.gambar);
      } else if (formData.gambar === null) {
        dataToSave.append('gambar', ''); // To clear existing
      }

      await pb.collection('alumni').update(alumniData.id, dataToSave);
      
      // Refresh data
      await fetchMyAlumniData(username);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan profil: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    
    // Strict Validation Rule: Min 10 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{10,}$/;
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwdError("Konfirmasi sandi tidak cocok. Pastikan ketikan Anda sama persis.");
      return;
    }

    if (!pwdRegex.test(passwords.newPassword)) {
      setPwdError("Sandi terlalu lemah! Wajib 10 Karakter, 1 Huruf Besar, 1 Huruf Kecil, 1 Angka, dan 1 Simbol Khusus (@, !, dll).");
      return;
    }

    if (passwords.newPassword === passwords.oldPassword) {
      setPwdError("Sandi baru tidak boleh persis sama dengan sandi sementara saat ini.");
      return;
    }

    setPwdLoading(true);
    try {
      await pb.collection('users').update(user.id, {
        oldPassword: passwords.oldPassword,
        password: passwords.newPassword,
        passwordConfirm: passwords.confirmPassword,
      });
      setPwdSuccess("Berhasil! Kata sandi telah diperbarui menjadi sandi lapis baja yang terkuat.");
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPwdSuccess('');
      }, 3000);
    } catch (err) {
      console.error("Password update error:", err);
      if (err.response?.data?.oldPassword) {
        setPwdError("Sandi lama yang Anda masukkan salah.");
      } else {
        setPwdError("Sistem gagal mengubah sandi: " + (err.message || 'Error tidak diketahui. Verifikasi Token mungkin sudah kedaluwarsa.'));
      }
    } finally {
      setPwdLoading(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="p-8 bg-white text-center rounded-[2rem] border border-slate-200">
        <h2 className="text-xl font-bold text-slate-700">Profil Institusi / Admin</h2>
        <p className="text-slate-500 mt-2">Silakan klik menu Profil Institusi di pengaturan admin Anda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profil Pribadi Alumni</h1>
          <p className="text-slate-500 mt-1">
            Rincian biodata dan rekam jejak pada master database kampus.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex bg-white items-center p-8 rounded-2xl gap-3 text-brand-primary border border-slate-100 shadow-sm font-bold animate-pulse">
          <Loader2 className="animate-spin" size={24} /> Sedang menyinkronkan data profil dari server institusi...
        </div>
      ) : error ? (
        <div className="p-6 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200 flex flex-col gap-2 shadow-sm">
          <span className="font-bold flex items-center gap-2"><MapPin size={18} /> Peringatan Sistem</span>
          <span className="text-sm">{error}</span>
          <button onClick={() => fetchMyAlumniData(username)} className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold w-fit active:scale-95 transition-all shadow-md">Coba Ambil Data Ulang</button>
        </div>
      ) : alumniData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden relative"
        >
          {/* Cover Profile */}
          <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden group">
             <div className="absolute inset-0 bg-white/10 opacity-30 blur-2xl"></div>
             
             {/* Control Buttons overlap banner */}
             <div className="absolute top-6 right-8 flex gap-3">
               <button 
                 onClick={() => {
                   setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
                   setPwdError('');
                   setPwdSuccess('');
                   setIsPasswordModalOpen(true);
                 }}
                 className="bg-white/20 hover:bg-slate-900 text-white backdrop-blur-md px-5 py-2.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-white/30"
               >
                 <Lock size={16} /> Keamanan Sandi
               </button>
               <button 
                 onClick={handleOpenEdit}
                 className="bg-white/20 hover:bg-white text-white hover:text-brand-primary backdrop-blur-md px-5 py-2.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-white/30"
               >
                 <Edit3 size={16} /> Edit Profil
               </button>
             </div>
          </div>

          {/* Floating Avatar - Moved outside the banner so it doesn't get clipped */}
          <div className="absolute top-24 left-8 sm:left-12 w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center p-2 z-20">
             <div className="w-full h-full bg-brand-light rounded-full overflow-hidden flex items-center justify-center text-brand-primary font-black text-4xl shadow-inner uppercase tracking-tighter">
               {alumniData.gambar ? (
                 <img src={pb.files.getURL(alumniData, alumniData.gambar, { 'thumb': '200x200' })} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 alumniData.nama.charAt(0)
               )}
             </div>
          </div>

          <div className="pt-20 pb-10 px-8 sm:px-12 relative z-10">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100/60 pb-8">
               <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight">{alumniData.nama}</h2>
                 <div className="flex flex-wrap items-center gap-2 mt-2">
                   <span className="px-3 py-1 bg-brand-light text-brand-primary font-black uppercase text-xs tracking-wider rounded-lg border border-blue-100">
                     NIM: {alumniData.nim}
                   </span>
                   <StatusBadge status={alumniData.status_kerja || alumniData.status} border={true} />
                 </div>
               </div>
               <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tahun Lulus</p>
                  <p className="text-2xl font-black text-slate-800">{alumniData.tahun_lulus || '-'}</p>
               </div>
             </div>

             <div className="mt-8">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <BookOpen size={16} /> Rincian Rekam Jejak
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <BiodataItem 
                   icon={<Briefcase />} 
                   label="Status Utama" 
                   value={alumniData.status_kerja || alumniData.status || '-'}
                 />
                 <BiodataItem 
                   icon={<Building2 />} 
                   label="Instansi / Afiliasi Saat Ini" 
                   value={alumniData.np || '-'} 
                   highlight={true}
                 />
                 <BiodataItem 
                   icon={<User />} 
                   label="Jenis Kelamin" 
                   value={alumniData.gender === 'L' ? 'Laki-Laki' : alumniData.gender === 'P' ? 'Perempuan' : (alumniData.gender || '-')} 
                 />
                 <BiodataItem 
                   icon={<Map />} 
                   label="Provinsi Domisili" 
                   value={alumniData.provinsi || '-'} 
                 />
                 <BiodataItem 
                   icon={<MapPin />} 
                   label="Kota/Kabupaten" 
                   value={alumniData.kota_kabupaten || alumniData.kota || '-'} 
                 />
                 <BiodataItem 
                   icon={<MapPin />} 
                   label="Kecamatan" 
                   value={alumniData.kecamatan || '-'} 
                 />
                 <BiodataItem 
                   icon={<MapPin />} 
                   label="Kelurahan/Desa" 
                   value={alumniData.kelurahan || '-'} 
                 />
                 <BiodataItem 
                   icon={<MapPin />} 
                   label="RT / RW" 
                   value={(alumniData.rt || '-') + ' / ' + (alumniData.rw || '-')} 
                 />
                 {alumniData.agama && (
                   <BiodataItem 
                     icon={<BookOpen />} 
                     label="Agama" 
                     value={alumniData.agama} 
                   />
                 )}
                 <BiodataItem 
                   icon={<Calendar />} 
                   label="Keterangan Tambahan" 
                   value={alumniData.keterangan || '-'} 
                 />
               </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setIsEditing(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden my-auto flex flex-col max-h-full"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-20">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Edit3 className="text-brand-primary" />
                  Perbarui Profil
                </h2>
                <button 
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-8 custom-scrollbar">
                <form id="editForm" onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* FOTO UPLOAD */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl mb-6">
                     <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
                       <div className="w-24 h-24 rounded-full bg-brand-light border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                         {previewImage ? (
                           <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                         ) : formData.gambar ? (
                           <img src={pb.files.getURL(alumniData, formData.gambar, { 'thumb': '100x100' })} alt="Saved" className="w-full h-full object-cover" />
                         ) : (
                           <User size={32} className="text-brand-primary/50" />
                         )}
                       </div>
                       <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Camera className="text-white" size={24} />
                       </div>
                     </div>
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       ref={fileInputRef}
                       onChange={handlePhotoSelect}
                     />
                     <div className="text-center">
                       <p className="text-sm font-bold text-slate-700">Ganti Foto Profil</p>
                       <p className="text-xs text-slate-400 mt-1">JPEG, PNG max 5MB</p>
                     </div>
                     {formData.gambar && (
                        <button type="button" onClick={() => { setFormData(prev => ({...prev, gambar: null})); setPreviewImage(null); }} className="mt-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                          Hapus Foto Saat Ini
                        </button>
                     )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap (Statik)</label>
                      <input type="text" disabled value={formData.nama || ''} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">NIM / Akun (Statik)</label>
                      <input type="text" disabled value={formData.nim || ''} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed" />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status Utama Karir</label>
                       <select 
                         value={formData.status_kerja || ''}
                         onChange={(e) => setFormData({...formData, status_kerja: e.target.value})}
                         className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm font-medium"
                       >
                         <option value="">Pilih Status</option>
                         <option value="Bekerja">Bekerja</option>
                         <option value="Wiraswasta">Wiraswasta / Usaha</option>
                         <option value="Melanjutkan Studi">Melanjutkan Studi (Kuliah)</option>
                         <option value="Belum Bekerja">Belum Bekerja</option>
                       </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Afiliasi / Instansi Saat Ini</label>
                       <input 
                         type="text" 
                         value={formData.np || ''}
                         onChange={(e) => setFormData({...formData, np: e.target.value})}
                         placeholder="Contoh: PT Bangun Negeri atau UGM"
                         className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm font-medium"
                       />
                    </div>

                    <div className="md:col-span-2 space-y-4 py-2 border-t border-slate-100 mt-2">
                       <label className="text-[10px] font-bold text-brand-primary uppercase tracking-widest ml-1">Lokasi Domisili</label>
                       <RegionSelect 
                         formData={formData}
                         handleChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})}
                         isIndonesia={true}
                       />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                      <select 
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm font-medium"
                      >
                        <option value="">Pilih</option>
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Keterangan Lain</label>
                      <input 
                        type="text" 
                        value={formData.keterangan || ''}
                        onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                        placeholder="Keterangan singkat"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-[2rem] sticky bottom-0 z-20">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  form="editForm"
                  type="submit"
                  disabled={saving}
                  className="px-8 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {saving ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PASSWORD MODAL */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !pwdLoading && setIsPasswordModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden my-auto border border-slate-100 flex flex-col"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/20"><KeyRound size={20} /></div>
                  Sistem Sandi Militer
                </h2>
                <button 
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={pwdLoading}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                {pwdError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-3 shadow-sm"
                  >
                    <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-red-500" />
                    <p className="text-sm font-bold leading-snug">{pwdError}</p>
                  </motion.div>
                )}
                {pwdSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-start gap-3 shadow-sm"
                  >
                    <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                    <p className="text-sm font-bold leading-snug">{pwdSuccess}</p>
                  </motion.div>
                )}

                {!pwdSuccess && (
                  <form id="pwdForm" onSubmit={handlePasswordSubmit} className="space-y-6">
                    
                    <div className="space-y-1.5 focus-within:text-brand-primary transition-colors text-slate-400">
                      <label className="text-[10px] font-black uppercase tracking-widest ml-1">Sandi Usang Anda Saat Ini</label>
                      <div className="relative group">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-primary text-slate-400 transition-colors">
                           <Lock size={18} />
                         </div>
                         <input 
                           type={showPwd ? "text" : "password"} 
                           required
                           value={passwords.oldPassword}
                           onChange={e => setPasswords({...passwords, oldPassword: e.target.value})}
                           className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all font-medium"
                           placeholder="Ketikkan sandi saat ini..."
                         />
                      </div>
                    </div>

                    <div className="bg-slate-50/80 -mx-8 px-8 py-6 border-y border-slate-100 space-y-5">
                      <div className="space-y-1.5 focus-within:text-brand-primary transition-colors text-slate-400">
                        <label className="text-[10px] font-black uppercase tracking-widest ml-1">Sandi Super Baru</label>
                        <div className="relative group">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-primary text-slate-400 transition-colors">
                             <KeyRound size={18} />
                           </div>
                           <input 
                             type={showPwd ? "text" : "password"} 
                             required
                             value={passwords.newPassword}
                             onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                             className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all font-bold"
                             placeholder="Contoh: K0d3#Aman@123"
                           />
                           <button 
                             type="button"
                             onClick={() => setShowPwd(!showPwd)}
                             className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                           >
                             {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 focus-within:text-brand-primary transition-colors text-slate-400">
                        <label className="text-[10px] font-black uppercase tracking-widest ml-1">Kukuhkan Sandi Baru</label>
                        <div className="relative group">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-primary text-slate-400 transition-colors">
                             <CheckCircle2 size={18} />
                           </div>
                           <input 
                             type={showPwd ? "text" : "password"} 
                             required
                             value={passwords.confirmPassword}
                             onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                             className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all font-bold"
                             placeholder="Ulangi kembali sandi di atas persis"
                           />
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-500 flex flex-col gap-1 px-2 border-l-[3px] border-amber-400 ml-1">
                        <span className="font-bold text-slate-700 mb-1">Rincian Doktrin 5 Syarat Tangguh:</span>
                        <p>1. Memiliki struktur memanjang minimal <span className="font-bold text-slate-800">10 Karakter</span>.</p>
                        <p>2. Harus menyematkan <span className="font-bold text-slate-800">Huruf Kapital Besar (A-Z)</span>.</p>
                        <p>3. Harus menyematkan <span className="font-bold text-slate-800">Huruf Kecil Regular (a-z)</span>.</p>
                        <p>4. Harus menyematkan <span className="font-bold text-slate-800">Angka Denominasi (0-9)</span>.</p>
                        <p>5. Mustahil lolos tanpa <span className="font-bold text-slate-800">Simbol Spesial (misal !, #, $)</span>.</p>
                      </div>
                    </div>

                    <div className="pt-2">
                       <button 
                         type="submit"
                         disabled={pwdLoading}
                         className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-900/20 uppercase tracking-wider"
                       >
                         {pwdLoading ? <Loader2 className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
                         {pwdLoading ? 'Memproses Enkripsi Sandi...' : 'Suntikkan Keamanan Lapis Baja'}
                       </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
