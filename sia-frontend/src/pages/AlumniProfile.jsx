import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import RegionSelect from '../components/RegionSelect';
import CustomSelect from '../components/CustomSelect';
import SocialMediaEditor, { getPlatformIcon, socialPlatforms } from '../components/SocialMediaEditor';
import { Camera, Edit2, KeyRound, ImageIcon, CheckCircle2, Star, Briefcase, FileText, MapPin, Mail, Phone, BookOpen } from 'lucide-react';

const BANNER_TEMPLATES = [
  { id: 'blue_geo',   label: 'Biru Geometris', src: '/banner_blue_geo.png' },
  { id: 'forest',     label: 'Alam Hijau',     src: '/banner_forest.png' },
  { id: 'tech_dark',  label: 'Tech Gelap',     src: '/banner_tech_dark.png' },
  { id: 'warm_sand',  label: 'Hangat Pasir',   src: '/banner_warm_sand.png' },
];

export default function AlumniProfile() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const username = user?.username || (user?.email ? user.email.split('@')[0] : null);

  const [alumniData, setAlumniData] = useState(null);
  const [loading, setLoading] = useState(!isAdmin);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const avatarRef = useRef(null);
  const bannerRef = useRef(null);
  const cvRef = useRef(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  // Skills / Keahlian Modal
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [skillTags, setSkillTags] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [sertifikasiList, setSertifikasiList] = useState([]);
  const [certList, setCertList] = useState([]);
  const [deletedCertIds, setDeletedCertIds] = useState([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const certRef = useRef(null);

  useEffect(() => {
    if (isAdmin) { setError('Halaman ini untuk akun alumni.'); return; }
    if (username) fetchMyAlumniData(username);
    else { setLoading(false); setError('NIM tidak ditemukan di kredensial Anda.'); }
  }, [isAdmin, username]);

  const fetchMyAlumniData = async (nim) => {
    try {
      setLoading(true); setError('');
      const res = await pb.collection('alumni').getList(1, 1, { filter: `nim = "${nim}"` });
      if (res.items?.length > 0) {
        setAlumniData(res.items[0]);
        try {
          const certs = await pb.collection('alumni_sertifikasi').getFullList({ filter: `alumni = "${res.items[0].id}"` });
          setSertifikasiList(certs);
        } catch(e) {}
      }
      else setError(`Profil dengan NIM ${nim} tidak ditemukan. Hubungi admin kampus.`);
    } catch (err) {
      if (!err.isAbort) setError('Gagal memuat data profil.');
    } finally { setLoading(false); }
  };

  const handleOpenEdit = () => {
    setFormData({ ...alumniData });
    setPreviewAvatar(null); setPreviewBanner(null); setSelectedTemplate(null);
    setIsEditing(true);
  };

  const handleOpenSkills = () => {
    try {
      const p = JSON.parse(alumniData.keahlian || '[]');
      setSkillTags(Array.isArray(p) ? p.filter(Boolean) : []);
    } catch { setSkillTags([]); }
    
    setCertList(sertifikasiList.map(c => ({
      id: c.id,
      nama_keahlian: c.nama_keahlian,
      tanggal_mulai: c.tanggal_mulai ? c.tanggal_mulai.split(' ')[0] : '',
      tanggal_selesai: c.tanggal_selesai ? c.tanggal_selesai.split(' ')[0] : '',
      file_sertifikat: null,
      file_dokumentasi: null,
      existing_sertifikat: c.file_sertifikat,
      existing_dokumentasi: c.file_dokumentasi
    })));
    setDeletedCertIds([]);
    setSkillInput('');
    setIsSkillsOpen(true);
  };

  const handleAddSkillTag = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skillTags.includes(trimmed)) {
      setSkillTags(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSkillTag(); }
    if (e.key === 'Backspace' && skillInput === '' && skillTags.length > 0) {
      setSkillTags(prev => prev.slice(0, -1));
    }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const d = new FormData();
      d.append('keahlian', JSON.stringify(skillTags));
      await pb.collection('alumni').update(alumniData.id, d);
      
      for (const cert of certList) {
        if (!cert.nama_keahlian.trim()) continue;
        const formData = new FormData();
        formData.append('alumni', alumniData.id);
        formData.append('nama_keahlian', cert.nama_keahlian);
        if (cert.tanggal_mulai) formData.append('tanggal_mulai', cert.tanggal_mulai);
        if (cert.tanggal_selesai) formData.append('tanggal_selesai', cert.tanggal_selesai);
        if (cert.file_sertifikat instanceof File) formData.append('file_sertifikat', cert.file_sertifikat);
        if (cert.file_dokumentasi instanceof File) formData.append('file_dokumentasi', cert.file_dokumentasi);
        
        if (cert.id) {
          await pb.collection('alumni_sertifikasi').update(cert.id, formData);
        } else {
          await pb.collection('alumni_sertifikasi').create(formData);
        }
      }
      for (const delId of deletedCertIds) {
        await pb.collection('alumni_sertifikasi').delete(delId);
      }
      
      setIsSkillsOpen(false);
      await fetchMyAlumniData(username);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan keahlian: ' + (err.message || 'Error'));
    } finally { setSavingSkills(false); }
  };

  const handleSelectTemplate = async (tpl) => {
    setSelectedTemplate(tpl.id);
    setPreviewBanner(tpl.src);
    try {
      // Fetch the template image and convert to a File object so it uploads as banner
      const res = await fetch(tpl.src);
      const blob = await res.blob();
      const file = new File([blob], `template_${tpl.id}.png`, { type: blob.type || 'image/png' });
      setFormData(p => ({ ...p, banner: file }));
    } catch (err) {
      console.error('Gagal memuat template:', err);
      alert('Gagal memuat gambar template. Pastikan server berjalan.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const d = new FormData();
      ['status_kerja','np','keterangan','gender','provinsi','kota_kabupaten','kecamatan','kelurahan','rt','rw','agama'].forEach(k => d.append(k, formData[k] || ''));
      d.append('is_open_to_work', formData.is_open_to_work ? 'true' : 'false');
      d.append('use_profile_as_cv', formData.use_profile_as_cv ? 'true' : 'false');
      if (formData.cv instanceof File) d.append('cv', formData.cv);
      else if (formData.cv === null) d.append('cv', '');
      
      if (formData.gambar instanceof File) d.append('gambar', formData.gambar);
      else if (formData.gambar === null) d.append('gambar', '');
      if (formData.banner instanceof File) d.append('banner', formData.banner);
      else if (formData.banner === null) d.append('banner', '');
      
      d.append('social_media', JSON.stringify(formData.social_media || []));

      await pb.collection('alumni').update(alumniData.id, d);
      await fetchMyAlumniData(username);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan: ' + (err.message || 'Error'));
    } finally { setSaving(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault(); setPwdError(''); setPwdSuccess('');
    if (passwords.newPassword !== passwords.confirmPassword) { setPwdError('Konfirmasi sandi tidak cocok.'); return; }
    if (passwords.newPassword.length < 8) { setPwdError('Sandi minimal 8 karakter.'); return; }
    setPwdLoading(true);
    try {
      await pb.collection('users').update(user.id, { oldPassword: passwords.oldPassword, password: passwords.newPassword, passwordConfirm: passwords.confirmPassword });
      setPwdSuccess('Kata sandi berhasil diperbarui.');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { setIsPasswordModalOpen(false); setPwdSuccess(''); }, 2000);
    } catch (err) {
      setPwdError(err.response?.data?.oldPassword ? 'Sandi lama salah.' : 'Gagal mengubah sandi: ' + err.message);
    } finally { setPwdLoading(false); }
  };

  const parseSkills = (data) => {
    try { const s = JSON.parse(data?.keahlian || '[]'); return Array.isArray(s) ? s.filter(Boolean) : []; }
    catch { return []; }
  };

  // Safely convert PocketBase file field (string or array) to array
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string' && val.trim()) return [val];
    return [];
  };

  if (isAdmin) return (
    <div className="p-5 bg-white border border-slate-200 rounded-lg">
      <h2 className="font-semibold text-slate-800">Profil Institusi / Admin</h2>
      <p className="text-sm text-slate-500 mt-1">Silakan klik menu Profil Institusi di pengaturan admin.</p>
    </div>
  );

  const skills = alumniData ? parseSkills(alumniData) : [];
  const avatarUrl = alumniData?.gambar ? pb.files.getURL(alumniData, alumniData.gambar, { thumb: '200x200' }) : null;
  const bannerUrl = alumniData?.banner ? pb.files.getURL(alumniData, alumniData.banner) : (alumniData?.bannerTemplate || null);

  let safeSocialMedia = [];
  try {
    if (alumniData?.social_media) {
      safeSocialMedia = Array.isArray(alumniData.social_media) ? alumniData.social_media : JSON.parse(alumniData.social_media || '[]');
    }
  } catch (e) {
    safeSocialMedia = [];
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto py-8 px-4 space-y-6 pb-12">
      {loading ? (
        <div className="p-4 text-slate-500 text-sm">Memuat data profil...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
          {error} <button onClick={() => fetchMyAlumniData(username)} className="ml-3 underline font-medium">Coba Lagi</button>
        </div>
      ) : alumniData && (
        <>
          {/* Global Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-8 items-start">
            
            {/* Left Column: Main Profile Content */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-sm transition-colors duration-300">
                {/* Banner Area */}
                <div className="h-52 relative overflow-hidden bg-slate-100 group">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700 opacity-80" />
                  )}
                  <button
                    onClick={handleOpenEdit}
                    className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-slate-200 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ImageIcon size={14} /> Ganti Sampul
                  </button>
                </div>

                <div className="px-10 pb-10">
                  <div className="relative">
                    {/* Avatar */}
                    <div className="absolute -top-16 left-0 w-40 h-40 rounded-full border-4 border-surface bg-surface shadow-xl overflow-hidden flex items-center justify-center z-10 transition-colors duration-300">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-main flex items-center justify-center text-5xl font-bold text-secondary transition-colors duration-300">
                          {alumniData.nama.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end pt-4 gap-2">
                    <button
                      onClick={() => { setPasswords({ oldPassword:'',newPassword:'',confirmPassword:'' }); setPwdError(''); setPwdSuccess(''); setIsPasswordModalOpen(true); }}
                      className="px-5 py-2 text-slate-600 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                      <KeyRound size={12} /> Ubah Sandi
                    </button>
                    <button
                      onClick={handleOpenEdit}
                      className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      <Edit2 size={12} /> Edit Profil
                    </button>
                  </div>

                  {/* Info Area */}
                  <div className="mt-16">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black text-primary tracking-tight">{alumniData.nama}</h1>
                      {alumniData.verified && (
                        <div className="p-1 bg-blue-50 text-blue-600 rounded-full" title="Identitas Terverifikasi">
                          <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold">
                      <span className="text-blue-600">{alumniData.status_kerja || 'Belum Bekerja'}</span>
                      {alumniData.np && <span className="text-primary">{alumniData.np}</span>}
                      <span className="text-secondary opacity-40">•</span>
                      <span className="text-secondary">Lulusan {alumniData.tahun_lulus || '-'}</span>
                      <span className="text-secondary opacity-60 font-medium">NIM: {alumniData.nim}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-secondary uppercase tracking-widest">
                      <MapPin size={12} className="text-secondary opacity-40" />
                      {[alumniData.kota_kabupaten, alumniData.provinsi].filter(Boolean).join(', ') || 'Lokasi belum diatur'}
                    </div>

                    {alumniData.is_open_to_work && (
                      <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Terbuka untuk bekerja
                      </div>
                    )}
                    
                    {/* Render Social Media */}
                    {safeSocialMedia && safeSocialMedia.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {safeSocialMedia.map((sm, i) => {
                          const platformObj = socialPlatforms.find(p => p.id === sm.platform) || { label: sm.platform };
                          return (
                            <div key={i} className="px-4 py-2 bg-main border border-border-subtle rounded-full text-[10px] font-black text-secondary flex items-center gap-2">
                              {getPlatformIcon(sm.platform, 14)} {sm.username || platformObj.label}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

               {/* About Me Section */}
               <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-10 shadow-sm transition-colors duration-300 group">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest">Tentang Saya</h3>
                    <button onClick={handleOpenEdit} className="p-2 text-secondary hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                       <Edit2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                    {alumniData.keterangan || "Ceritakan tentang diri Anda untuk menarik perhatian perekrut."}
                  </p>
               </div>

          {/* Keahlian & Sertifikat Section (LinkedIn Timeline Style) */}
          <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-10 shadow-sm transition-colors duration-300">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black text-primary uppercase tracking-widest">Keahlian &amp; Sertifikasi</h2>
              <button onClick={handleOpenSkills} className="px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                Kelola Data
              </button>
            </div>

            {/* Skill Tags */}
            {skills.length > 0 ? (
              <div className="mb-12">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4">Keahlian Utama</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="px-5 py-2.5 bg-main border border-border-subtle text-primary rounded-2xl text-xs font-bold hover:border-blue-200 hover:bg-blue-50 transition-all">{s}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-12 p-6 border border-dashed border-border-subtle rounded-2xl text-center">
                <p className="text-sm text-secondary opacity-80 italic">Belum ada keahlian dicantumkan.</p>
              </div>
            )}

            {/* Sertifikat Timeline */}
            {sertifikasiList.length > 0 && (
              <div className="relative ml-4 space-y-12">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2 ml-[-1rem]">Daftar Sertifikasi & Pengalaman</p>
                {/* Vertical Line */}
                <div className="absolute left-0 top-12 bottom-2 w-0.5 bg-slate-100" />
                
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
                      <div className="absolute left-[-5px] top-2 w-3 h-3 bg-surface border-2 border-slate-300 rounded-full group-hover:border-blue-500 transition-colors z-10" />

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-black text-primary text-base leading-tight group-hover:text-blue-600 transition-colors">{cert.nama_keahlian}</h4>
                          <p className="text-xs font-bold text-secondary mt-1 uppercase tracking-wider flex items-center gap-2">
                             {cert.tanggal_mulai ? formatDate(cert.tanggal_mulai) : '-'} 
                             {cert.tanggal_selesai ? ` — ${formatDate(cert.tanggal_selesai)}` : ' — Sekarang'}
                          </p>
                        </div>

                        {/* Image Previews */}
                        <div className="flex flex-wrap gap-3 pt-2">
                          {certUrl && (
                            <a href={certUrl} target="_blank" rel="noopener noreferrer" className="w-28 h-20 rounded-2xl border border-border-subtle overflow-hidden bg-main shadow-sm hover:ring-4 hover:ring-blue-500/10 transition-all flex items-center justify-center group/item">
                              {isPdf ? (
                                <div className="flex flex-col items-center">
                                  <FileText size={24} className="text-red-500" />
                                  <span className="text-[9px] font-black text-red-500 mt-1 uppercase tracking-widest">Sertif</span>
                                </div>
                              ) : (
                                <img src={thumbCert} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" alt="Sertifikat" />
                              )}
                            </a>
                          )}
                          {docUrl && (
                            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="w-28 h-20 rounded-2xl border border-border-subtle overflow-hidden bg-main shadow-sm hover:ring-4 hover:ring-emerald-500/10 transition-all group/item">
                              <img src={thumbDoc} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" alt="Dokumentasi" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

              {/* Biodata */}
              <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-10 shadow-sm transition-colors duration-300">
                <div className="mb-10">
                   <h2 className="text-sm font-black text-primary uppercase tracking-widest">Biodata Lengkap</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                  <DetailItem label="NIM Mahasiswa" value={alumniData.nim} />
                  <DetailItem label="Program Studi" value={alumniData.prodi} />
                  <DetailItem label="Angkatan / Lulus" value={alumniData.tahun_lulus} />
                  <DetailItem label="Jenis Kelamin" value={alumniData.gender === 'L' ? 'Laki-Laki' : alumniData.gender === 'P' ? 'Perempuan' : '-'} />
                  <DetailItem label="Agama" value={alumniData.agama || '-'} />
                  <DetailItem label="RT / RW" value={`${alumniData.rt || '-'} / ${alumniData.rw || '-'}`} />
                  
                  <div className="sm:col-span-2 pt-6 border-t border-slate-50">
                     <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6">Informasi Karir Saat Ini</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <DetailItem label="Status Pekerjaan" value={alumniData.status_kerja} highlight={true} />
                        <DetailItem label="Nama Instansi" value={alumniData.np} />
                     </div>
                  </div>

                  <div className="sm:col-span-2 pt-6 border-t border-slate-50">
                    <DetailItem label="Alamat Domisili" value={[alumniData.alamat, alumniData.kelurahan, alumniData.kecamatan, alumniData.kota_kabupaten, alumniData.provinsi].filter(Boolean).join(', ')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Contact & Recommendations */}
            <div className="space-y-6 sticky top-8">
               {/* Contact Card (Top of Sidebar) */}
               <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm">
                  <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6">Informasi Kontak</h3>
                  <div className="space-y-5">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                           <Mail size={18} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Email</p>
                           <p className="text-xs font-bold text-primary truncate">{alumniData.email || '-'}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                           <Phone size={18} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Telepon</p>
                           <p className="text-xs font-bold text-primary truncate">{alumniData.no_hp || '-'}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <RecommendationSidebar 
                  role="alumni" 
                  currentAlumniId={alumniData.id} 
                  currentProdi={alumniData.prodi}
               />
            </div>
          </div>
        </>
      )}

      {/* ===== MODAL EDIT ===== */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-elevated border border-border-subtle w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border-subtle">
              <h2 className="text-lg font-bold text-primary">Edit Profil</h2>
              <button onClick={() => !saving && setIsEditing(false)} className="text-secondary hover:text-primary text-xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">
              <form id="editForm" onSubmit={handleSubmit}>
                {/* Hidden inputs */}
                <input type="file" accept="image/*" ref={avatarRef} className="hidden" onChange={e => {
                  const f = e.target.files[0]; if (f) { setFormData(p => ({...p, gambar: f})); setPreviewAvatar(URL.createObjectURL(f)); }
                }} />
                <input type="file" accept="image/*" ref={bannerRef} className="hidden" onChange={e => {
                  const f = e.target.files[0]; if (f) { setFormData(p => ({...p, banner: f})); setPreviewBanner(URL.createObjectURL(f)); }
                }} />

                {/* Banner Preview + Avatar */}
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <div className="h-32 bg-slate-100 relative group cursor-pointer" onClick={() => bannerRef.current?.click()}>
                    {(previewBanner || (formData.banner && typeof formData.banner === 'string')) ? (
                      <img src={previewBanner || pb.files.getURL(alumniData, formData.banner)} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <span className="text-slate-500 text-xs flex items-center gap-1.5"><ImageIcon size={14}/> Klik untuk upload foto sampul</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/90 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"><Camera size={12}/> Upload Sampul</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-4 bg-white">
                    <div className="w-14 h-14 rounded-full border-2 border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
                      {(previewAvatar || (formData.gambar && typeof formData.gambar === 'string')) ? (
                        <img src={previewAvatar || pb.files.getURL(alumniData, formData.gambar, {thumb:'100x100'})} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl text-slate-400 font-bold">{formData.nama?.charAt(0)}</div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                        <Camera className="text-white" size={14} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <button type="button" onClick={() => avatarRef.current?.click()} className="text-blue-700 font-semibold hover:underline">Ganti Foto Profil</button>
                      {formData.gambar && typeof formData.gambar !== 'object' && (
                        <button type="button" onClick={() => { setFormData(p=>({...p,gambar:null})); setPreviewAvatar(null); }} className="text-red-400 hover:text-red-600">Hapus Foto</button>
                      )}
                      {(formData.banner || previewBanner) && (
                        <button type="button" onClick={() => { setFormData(p=>({...p,banner:null,bannerTemplate:null})); setPreviewBanner(null); setSelectedTemplate(null); }} className="text-red-400 hover:text-red-600">Hapus Sampul</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Template Picker */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Atau pilih template sampul</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BANNER_TEMPLATES.map(tpl => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedTemplate === tpl.id ? 'border-blue-600 ring-2 ring-blue-300' : 'border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <img src={tpl.src} alt={tpl.label} className="w-full h-full object-cover" />
                        {selectedTemplate === tpl.id && (
                          <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-white drop-shadow" />
                          </div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 text-[10px] font-semibold text-white bg-black/40 text-center py-0.5">{tpl.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nama (Statik)</label>
                    <input type="text" disabled value={formData.nama || ''} className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status Pekerjaan</label>
                    <CustomSelect 
                      value={formData.status_kerja || ''} 
                      onChange={e => setFormData({ ...formData, status_kerja: e.target.value })} 
                      options={[
                        { value: 'Bekerja', label: 'Bekerja' },
                        { value: 'Wiraswasta', label: 'Wiraswasta / Usaha' },
                        { value: 'Melanjutkan Studi', label: 'Melanjutkan Studi' },
                        { value: 'Belum Bekerja', label: 'Belum Bekerja' }
                      ]}
                      placeholder="Pilih Status"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Perusahaan / Afiliasi</label>
                    <input type="text" value={formData.np||''} onChange={e=>setFormData({...formData,np:e.target.value})} placeholder="Contoh: PT ABC" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>

                  {/* Open to Work */}
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200 p-3 rounded-md">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative flex-shrink-0">
                        <input type="checkbox" className="sr-only" checked={!!formData.is_open_to_work} onChange={e=>setFormData({...formData,is_open_to_work:e.target.checked})} />
                        <div className={`w-9 h-5 rounded-full transition-colors ${formData.is_open_to_work ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.is_open_to_work ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-800">Terbuka untuk bekerja</span>
                        <span className="block text-xs text-slate-500">Beritahu perekrut bahwa Anda terbuka untuk peluang baru.</span>
                      </div>
                    </label>
                  </div>

                  {/* Dokumen CV */}
                  <div className="sm:col-span-2 border-t border-slate-100 pt-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dokumen CV / Resume</label>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                       <label className="flex items-start gap-3 cursor-pointer group">
                         <div className="relative flex-shrink-0 mt-0.5">
                           <input type="checkbox" className="sr-only" checked={!!formData.use_profile_as_cv} onChange={e=>setFormData({...formData,use_profile_as_cv:e.target.checked})} />
                           <div className={`w-9 h-5 rounded-full transition-colors ${formData.use_profile_as_cv ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
                           <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.use_profile_as_cv ? 'translate-x-4' : ''}`}></div>
                         </div>
                         <div>
                           <span className="text-sm font-semibold text-slate-800">Gunakan Data Profil Sebagai CV (Otomatis)</span>
                           <span className="block text-xs text-slate-500 mt-0.5">Sistem akan menyusun profil lengkap Anda menjadi tampilan CV untuk dilihat oleh perusahaan. Anda tidak perlu repot mengunggah PDF.</span>
                         </div>
                       </label>
                       
                       <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-slate-100">
                          <input type="file" accept="application/pdf" ref={cvRef} className="hidden" onChange={e => {
                            const f = e.target.files[0]; if (f) setFormData(p => ({...p, cv: f, use_profile_as_cv: false}));
                          }} />
                          <button type="button" onClick={() => cvRef.current?.click()} className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-700 transition-colors flex items-center justify-center gap-2">
                             <span className="font-bold">+</span> Upload File PDF Manual
                          </button>
                          {(formData.cv instanceof File) ? (
                            <span className="text-sm font-medium text-blue-600 truncate max-w-[200px]">Diunggah: {formData.cv.name}</span>
                          ) : (alumniData?.cv && formData.cv !== null) ? (
                            <div className="flex items-center gap-3 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                               <a href={pb.files.getURL(alumniData, alumniData.cv)} target="_blank" className="text-sm font-medium text-blue-700 hover:underline">📄 Lihat File Saat Ini</a>
                               <div className="w-px h-4 bg-blue-200"></div>
                               <button type="button" onClick={() => setFormData(p => ({...p, cv: null}))} className="text-xs font-bold text-red-500 hover:underline uppercase tracking-wide">Hapus</button>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Belum ada file PDF.</span>
                          )}
                       </div>
                    </div>
                  </div>


                  {/* Region */}
                  <div className="sm:col-span-2 border-t border-slate-100 pt-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Lokasi Domisili</label>
                    <RegionSelect formData={formData} handleChange={e=>setFormData({...formData,[e.target.name]:e.target.value})} isIndonesia={true} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Jenis Kelamin</label>
                    <CustomSelect 
                      value={formData.gender || ''} 
                      onChange={e => setFormData({ ...formData, gender: e.target.value })} 
                      options={[
                        { value: 'L', label: 'Laki-laki' },
                        { value: 'P', label: 'Perempuan' }
                      ]}
                      placeholder="Pilih"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tentang Saya (Deskripsi Profil)</label>
                    <textarea 
                      value={formData.keterangan||''} 
                      onChange={e=>setFormData({...formData,keterangan:e.target.value})} 
                      rows={4}
                      placeholder="Ceritakan tentang diri Anda, pengalaman, atau minat profesional Anda..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none" 
                    />
                  </div>
                  
                  <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <SocialMediaEditor 
                      value={formData.social_media} 
                      onChange={(newVal) => setFormData(f => ({...f, social_media: newVal}))} 
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border-subtle bg-elevated rounded-b-xl">
              <button type="button" onClick={()=>setIsEditing(false)} disabled={saving} className="px-5 py-2 text-sm font-semibold text-secondary rounded-full hover:bg-main disabled:opacity-50 transition-colors">Batal</button>
              <button form="editForm" type="submit" disabled={saving} className="px-6 py-2 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-full disabled:opacity-50 shadow-sm transition-colors">
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL PASSWORD ===== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-elevated border border-border-subtle w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border-subtle">
              <h2 className="text-lg font-bold text-primary">Ubah Kata Sandi</h2>
              <button onClick={()=>!pwdLoading&&setIsPasswordModalOpen(false)} className="text-secondary hover:text-primary text-xl leading-none">&times;</button>
            </div>
            <div className="p-5">
              {pwdError && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{pwdError}</div>}
              {pwdSuccess && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">{pwdSuccess}</div>}
              {!pwdSuccess && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {[
                    {label:'Sandi Saat Ini', key:'oldPassword'},
                    {label:'Sandi Baru', key:'newPassword', hint:'Minimal 8 karakter'},
                    {label:'Konfirmasi Sandi Baru', key:'confirmPassword'},
                  ].map(({label,key,hint}) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-primary mb-1">{label}</label>
                      <input type="password" required value={passwords[key]} onChange={e=>setPasswords({...passwords,[key]:e.target.value})} className="input-warm w-full" />
                      {hint && <p className="text-xs text-secondary mt-1">{hint}</p>}
                    </div>
                  ))}
                  <button type="submit" disabled={pwdLoading} className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-full text-sm transition-colors disabled:opacity-50">
                    {pwdLoading ? 'Memproses...' : 'Simpan Sandi Baru'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL KEAHLIAN & SERTIFIKAT ===== */}
      {isSkillsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-elevated border border-border-subtle w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border-subtle">
              <h2 className="text-lg font-bold text-primary">Keahlian &amp; Sertifikasi</h2>
              <button onClick={() => !savingSkills && setIsSkillsOpen(false)} className="text-secondary hover:text-primary text-xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">
              {/* Skill Tags */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Keahlian / Skills</label>
                <div className="flex flex-wrap gap-2 p-3 border border-border-subtle bg-surface rounded-lg min-h-[48px] focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
                  {skillTags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {tag}
                      <button type="button" onClick={() => setSkillTags(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-blue-500 hover:text-red-500 transition-colors leading-none">&times;</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder={skillTags.length === 0 ? 'Ketik keahlian lalu Enter...' : 'Tambah lagi...'}
                    className="flex-1 min-w-[140px] outline-none bg-transparent text-sm text-primary placeholder:text-secondary"
                  />
                </div>
                <p className="text-xs text-secondary mt-1.5">Tekan <kbd className="bg-main border border-border-subtle px-1.5 py-0.5 rounded text-[11px] font-mono">Enter</kbd> untuk menambah, <kbd className="bg-main border border-border-subtle px-1.5 py-0.5 rounded text-[11px] font-mono">Backspace</kbd> untuk hapus terakhir.</p>
              </div>

              {/* Certificate Upload */}
              <div className="border-t border-border-subtle pt-5 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-primary">Sertifikasi &amp; Dokumen Keahlian</label>
                  <button type="button" onClick={() => setCertList(prev => [...prev, { nama_keahlian: '', tanggal_mulai: '', tanggal_selesai: '', file_sertifikat: null, file_dokumentasi: null }])} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">+ Tambah Sertifikasi</button>
                </div>
                
                <div className="space-y-4">
                  {certList.length === 0 ? (
                    <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center text-sm text-slate-400">Belum ada sertifikasi. Klik tambah untuk mulai.</div>
                  ) : (
                    certList.map((cert, index) => (
                      <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                        <button type="button" onClick={() => {
                          if (cert.id) setDeletedCertIds(prev => [...prev, cert.id]);
                          setCertList(prev => prev.filter((_, i) => i !== index));
                        }} className="absolute -top-2.5 -right-2.5 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition-all shadow-sm">
                          <span className="sr-only">Hapus</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nama Sertifikasi / Keahlian *</label>
                            <input type="text" value={cert.nama_keahlian} onChange={e => {
                              const newCerts = [...certList]; newCerts[index].nama_keahlian = e.target.value; setCertList(newCerts);
                            }} placeholder="Contoh: AWS Certified Solutions Architect" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 outline-none" required />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tanggal Mulai</label>
                              <input type="date" value={cert.tanggal_mulai} onChange={e => {
                                const newCerts = [...certList]; newCerts[index].tanggal_mulai = e.target.value; setCertList(newCerts);
                              }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tanggal Selesai (Opsional)</label>
                              <input type="date" value={cert.tanggal_selesai} onChange={e => {
                                const newCerts = [...certList]; newCerts[index].tanggal_selesai = e.target.value; setCertList(newCerts);
                              }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">File Sertifikat (PDF/Gambar)</label>
                              <div className="flex flex-col gap-1">
                                <input type="file" accept="image/*,application/pdf" onChange={e => {
                                  if(e.target.files[0]) { const newCerts = [...certList]; newCerts[index].file_sertifikat = e.target.files[0]; setCertList(newCerts); }
                                }} className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                                {cert.existing_sertifikat && !cert.file_sertifikat && <span className="text-[10px] font-semibold text-blue-600 truncate">Tersimpan: {cert.existing_sertifikat}</span>}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Foto Dokumentasi (Gambar)</label>
                              <div className="flex flex-col gap-1">
                                <input type="file" accept="image/*" onChange={e => {
                                  if(e.target.files[0]) { const newCerts = [...certList]; newCerts[index].file_dokumentasi = e.target.files[0]; setCertList(newCerts); }
                                }} className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200" />
                                {cert.existing_dokumentasi && !cert.file_dokumentasi && <span className="text-[10px] font-semibold text-green-600 truncate">Tersimpan: {cert.existing_dokumentasi}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border-subtle bg-elevated rounded-b-xl">
              <button type="button" onClick={() => setIsSkillsOpen(false)} disabled={savingSkills}
                className="px-5 py-2 text-sm font-semibold text-secondary rounded-full hover:bg-main disabled:opacity-50">
                Batal
              </button>
              <button type="button" onClick={handleSaveSkills} disabled={savingSkills}
                className="px-6 py-2 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-full disabled:opacity-50 shadow-sm">
                {savingSkills ? 'Menyimpan...' : 'Simpan Keahlian'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, highlight = false }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-black text-secondary uppercase tracking-widest block">{label}</span>
      <span className={`text-sm font-black ${highlight ? 'text-blue-600' : 'text-primary'}`}>
        {value || <span className="text-secondary opacity-50 font-medium italic">Data tidak tersedia</span>}
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
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm">
       <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl"></div>)}
       </div>
    </div>
  );

  const title = role === 'alumni' ? 'Rekomendasi Perusahaan' : 'Alumni Lain yang Mirip';

  return (
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm">
      <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6">
        {title}
      </h3>
      <div className="space-y-5">
        {recommendations.length > 0 ? recommendations.map((item) => (
          <div key={item.id} className="group flex items-center gap-4 cursor-pointer" onClick={() => window.location.href = item.link}>
             <div className="w-12 h-12 rounded-2xl border-2 border-border-subtle overflow-hidden flex-shrink-0 bg-main flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xs font-black text-secondary transition-colors duration-300">
                    {item.initial}
                  </div>
                )}
             </div>
             <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-primary truncate group-hover:text-blue-600 transition-colors">{item.title}</h4>
                <p className="text-[10px] font-bold text-secondary truncate mt-0.5">{item.subtitle}</p>
             </div>
          </div>
        )) : (
          <p className="text-[10px] font-bold text-secondary opacity-50 italic text-center py-4">Tidak ada rekomendasi saat ini.</p>
        )}
      </div>
    </div>
  );
}
