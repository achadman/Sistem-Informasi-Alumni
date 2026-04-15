import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Briefcase, Building2, MapPin, Map,
  GraduationCap, User, Calendar, Loader2, BookOpen
} from 'lucide-react';
import { pb } from '../lib/pb';
import { motion } from 'framer-motion';

export default function Home() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const username = user?.username; // Ambil nilai primitif untuk useEffect
  
  const [alumniData, setAlumniData] = useState(null);
  const [loading, setLoading] = useState(!isAdmin);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) return;

    if (username) {
      fetchMyAlumniData(username);
    } else {
      setLoading(false);
      setError("Profil tidak dapat dimuat: Anda masuk sebagai Alumni, namun NIM / Username tidak tercantum di kredensial Anda.");
    }
  }, [isAdmin, username]);

  const fetchMyAlumniData = async (nim) => {
    try {
      setLoading(true);
      setError('');
      // Fetch alumni by nim
      const records = await pb.collection('alumni').getList(1, 1, {
        filter: `nim = "${nim}"`
      });
      
      if (records.items && records.items.length > 0) {
        setAlumniData(records.items[0]);
      } else {
        setError(`Data biodata alumni belum tersedia. Sistem tidak dapat menemukan profil dengan pola NIM/NPM: ${nim}. Silakan hubungi admin kampus jika dirasa terdapat kesalahan.`);
      }
    } catch (err) {
      if (!err.isAbort) {
        console.error("API Error in Home.jsx:", err);
        setError('Terjadi kesalahan saat mengambil biodata. Coba periksa koneksi internet atau hak akses database.');
      }
    } finally {
      // Tunggu render untuk memastikan loading berubah jika bukan batal
      setLoading(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-slate-500 mt-1">
            Selamat datang kembali, <span className="font-semibold text-slate-700">{user?.name || user?.email}</span>.
          </p>
        </header>

        <div className="p-8 bg-white border border-slate-200 rounded-[2rem] text-center shadow-soft">
          <h2 className="text-lg font-semibold text-slate-700">Administrasi Portal Alumni</h2>
          <p className="text-slate-500 mt-2">Gunakan menu di sidebar untuk mengelola data alumni, sebaran domisili, dan pembuatan Master Akun NIM.</p>
        </div>
      </div>
    );
  }

  // Alumni View
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profil Alumni Terpusat</h1>
        <p className="text-slate-500 mt-1">
          Selamat datang kembali di pusat data karir Anda.
        </p>
      </header>

      {loading ? (
        <div className="flex bg-white items-center p-8 rounded-2xl gap-3 text-brand-primary border border-slate-100 shadow-sm font-bold animate-pulse">
          <Loader2 className="animate-spin" size={24} /> Sedang menyiapkan dashboard Anda...
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft p-12 text-center">
          <div className="w-20 h-20 bg-blue-50 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 size={36} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Dashboard Sedang Disiapkan</h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Halaman ini nantinya akan berisi ringkasan seputar informasi karir alumni secara keseluruhan dan berita terbaru. Silakan navigasi ke menu <b>Profil Saya</b> untuk melihat detil pribadi.
          </p>
        </div>
      )}

      {/* Tracer Study CTA */}
      <div className="p-8 lg:p-10 bg-brand-primary text-white border border-blue-600/50 rounded-[2.5rem] relative overflow-hidden shadow-xl shadow-blue-100/50 flex flex-col md:flex-row items-center justify-between gap-8 group mt-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-white/20 transition-all duration-700"></div>
        
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-2xl lg:text-3xl font-black mb-3 text-white">Bantu Perbaiki Kualitas Institusi</h2>
          <p className="text-white/80 font-medium leading-relaxed max-w-xl text-sm lg:text-base">
            Rincian profil dan jabatan Anda sangat mempengaruhi penyesuaian mutu akreditasi kampus. Pastikan Anda memperbarui form Tracer Study jika terjadi perpindahan karir.
          </p>
        </div>

        <a href="/tracer" className="relative z-10 shrink-0 inline-flex items-center gap-3 bg-white text-brand-primary hover:bg-slate-50 hover:scale-105 font-black py-4 px-8 rounded-2xl transition-all shadow-[0_0_40px_-5px_rgba(255,255,255,0.4)] active:scale-95 uppercase tracking-wide text-sm">
          <Briefcase size={18} /> Update Karir
        </a>
      </div>
    </div>
  );
}
