import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Save, Loader2, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';

export default function TracerStudy() {
  const [step, setStep] = useState(1);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [config, setConfig] = useState({
    loading: true,
    active: true,
    title: 'Kuesioner Tracer Study Alumni',
    welcome: 'Lengkapi data rekam jejak karir Anda setelah kelulusan.',
    error: null
  });
  
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    work_status: 'bekerja', // bekerja, wiraswasta, mencari, studi
    company: '',
    job_title: '',
    city: '',
    lat: '',
    lng: '',
    salary_range: '< 5 Juta',
    graduation_year: '2025'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await pb.collection('tracer_settings').getFirstListItem('');
      if (res) {
        // Check date range if specified
        const now = new Date();
        const start = res.start_date ? new Date(res.start_date) : null;
        const end = res.end_date ? new Date(res.end_date) : null;
        
        let isActuallyActive = res.is_active;
        if (isActuallyActive && start && now < start) isActuallyActive = false;
        if (isActuallyActive && end && now > end) isActuallyActive = false;

        setConfig({
          loading: false,
          active: isActuallyActive,
          title: res.title || 'Kuesioner Tracer Study Alumni',
          welcome: res.welcome_message || 'Lengkapi data rekam jejak karir Anda setelah kelulusan.',
          error: null
        });
      }
    } catch (err) {
      console.log("No custom settings found, using defaults");
      setConfig(prev => ({ ...prev, loading: false }));
    }
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, totalSteps));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const submitTracer = async (e) => {
    e.preventDefault();
    if (step < totalSteps) {
      handleNext();
      return;
    }
    
    setIsSubmitting(true);
    try {
      // In a real app we'd post to tracer_studies collection
      await pb.collection('tracer_studies').create({
        user: user.id,
        ...formData
      });
      alert('Data kuesioner berhasil disimpan!');
      navigate('/');
    } catch (error) {
       console.error(error);
       // Alert if failure (could be because collection doesn't exist yet via our limited script)
       alert('Gagal menyimpan tracer. Pastikan skema database \'tracer_studies\' sudah siap.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (config.loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold">Menyinkronkan sesi kuesioner...</p>
      </div>
    );
  }

  if (!config.active) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-16 text-center">
           <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100">
              <Calendar size={48} />
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Akses Kuesioner Ditutup</h1>
           <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-10 text-lg">
             Mohon maaf, sesi pengisian Tracer Study saat ini sedang ditutup atau belum dimulai. Silakan kembali lagi nanti atau hubungi Administrator institusi.
           </p>
           <button 
             onClick={() => navigate('/')}
             className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl active:scale-95 transition-all"
           >
             Kembali ke Dashboard
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{config.title}</h1>
        <p className="text-slate-500 mt-1 font-medium">{config.welcome}</p>
      </header>
      
      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
         <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0"></div>
            <div 
               className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 rounded-full z-0 transition-all duration-300" 
               style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
            
            {[1, 2, 3, 4].map(num => (
               <div key={num} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors border-2 ${
                    step === num ? 'bg-blue-600 text-white border-blue-600' :
                    step > num ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    'bg-white text-slate-400 border-slate-200'
                  }`}>
                     {step > num ? <CheckCircle2 size={20} /> : num}
                  </div>
                  <span className="text-xs font-medium mt-2 text-slate-500">
                    {num === 1 ? 'Status' : num === 2 ? 'Detail' : num === 3 ? 'Lokasi' : 'Kirim'}
                  </span>
               </div>
            ))}
         </div>
      </div>

      {/* Form Area */}
      <form onSubmit={submitTracer} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-semibold text-slate-800">Apa status Anda saat ini?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['bekerja', 'wiraswasta', 'mencari', 'studi'].map((status) => (
                <label 
                  key={status} 
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                    formData.work_status === status 
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    className="w-4 h-4 text-blue-600"
                    checked={formData.work_status === status}
                    onChange={() => updateField('work_status', status)}
                  />
                  <span className="font-medium text-slate-700 capitalize">
                    {status === 'mencari' ? 'Sedang Mencari Kerja' : 
                     status === 'studi' ? 'Melanjutkan Studi' : status}
                  </span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">Tahun Masuk (Angkatan)</label>
              <input 
                type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                value={formData.graduation_year} 
                onChange={e => updateField('graduation_year', e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <h2 className="text-xl font-semibold text-slate-800">Detail Pekerjaan / Studi</h2>
             
             {formData.work_status === 'bekerja' || formData.work_status === 'wiraswasta' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nama Perusahaan / Bisnis</label>
                    <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20" 
                      value={formData.company} onChange={e => updateField('company', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Posisi / Jabatan</label>
                    <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20" 
                      value={formData.job_title} onChange={e => updateField('job_title', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rentang Gaji / Pendapatan (Per Bulan)</label>
                    <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white"
                      value={formData.salary_range} onChange={e => updateField('salary_range', e.target.value)}
                    >
                      <option value="< 5 Juta">Kurang dari Rp 5.000.000</option>
                      <option value="5 - 10 Juta">Rp 5.000.000 - Rp 10.000.000</option>
                      <option value="10 - 20 Juta">Rp 10.000.000 - Rp 20.000.000</option>
                      <option value="> 20 Juta">Lebih dari Rp 20.000.000</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">*Hanya pengelola institusi yang dapat melihat data ini secara agregat.</p>
                  </div>
                </>
             ) : (
                <p className="text-slate-600">Terima kasih atas masukannya. Bagian ini dilewati sesuai status Anda.</p>
             )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-semibold text-slate-800">Lokasi / Penempatan</h2>
            <p className="text-slate-500 text-sm">Informasi ini akan ditampilkan dalam Peta Sebaran Alumni.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Kota Instansi / Menetap</label>
              <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20" 
                placeholder="Contoh: Jakarta Selatan"
                value={formData.city} onChange={e => updateField('city', e.target.value)} required />
            </div>
            {/* Real implementation would use Map picker or geocoding to geocode the city into Lat/Lng */}
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-800 font-medium">
              Sistem akan secara otomatis menentukan koordinat geografis berdasarkan input kota Anda.
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center py-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Semua Data Lengkap</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Terima kasih telah melengkapi kuesioner. Data ini akan sangat membantu peningkatan mutu institusi.
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-0"
          >
            Kembali
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center gap-2 ${
              step === totalSteps 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {step === totalSteps ? (
              <>{isSubmitting ? 'Menyimpan...' : 'Kirim Kuesioner'} <Save size={18} /></>
            ) : (
              <>Selanjutnya <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
