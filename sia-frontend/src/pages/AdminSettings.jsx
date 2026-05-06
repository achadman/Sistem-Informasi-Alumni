import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Building, Mail, Phone, MapPin, 
  Loader2, CheckCircle2, FileText, Calendar, 
  Settings, Globe, ShieldCheck, Clock, Camera,
  Edit2, ImageIcon, Share2, Crop as CropIcon, X, Check, Link, GraduationCap, Briefcase, RefreshCw
} from 'lucide-react';
import { pb } from '../lib/pb';
import RegionSelect from '../components/RegionSelect';
import SocialMediaEditor, { getPlatformIcon } from '../components/SocialMediaEditor';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/cropImage';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const [activeTab, setActiveTab] = useState('identitas');

  // Institution Form Data
  const [instId, setInstId] = useState(null);
  const [instData, setInstData] = useState({
    nama: '', kode_pt: '', akronim: '', email: '', no_hp: '', whatsapp_center: '', website: '',
    deskripsi: '', alamat: '', negara: 'Indonesia', provinsi: '', kota_kabupaten: '', kecamatan: '',
    kelurahan: '', rw: '', rt: '', social_media: [], rektor_nama: '', cdc_nama: '', nip_penanggung_jawab: '',
    visi_misi: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const [ttdFile, setTtdFile] = useState(null);
  const [stempelFile, setStempelFile] = useState(null);
  const [skFile, setSkFile] = useState(null);

  // Cropper States
  const [cropModal, setCropModal] = useState({ isOpen: false, type: 'logo', imageSrc: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const logoInputRef = useRef(null);
  const ttdRef = useRef(null);
  const stempelRef = useRef(null);
  const skRef = useRef(null);
  
  const isInitialLoad = useRef(true);
  const justSaved = useRef(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'logo') {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropModal({ isOpen: true, type, imageSrc: reader.result?.toString() || '' });
      });
      reader.readAsDataURL(file);
    } else if (type === 'ttd') {
      setTtdFile(file);
    } else if (type === 'stempel') {
      setStempelFile(file);
    } else if (type === 'sk') {
      setSkFile(file);
    }
    e.target.value = null; // reset
  };

  const showCroppedImage = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels);
      const url = URL.createObjectURL(croppedImageBlob);
      const file = new File([croppedImageBlob], `${cropModal.type}.jpg`, { type: 'image/jpeg' });
      
      if (cropModal.type === 'logo') {
        setLogoPreview(url);
        setLogoFile(file);
      }
      setCropModal({ isOpen: false, type: 'logo', imageSrc: null });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAllData(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchAllData = async (signal) => {
    setLoading(true);
    try {
      const instRec = await pb.collection('institution_profile').getFirstListItem('', { signal, requestKey: 'inst-profile' }).catch(() => null);
      if (instRec) {
        setInstId(instRec.id);
        const loadedInst = {
          nama: instRec.nama || '', kode_pt: instRec.kode_pt || '', akronim: instRec.akronim || '',
          email: instRec.email || '', no_hp: instRec.no_hp || '', whatsapp_center: instRec.whatsapp_center || '', website: instRec.website || '',
          deskripsi: instRec.deskripsi || '', alamat: instRec.alamat || '', negara: 'Indonesia',
          provinsi: instRec.provinsi || '', kota_kabupaten: instRec.kota || '', kecamatan: instRec.kecamatan || '',
          kelurahan: instRec.kelurahan || '', rw: instRec.rw || '', rt: instRec.rt || '',
          social_media: Array.isArray(instRec.social_media) ? instRec.social_media : (typeof instRec.social_media === 'string' ? JSON.parse(instRec.social_media || '[]') : []),
          rektor_nama: instRec.rektor_nama || '', cdc_nama: instRec.cdc_nama || '', nip_penanggung_jawab: instRec.nip_penanggung_jawab || '',
          visi_misi: instRec.visi_misi || ''
        };
        setInstData(loadedInst);
        
        if (instRec.logo) setLogoPreview(pb.files.getURL(instRec, instRec.logo));
      }
    } catch (err) {
      console.error("Fetch Settings Error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
    }
  };

  // AUTO-SAVE LOGIC
  useEffect(() => {
    if (isInitialLoad.current || loading) return;
    
    if (justSaved.current) {
      justSaved.current = false;
      return;
    }

    const saveTimer = setTimeout(() => {
      performAutoSave();
    }, 1500); // 1.5 seconds debounce

    return () => clearTimeout(saveTimer);
  }, [instData, logoFile, ttdFile, stempelFile, skFile]);

  const performAutoSave = async () => {
    setIsAutoSaving(true);
    try {
      // Save Institusi
      const data = new FormData();
      Object.keys(instData).forEach(key => {
        if (key !== 'negara') {
           if (key === 'kota_kabupaten') data.append('kota', instData[key]);
           else if (key === 'social_media') data.append(key, JSON.stringify(instData[key]));
           else data.append(key, instData[key]);
        }
      });
      if (logoFile) data.append('logo', logoFile);
      if (ttdFile) data.append('ttd_digital', ttdFile);
      if (stempelFile) data.append('stempel_digital', stempelFile);
      if (skFile) data.append('sk_pendirian', skFile);

      if (instId) {
        await pb.collection('institution_profile').update(instId, data);
      } else {
        const record = await pb.collection('institution_profile').create(data);
        setInstId(record.id);
      }
      
      // Set flag to ignore the next useEffect trigger caused by clearing files
      justSaved.current = true;
      
      // Clear file states so they aren't repeatedly uploaded
      setLogoFile(null);
      setTtdFile(null);
      setStempelFile(null);
      setSkFile(null);

      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
      
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mr-3 text-blue-600" />
        Memuat konfigurasi institusi...
      </div>
    );
  }

  const tabs = [
    { id: 'identitas', label: 'Identitas', icon: <Building size={16} /> },
    { id: 'akademik', label: 'Akademik', icon: <GraduationCap size={16} /> },
    { id: 'pejabat', label: 'Pejabat & Legal', icon: <Briefcase size={16} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500 pt-0">
      
      {/* Auto-save Status */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence mode="wait">
          {isAutoSaving ? (
            <motion.div 
              key="saving"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-full font-bold shadow-xl border border-slate-700 text-[10px] tracking-widest uppercase"
            >
              <RefreshCw size={14} className="animate-spin" /> MENYIMPAN...
            </motion.div>
          ) : lastSaved ? (
            <motion.div 
              key="saved"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 bg-white text-green-600 px-4 py-2.5 rounded-full font-bold shadow-xl border border-slate-200 text-[10px] tracking-widest uppercase"
            >
              <CheckCircle2 size={14} /> TERSIMPAN ({lastSaved})
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Main Consolidated Card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl md:rounded-[2rem] flex flex-col min-h-[600px] relative">
        
        {/* Integrated Flat Switcher */}
        <div className="flex items-center justify-start overflow-x-auto custom-scrollbar border-b border-slate-100 px-5 md:px-6 pt-1 bg-slate-50/50 rounded-t-2xl md:rounded-t-[2rem]">
          {tabs.map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)} 
              className={`px-6 py-3.5 text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 whitespace-nowrap border-b-2 outline-none ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
            >
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-5 md:p-6 flex-1 relative">
          <AnimatePresence mode="wait">
             {activeTab === 'identitas' && (
                <motion.div key="identitas" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="space-y-6">
                   
                   {/* Logo & Identitas Digabung agar Padat */}
                   <div className="flex flex-col md:flex-row gap-6 border-b border-slate-100 pb-6">
                      <div className="w-full md:w-48 shrink-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Aset Merek</h3>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Logo Utama</label>
                          <div onClick={()=>logoInputRef.current?.click()} className="w-full aspect-square max-w-[160px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors group relative overflow-hidden">
                            {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain p-2" /> : <Camera size={32} className="text-slate-300 group-hover:text-slate-500"/>}
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')}/>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Format 1:1 (Persegi) disarankan.</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-5">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Data Resmi</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Kode PT (PDDIKTI)</label>
                            <input value={instData.kode_pt} onChange={e=>setInstData({...instData,kode_pt:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Akronim</label>
                            <input value={instData.akronim} onChange={e=>setInstData({...instData,akronim:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nama Resmi Institusi</label>
                          <input value={instData.nama} onChange={e=>setInstData({...instData,nama:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                        </div>
                      </div>
                   </div>

                   {/* Kontak Row */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-slate-100 pb-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Resmi</label>
                        <input value={instData.email} onChange={e=>setInstData({...instData,email:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">No. Telp / Hotline</label>
                        <input value={instData.no_hp} onChange={e=>setInstData({...instData,no_hp:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">WhatsApp Center</label>
                        <input value={instData.whatsapp_center} onChange={e=>setInstData({...instData,whatsapp_center:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Website Resmi</label>
                        <input value={instData.website} onChange={e=>setInstData({...instData,website:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <RegionSelect formData={instData} handleChange={e=>setInstData({...instData,[e.target.name]:e.target.value})} isIndonesia={true} />
                      <SocialMediaEditor value={instData.social_media} onChange={val=>setInstData({...instData,social_media:val})} />
                   </div>
                </motion.div>
             )}

             {activeTab === 'akademik' && (
                <motion.div key="akademik" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="space-y-6">
                   <div className="space-y-2">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Visi & Misi Institusi</h3>
                     <p className="text-xs text-slate-500 mb-2">Ditampilkan pada halaman profil publik dan pembukaan Kuesioner Tracer Study.</p>
                     <textarea value={instData.visi_misi} onChange={e=>setInstData({...instData,visi_misi:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium h-48 resize-none leading-relaxed transition-colors" placeholder="Visi: ...&#10;Misi: ..."/>
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Deskripsi Singkat Kampus</h3>
                      <textarea value={instData.deskripsi} onChange={e=>setInstData({...instData,deskripsi:e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium h-24 resize-none transition-colors"/>
                    </div>
                   
                   <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500">
                      <GraduationCap size={40} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-bold">Modul Fakultas & Prodi Terpadu (SIAKAD Integration)</p>
                      <p className="text-xs mt-1">Akan tersedia pada pembaruan sistem berikutnya.</p>
                   </div>
                </motion.div>
             )}

             {activeTab === 'pejabat' && (
                <motion.div key="pejabat" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-slate-100 pb-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nama Rektor / Ketua</label>
                        <input value={instData.rektor_nama} onChange={e=>setInstData({...instData,rektor_nama:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nama Kepala CDC</label>
                        <input value={instData.cdc_nama} onChange={e=>setInstData({...instData,cdc_nama:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">NIP / NIK Penanggung Jawab Laporan</label>
                        <input value={instData.nip_penanggung_jawab} onChange={e=>setInstData({...instData,nip_penanggung_jawab:e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold transition-colors"/>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-b border-slate-100 pb-6">
                      <div>
                         <h3 className="text-xs font-bold text-slate-600 mb-3">Tanda Tangan Digital</h3>
                         <div className="flex items-center gap-4">
                           <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center">
                             {ttdFile ? <CheckCircle2 className="text-green-500"/> : <Edit2 className="text-slate-300"/>}
                           </div>
                           <input type="file" ref={ttdRef} className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'ttd')}/>
                           <button onClick={()=>ttdRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">Upload PNG/JPG</button>
                         </div>
                      </div>
                      <div>
                         <h3 className="text-xs font-bold text-slate-600 mb-3">Stempel Institusi (Transparan)</h3>
                         <div className="flex items-center gap-4">
                           <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center">
                             {stempelFile ? <CheckCircle2 className="text-green-500"/> : <ShieldCheck className="text-slate-300"/>}
                           </div>
                           <input type="file" ref={stempelRef} className="hidden" accept="image/png" onChange={(e) => handleFileChange(e, 'stempel')}/>
                           <button onClick={()=>stempelRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">Upload PNG</button>
                         </div>
                      </div>
                   </div>

                   <div>
                     <h3 className="text-xs font-bold text-slate-600 mb-3">SK Pendirian / Izin Operasional (Opsional)</h3>
                     <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                       <div className="flex items-center gap-3">
                         <FileText size={24} className="text-slate-400" />
                         <div>
                           <p className="text-sm font-bold text-slate-700">{skFile ? skFile.name : 'Belum ada dokumen.'}</p>
                           <p className="text-[10px] text-slate-500">Gunakan format PDF. Maksimal 5MB.</p>
                         </div>
                       </div>
                       <input type="file" ref={skRef} className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'sk')}/>
                       <button onClick={()=>skRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">Pilih File</button>
                     </div>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
        </div>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {cropModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"><CropIcon size={16} className="text-blue-600" />Sesuaikan Logo</h3>
                <button onClick={() => setCropModal({ isOpen: false, type: 'logo', imageSrc: null })} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20} /></button>
              </div>
              <div className="relative w-full h-[400px] bg-slate-900">
                <Cropper image={cropModal.imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} cropShape="round" showGrid={false} />
              </div>
              <div className="p-6 bg-white space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest"><span>Perkecil</span><span>Perbesar</span></div>
                  <input type="range" value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom" onChange={(e) => setZoom(e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setCropModal({ isOpen: false, type: 'logo', imageSrc: null })} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Batal</button>
                  <button onClick={showCroppedImage} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"><Check size={16} /> Terapkan</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
