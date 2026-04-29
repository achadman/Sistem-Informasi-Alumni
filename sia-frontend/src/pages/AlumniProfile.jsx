import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import RegionSelect from '../components/RegionSelect';
import SocialMediaEditor, { getPlatformIcon, socialPlatforms } from '../components/SocialMediaEditor';
import { Camera, Edit2, KeyRound, ImageIcon, CheckCircle2 } from 'lucide-react';

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
  const [newCerts, setNewCerts] = useState([]); // File[] to upload
  const [deletedCerts, setDeletedCerts] = useState([]); // filename strings to delete
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
      if (res.items?.length > 0) setAlumniData(res.items[0]);
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
    setNewCerts([]);
    setDeletedCerts([]);
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
      newCerts.forEach(f => d.append('sertifikat', f));
      if (deletedCerts.length > 0) {
        deletedCerts.forEach(fname => d.append('sertifikat-', fname));
      }
      await pb.collection('alumni').update(alumniData.id, d);
      // Close modal FIRST to avoid blank during loading state
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
    <div className="w-full space-y-4 pb-6">
      {loading ? (
        <div className="p-4 text-slate-500 text-sm">Memuat data profil...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
          {error} <button onClick={() => fetchMyAlumniData(username)} className="ml-3 underline font-medium">Coba Lagi</button>
        </div>
      ) : alumniData && (
        <>
          {/* Profile Card */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
            {/* Banner */}
            <div className="h-52 relative overflow-hidden bg-slate-200 group">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300" />
              )}
              <button
                onClick={handleOpenEdit}
                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                title="Ganti foto sampul"
              >
                <span className="bg-white/90 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <ImageIcon size={13} /> Ganti Sampul
                </span>
              </button>
            </div>

            <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="w-36 h-36 rounded-full border-4 border-white bg-white absolute -top-[4.5rem] left-6 shadow-md overflow-hidden flex items-center justify-center z-10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl font-bold text-slate-400">
                    {alumniData.nama.charAt(0)}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 gap-2">
                <button
                  onClick={() => { setPasswords({ oldPassword:'',newPassword:'',confirmPassword:'' }); setPwdError(''); setPwdSuccess(''); setIsPasswordModalOpen(true); }}
                  className="px-4 py-1.5 text-slate-600 border border-slate-300 rounded-full hover:bg-slate-50 transition-colors font-medium text-sm flex items-center gap-1.5"
                >
                  <KeyRound size={14} /> <span className="hidden sm:inline">Ubah Sandi</span>
                </button>
                <button
                  onClick={handleOpenEdit}
                  className="px-4 py-1.5 text-blue-700 border border-blue-600 rounded-full hover:bg-blue-50 transition-colors font-medium text-sm flex items-center gap-1.5"
                >
                  <Edit2 size={14} /> <span className="hidden sm:inline">Edit Profil</span>
                </button>
              </div>

              {/* Info — offset to clear the avatar */}
              <div className="mt-14">
                <h1 className="text-2xl font-bold text-slate-900">{alumniData.nama}</h1>
                <p className="text-sm text-slate-700 mt-1">
                  {alumniData.status_kerja || 'Belum Bekerja'}
                  {alumniData.np && <span className="text-slate-500"> · {alumniData.np}</span>}
                  <span className="text-slate-400 mx-1.5">|</span>
                  <span className="text-slate-500">Lulusan {alumniData.tahun_lulus || '-'}</span>
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {[alumniData.kota_kabupaten, alumniData.provinsi].filter(Boolean).join(', ') || 'Lokasi belum diatur'}
                </p>
                {alumniData.is_open_to_work && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
                    Terbuka untuk bekerja
                  </div>
                )}
                
                {/* Render Social Media */}
                {safeSocialMedia && safeSocialMedia.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {safeSocialMedia.map((sm, i) => {
                      const platformObj = socialPlatforms.find(p => p.id === sm.platform) || { label: sm.platform };
                      return sm.link ? (
                        <a key={i} href={sm.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-blue-700 hover:bg-slate-100 hover:border-blue-300 transition-colors">
                          {getPlatformIcon(sm.platform, 14)} {sm.username || platformObj.label}
                        </a>
                      ) : (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
                          {getPlatformIcon(sm.platform, 14)} {sm.username || platformObj.label}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Keahlian & Sertifikat Section */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm shadow-slate-200/50">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-slate-800 text-base">Keahlian &amp; Sertifikasi</h2>
              <button onClick={handleOpenSkills} className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1">
                <Edit2 size={14} /> Kelola
              </button>
            </div>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((s, i) => (
                  <span key={i} className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 text-sm font-medium rounded-full">{s}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic mb-4">Belum ada keahlian dicantumkan.</p>
            )}
            {/* Sertifikat */}
            {toArray(alumniData.sertifikat).length > 0 && (
              <div className="border-t border-slate-100 pt-3 mt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Sertifikasi</p>
                <div className="flex flex-wrap gap-2">
                  {toArray(alumniData.sertifikat).map((cert, i) => {
                    const url = pb.files.getURL(alumniData, cert);
                    const isPdf = cert.toLowerCase().endsWith('.pdf');
                    return (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-lg px-3 py-2 text-sm text-slate-700 hover:text-blue-700 transition-colors">
                        {isPdf ? '📄' : '🖼️'} {cert.length > 28 ? cert.substring(0, 28) + '...' : cert}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Biodata */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm shadow-slate-200/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-800 text-base">Detail Biodata</h2>
              <button onClick={handleOpenEdit} className="text-slate-400 hover:text-slate-700 transition-colors"><Edit2 size={16} /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
              <DetailItem label="NIM" value={alumniData.nim} />
              <DetailItem label="Jenis Kelamin" value={alumniData.gender === 'L' ? 'Laki-Laki' : alumniData.gender === 'P' ? 'Perempuan' : '-'} />
              <DetailItem label="Agama" value={alumniData.agama || '-'} />
              <DetailItem label="Provinsi" value={alumniData.provinsi || '-'} />
              <DetailItem label="Kota/Kabupaten" value={alumniData.kota_kabupaten || '-'} />
              <DetailItem label="Kecamatan" value={alumniData.kecamatan || '-'} />
              <DetailItem label="Kelurahan/Desa" value={alumniData.kelurahan || '-'} />
              <DetailItem label="RT / RW" value={`${alumniData.rt || '-'} / ${alumniData.rw || '-'}`} />
              {alumniData.keterangan && <DetailItem label="Keterangan" value={alumniData.keterangan} className="col-span-2 sm:col-span-3" />}
            </div>
          </div>
        </>
      )}

      {/* ===== MODAL EDIT ===== */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Edit Profil</h2>
              <button onClick={() => !saving && setIsEditing(false)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">&times;</button>
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
                    <select value={formData.status_kerja||''} onChange={e=>setFormData({...formData,status_kerja:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                      <option value="">Pilih Status</option>
                      <option value="Bekerja">Bekerja</option>
                      <option value="Wiraswasta">Wiraswasta / Usaha</option>
                      <option value="Melanjutkan Studi">Melanjutkan Studi</option>
                      <option value="Belum Bekerja">Belum Bekerja</option>
                    </select>
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
                    <select value={formData.gender||''} onChange={e=>setFormData({...formData,gender:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Keterangan Lain</label>
                    <input type="text" value={formData.keterangan||''} onChange={e=>setFormData({...formData,keterangan:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
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

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-white">
              <button type="button" onClick={()=>setIsEditing(false)} disabled={saving} className="px-5 py-2 text-sm font-semibold text-slate-600 rounded-full hover:bg-slate-100 disabled:opacity-50 transition-colors">Batal</button>
              <button form="editForm" type="submit" disabled={saving} className="px-6 py-2 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-full disabled:opacity-50 shadow-sm transition-colors">
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL PASSWORD ===== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Ubah Kata Sandi</h2>
              <button onClick={()=>!pwdLoading&&setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">&times;</button>
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
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                      <input type="password" required value={passwords[key]} onChange={e=>setPasswords({...passwords,[key]:e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Keahlian &amp; Sertifikasi</h2>
              <button onClick={() => !savingSkills && setIsSkillsOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">
              <input type="file" accept="image/*,application/pdf" multiple ref={certRef} className="hidden"
                onChange={e => setNewCerts(prev => [...prev, ...Array.from(e.target.files)])} />

              {/* Skill Tags */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Keahlian / Skills</label>
                <div className="flex flex-wrap gap-2 p-3 border border-slate-300 rounded-lg min-h-[48px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
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
                    className="flex-1 min-w-[140px] outline-none text-sm text-slate-800 placeholder-slate-400"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Tekan <kbd className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-[11px] font-mono">Enter</kbd> untuk menambah, <kbd className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-[11px] font-mono">Backspace</kbd> untuk hapus terakhir.</p>
              </div>

              {/* Certificate Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sertifikasi &amp; Dokumen</label>
                {/* Existing certs */}
                {alumniData.sertifikat && toArray(alumniData.sertifikat).length > 0 && (
                  <div className="space-y-2 mb-3">
                    {toArray(alumniData.sertifikat).filter(f => !deletedCerts.includes(f)).map((cert, i) => {
                      const url = pb.files.getURL(alumniData, cert);
                      const isPdf = cert.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 hover:underline flex items-center gap-2">
                            <span>{isPdf ? '📄' : '🖼️'}</span>
                            <span className="truncate max-w-[220px]">{cert}</span>
                          </a>
                          <button type="button" onClick={() => setDeletedCerts(prev => [...prev, cert])}
                            className="text-red-400 hover:text-red-600 text-xs font-semibold ml-2">Hapus</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* New certs to upload */}
                {newCerts.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {newCerts.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <span className="text-sm text-blue-800 flex items-center gap-2">
                          <span>{f.type.includes('pdf') ? '📄' : '🖼️'}</span>
                          <span className="truncate max-w-[220px]">{f.name}</span>
                        </span>
                        <button type="button" onClick={() => setNewCerts(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-600 text-xs font-semibold ml-2">Batal</button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => certRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg py-3 text-sm text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                  <span>+</span> Upload Sertifikat / Dokumen (JPG, PNG, PDF)
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200">
              <button type="button" onClick={() => setIsSkillsOpen(false)} disabled={savingSkills}
                className="px-5 py-2 text-sm font-semibold text-slate-600 rounded-full hover:bg-slate-100 disabled:opacity-50">
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

function DetailItem({ label, value, className = '' }) {
  return (
    <div className={`border-b border-slate-100 pb-3 ${className}`}>
      <span className="block text-xs text-slate-500 mb-0.5">{label}</span>
      <span className="block text-sm font-medium text-slate-800">{value || '-'}</span>
    </div>
  );
}
