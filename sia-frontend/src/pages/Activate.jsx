import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';

export default function Activate() {
  const [step, setStep] = useState(1);
  const [nim, setNim] = useState('');
  const [masterRecord, setMasterRecord] = useState(null);
  
  // Form step 2
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerifyNIM = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Find NIM in master_nim collection
      const records = await pb.collection('master_nim').getList(1, 1, {
        filter: `nim = "${nim}"`,
      });

      if (records.items.length === 0) {
        throw new Error("NIM tidak ditemukan dalam database master.");
      }

      const record = records.items[0];
      if (record.is_active) {
        throw new Error("Akun dengan NIM ini sudah diaktivasi. Silakan login.");
      }

      setMasterRecord(record);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Gagal memverifikasi NIM.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password harus minimal 10 karakter dan memiliki kombinasi huruf kapital, kecil, angka, dan simbol.");
      setLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError("Password tidak cocok.");
      setLoading(false);
      return;
    }

      try {
      // 1. Create User
      const userData = {
        username: nim,    // MAPPING NIM SEBAGAI USERNAME AGAR BISA LOGIN VIA KEDUA TAB ALUMNI
        email,
        emailVisibility: true,
        password,
        passwordConfirm,
        name: masterRecord.name || nim, // name from master data if exists
        role: "alumni",
      };

      const newUser = await pb.collection('users').create(userData);

      // 2. Mark master_nim as active
      await pb.collection('master_nim').update(masterRecord.id, {
        is_active: true,
        user_id: newUser.id
      });

      // 3. Auto login
      await useAuthStore.getState().login(nim, password); // LOGIN MENGGUNAKAN NIM (SEBAGAI USERNAME)
      navigate('/');
      
    } catch (err) {
      setError(err.message || 'Gagal membuat akun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Aktivasi Akun</h1>
          <p className="text-slate-500 mt-2 text-sm">
            {step === 1 ? 'Validasi identitas Anda menggunakan NIM' : 'Buat kredensial login Anda'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleVerifyNIM} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Induk Mahasiswa (NIM)</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors uppercase"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Ex: 12345678"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? 'Memvalidasi...' : 'Verifikasi NIM'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                minLength={8}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 10 karakter (A-a, 0-9, Simbol)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
              <input 
                type="password" 
                required
                minLength={8}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Ketik ulang password"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? 'Menyimpan...' : 'Selesaikan Aktivasi'}
            </button>
            <button 
             type="button"
             onClick={() => setStep(1)}
             className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Kembali
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah berhasil aktivasi? <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Log In</a>
        </p>
      </div>
    </div>
  );
}
