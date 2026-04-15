import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Briefcase, Phone, Mail, Loader2, Edit3, AlertCircle } from 'lucide-react';
import { pb } from '../lib/pb';
import RegionSelect from './RegionSelect';

export default function AddAlumniModal({ isOpen, onClose, onSave, editData = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [isCheckingNim, setIsCheckingNim] = useState(false);

  const [formData, setFormData] = useState({
    nim: '',
    nama: '',
    gender: 'L',
    agama: '',
    tahun_lulus: new Date().getFullYear(),
    golongan_darah: 'A',
    email: '',
    no_hp: '',
    alamat: '',
    negara: 'Indonesia',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    rw: '',
    rt: '',
    status_kerja: 'Belum Bekerja',
    instansi: '',
    jabatan: '',
    np: '',
    keterangan: 'Lulus',
    semester_dropout: 0
  });

  useEffect(() => {
    const checkNim = async () => {
      if (!formData.nim) {
        setDuplicateWarning('');
        return;
      }
      
      // Jika mode edit dan NIM belum berubah dari data rujukan, abaikan
      if (editData && editData.nim === formData.nim) {
        setDuplicateWarning('');
        return;
      }

      setIsCheckingNim(true);
      try {
        const records = await pb.collection('alumni').getList(1, 1, { filter: `nim="${formData.nim}"` });
        if (records.items && records.items.length > 0) {
          setDuplicateWarning(`NIM "${formData.nim}" sudah terdaftar atas nama ${records.items[0].nama}. Silakan periksa kembali menghindari data duplikat.`);
        } else {
          setDuplicateWarning('');
        }
      } catch (err) {
        if (!err.isAbort) console.error("Cek duplikasi error:", err);
      } finally {
        setIsCheckingNim(false);
      }
    };

    const timer = setTimeout(checkNim, 600);
    return () => clearTimeout(timer);
  }, [formData.nim, editData]);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        keterangan: editData.keterangan || 'Lulus',
        status_kerja: editData.status_kerja || 'Belum Bekerja'
      });
    } else {
      setDuplicateWarning('');
      setFormData({
        nim: '',
        nama: '',
        gender: 'L',
        agama: '',
        tahun_lulus: new Date().getFullYear(),
        golongan_darah: 'A',
        email: '',
        no_hp: '',
        alamat: '',
        negara: 'Indonesia',
        provinsi: '',
        kota: '',
        kecamatan: '',
        kelurahan: '',
        rw: '',
        rt: '',
        status_kerja: 'Belum Bekerja',
        instansi: '',
        jabatan: '',
        np: '',
        keterangan: 'Lulus',
        semester_dropout: 0
      });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Sanitasi NIM (Bersihkan spasi)
      const sanitizedNim = String(formData.nim || '').trim();
      
      // 2. Cek Duplikasi Terakhir (Safety Net)
      // Kita cek apakah ada record lain dengan NIM yang sama
      const duplicateFilter = `nim="${sanitizedNim}"`;
      const checkDuplicate = await pb.collection('alumni').getList(1, 1, { 
        filter: duplicateFilter,
        requestKey: null // Bypass auto-cancel
      });

      if (checkDuplicate.items.length > 0) {
        const existing = checkDuplicate.items[0];
        // Jika ID-nya berbeda dengan data yang sedang diedit, berarti ganda
        if (!editData || (editData && existing.id !== editData.id)) {
          throw new Error(`Gagal Simpan: NIM ${sanitizedNim} sudah terdaftar atas nama ${existing.nama}.`);
        }
      }

      const dataToSubmit = {
        ...formData,
        nim: sanitizedNim, // Simpan NIM yang sudah bersih
        semester_dropout: formData.keterangan === 'Drop Out (DO)' ? Number(formData.semester_dropout) || 0 : 0
      };

      if (editData && editData.id) {
        await pb.collection('alumni').update(editData.id, dataToSubmit);
      } else {
        await pb.collection('alumni').create(dataToSubmit);
      }
      onSave(); // Trigger refresh in parent
      onClose();
      // Reset form
      setFormData({
        nim: '',
        nama: '',
        gender: 'L',
        agama: '',
        tahun_lulus: new Date().getFullYear(),
        golongan_darah: 'A',
        email: '',
        no_hp: '',
        alamat: '',
        negara: 'Indonesia',
        provinsi: '',
        kota: '',
        kecamatan: '',
        kelurahan: '',
        rw: '',
        rt: '',
        status_kerja: 'Belum Bekerja',
        instansi: '',
        jabatan: '',
        keterangan: 'Lulus',
        semester_dropout: 0
      });
    } catch (err) {
      console.error("Gagal simpan alumni:", err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{editData ? 'Edit Data Alumni' : 'Tambah Alumni Baru'}</h2>
            <p className="text-slate-500 text-sm mt-1">{editData ? 'Lakukan perubahan pada data riwayat alumni.' : 'Lengkapi data alumni untuk database institusi.'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Form Body */}
        <form id="add-alumni-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}
          
          {/* Personal Information */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-light text-brand-primary rounded-lg">
                <User size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Informasi Pribadi</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">NIM</label>
                <div className="relative">
                  <input required name="nim" value={formData.nim} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl border ${duplicateWarning ? 'border-amber-400 focus:ring-amber-100 focus:border-amber-500' : 'border-slate-200 focus:ring-brand-light focus:border-brand-primary/40'} focus:ring-4 transition-all outline-none`} placeholder="Contoh: 201011400" />
                  {isCheckingNim && (
                    <div className="absolute right-3 top-3 text-slate-400">
                      <Loader2 size={18} className="animate-spin" />
                    </div>
                  )}
                </div>
                {duplicateWarning && (
                  <p className="text-xs font-bold text-amber-600 flex items-start gap-1 mt-1 animate-in fade-in">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{duplicateWarning}</span>
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
                <input required name="nama" value={formData.nama} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all outline-none" placeholder="Nama sesuai ijazah" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jenis Kelamin</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none appearance-none">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Agama</label>
                  <input name="agama" value={formData.agama} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none" placeholder="Islam / Kristen / dsb" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Gol. Darah</label>
                  <select name="golongan_darah" value={formData.golongan_darah} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none appearance-none">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tahun Lulus</label>
                  <input type="number" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className={`space-y-1.5 transition-all duration-300 ${formData.keterangan === 'Drop Out (DO)' ? 'col-span-1' : 'col-span-2'}`}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 block min-h-[2.5rem]">Keterangan (Status Akademik)</label>
                  <select name="keterangan" value={formData.keterangan || 'Lulus'} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none appearance-none bg-white">
                    <option value="Lulus">Lulus</option>
                    <option value="Drop Out (DO)">Drop Out (DO)</option>
                    <option value="Mengundurkan Diri (Keluar)">Mengundurkan Diri (Keluar)</option>
                    <option value="Pindah Universitas">Pindah Universitas</option>
                    <option value="Meninggal Dunia">Meninggal Dunia</option>
                    <option value="Lainnya">Lainnya...</option>
                  </select>
                </div>

                {formData.keterangan === 'Drop Out (DO)' && (
                  <div className="space-y-1.5 animate-in slide-in-from-left-4 duration-300">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 block min-h-[2.5rem]">Semester Drop Out</label>
                    <select 
                      name="semester_dropout" 
                      value={formData.semester_dropout || 0} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-red-50 focus:border-red-400 transition-all outline-none appearance-none bg-white font-bold text-red-600"
                    >
                      <option value="0">Pilih Semester</option>
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Phone size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Kontak</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Mail size={12}/> Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none" placeholder="alumni@email.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">No. HP / WhatsApp</label>
                <input name="no_hp" value={formData.no_hp} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none" placeholder="0812xxxx" />
              </div>
            </div>
          </section>

          {/* Address Information */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <MapPin size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Alamat Lengkap</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jalan / No. Rumah</label>
                <textarea name="alamat" value={formData.alamat} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none resize-none" rows="2" placeholder="Jl. Raya No. 123"></textarea>
              </div>
              
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Negara</label>
                <select name="negara" value={formData.negara} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none appearance-none bg-white">
                  <option value="Indonesia">Indonesia</option>
                  <option value="Luar Negeri">Luar Negeri</option>
                </select>
              </div>

              <RegionSelect 
                formData={formData} 
                handleChange={handleChange} 
                isIndonesia={formData.negara === 'Indonesia'} 
              />
              
              <div className="grid grid-cols-2 gap-4 w-1/2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">RW</label>
                  <input name="rw" value={formData.rw} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400" placeholder="001"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">RT</label>
                  <input name="rt" value={formData.rt} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400" placeholder="012"/>
                </div>
              </div>
            </div>
          </section>

          {/* Career Status */}
          <section className="pb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Briefcase size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Status Pekerjaan</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                <select name="status_kerja" value={formData.status_kerja} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none appearance-none">
                  <option value="Bekerja">Bekerja</option>
                  <option value="Wiraswasta">Wiraswasta</option>
                  <option value="Belum Bekerja">Belum Bekerja</option>
                  <option value="Melanjutkan Studi">Melanjutkan Studi</option>
                </select>
              </div>
              
              {formData.status_kerja === 'Bekerja' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Instansi / Perusahaan</label>
                    <input name="np" value={formData.np} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none" placeholder="Contoh: PT. Teknologi Nusantara" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Posisi / Jabatan</label>
                    <input name="jabatan" value={formData.jabatan} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none" placeholder="Contoh: Software Engineer" />
                  </div>
                </>
              )}

              {formData.status_kerja === 'Wiraswasta' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Usaha / Bisnis</label>
                    <input name="np" value={formData.np} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none" placeholder="Contoh: Toko Kopi Sejahtera" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Bidang Usaha</label>
                    <input name="jabatan" value={formData.jabatan} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none" placeholder="Contoh: F&B / Kuliner" />
                  </div>
                </>
              )}

              {formData.status_kerja === 'Melanjutkan Studi' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Universitas / Institusi Tujuan</label>
                    <input name="np" value={formData.np} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none" placeholder="Contoh: Universitas Gadjah Mada" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jenjang & Program Studi</label>
                    <input name="jabatan" value={formData.jabatan} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none" placeholder="Contoh: S2 Ilmu Komputer" />
                  </div>
                </>
              )}
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4 sticky bottom-0 z-10">
          <button 
            type="button"
            onClick={onClose} 
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-colors"
          >
            Batal
          </button>
          <button 
            form="add-alumni-form"
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                {editData ? <Edit3 size={20} /> : <Save size={20} />}
                {editData ? 'Simpan Perubahan' : 'Simpan Alumni'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
