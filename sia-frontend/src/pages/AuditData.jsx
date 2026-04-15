import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Search, Trash2, Loader2, ArrowRight, RefreshCw, BarChart } from 'lucide-react';
import { pb } from '../lib/pb';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuditData() {
  const [loading, setLoading] = useState(true);
  const [allAlumni, setAllAlumni] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [debugLog, setDebugLog] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAndAnalyze();
  }, []);

  const fetchAndAnalyze = async () => {
    setLoading(true);
    setError(null);
    setDebugLog("");
    
    try {
      console.log("Mencoba tarik data dari collection 'alumni'...");
      
      // Gunakan versi paling simpel tanpa opsi tambahan apapun
      const records = await pb.collection('alumni').getFullList({
        requestKey: null
      });
      
      console.log("Data berhasil ditarik. Jumlah:", records.length);
      
      if (!records || records.length === 0) {
        setDebugLog("API berhasil terhubung tapi mengembalikan 0 data. Apakah tabel 'alumni' sudah ada isinya?");
      }

      setAllAlumni(records);
      analyzeDuplicates(records);
    } catch (err) {
      console.error("DEBUG API ERROR:", err);
      setError(`Gagal: ${err.message}. (Info: Pastikan 'List Rule' di PocketBase kosong atau @request.auth.id != '')`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeDuplicates = (records) => {
    const nimMap = {};
    const nameMap = {};

    records.forEach(rec => {
      // Grouping based on NIM
      const nimKey = String(rec.nim || '').trim().toLowerCase();
      if (nimKey && nimKey !== 'undefined' && nimKey !== 'null' && nimKey !== '-') {
        if (!nimMap[nimKey]) nimMap[nimKey] = [];
        nimMap[nimKey].push(rec);
      }
      
      // Grouping based on EXACT Name (as a fallback/alternative audit)
      const nameKey = String(rec.nama || '').trim().toLowerCase();
      if (nameKey && nameKey.length > 3) {
        if (!nameMap[nameKey]) nameMap[nameKey] = [];
        nameMap[nameKey].push(rec);
      }
    });

    // Cari nim ganda
    let duplicateGroups = Object.values(nimMap).filter(group => group.length > 1);
    
    // Gabungkan dengan nama ganda yang mungkin NIM-nya kosong atau berbeda tipis
    const duplicateNames = Object.values(nameMap).filter(group => group.length > 1);
    
    // Merge results uniquely by group ID
    duplicateNames.forEach(nameGroup => {
        const alreadyInNimGroups = duplicateGroups.some(nimGroup => nimGroup[0].id === nameGroup[0].id);
        if (!alreadyInNimGroups) {
            duplicateGroups.push(nameGroup);
        }
    });

    console.log("Total Fetched Records:", records.length);
    console.log("Found Duplicates Arrays:", duplicateGroups);
    
    setDuplicates(duplicateGroups);
  };

  const handleDelete = async (id, name, nim) => {
    if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus duplikat atas nama ${name} (NIM: ${nim}) secara permanen? Data yang dihapus tidak bisa dikembalikan.`)) {
      setDeletingId(id);
      try {
        await pb.collection('alumni').delete(id);
        // Refresh lokal tanpa harus nembak API penuh lagi
        const updatedRecords = allAlumni.filter(a => a.id !== id);
        setAllAlumni(updatedRecords);
        analyzeDuplicates(updatedRecords);
      } catch (err) {
        console.error("Gagal menghapus:", err);
        alert("Gagal menghapus rekaman. Silakan coba lagi.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-amber-500" size={32} />
            Audit Kualitas Data
          </h1>
          <p className="text-slate-500 mt-1">Pemindaian otomatis untuk mendeteksi redundansi dan anomali NIM ganda pada basis data.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchAndAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
          
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Data</p>
              <p className="text-xl font-black text-slate-800">{allAlumni.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Duplikat</p>
              <p className="text-xl font-black text-amber-600">{duplicates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft p-20 flex flex-col items-center justify-center">
          <Loader2 size={40} className="animate-spin text-brand-primary mb-4" />
          <p className="font-bold text-slate-600">Memindai Database...</p>
          <p className="text-sm text-slate-400 text-center mt-2 max-w-sm">Mengecek silang pendaftaran alumni untuk menemukan NIM yang bocor atau tergandakan.</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-[2rem] border border-red-100 p-12 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={40} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-red-800 mb-2">Gagal Menarik Data</h2>
          <p className="text-red-600/80 max-w-md mb-6">{error}</p>
          <button onClick={fetchAndAnalyze} className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl">Coba Lagi</button>
        </div>
      ) : debugLog ? (
        <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
          <Search size={40} className="text-slate-400 mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-slate-500 max-w-md mb-4">{debugLog}</p>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl text-left text-xs text-slate-400 font-mono">
            TIPS: Buka PocketBase Admin {'>'} alumni {'>'} API Rules. <br/>
            Pastikan <strong>List Rule</strong> dan <strong>View Rule</strong> diisi @request.auth.id != '' atau dikosongkan.
          </div>
        </div>
      ) : duplicates.length === 0 ? (
        <div className="bg-emerald-50 rounded-[2rem] border border-emerald-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-emerald-800 mb-2">Data Bersih dan Sempurna!</h2>
          <p className="text-emerald-600/80 max-w-md">Tidak ditemukan adanya NIM ganda di dalam sistem. Database Anda bebas dari redundansi, struktur master NIM akan aman.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">Ditemukan {duplicates.length} Grup Redundansi</h4>
              <p className="text-sm text-amber-700/80 mt-1">Sistem menyarankan agar Anda mempertahankan satu akun utama yang memiliki data terlengkap, dan <strong>menghapus sisanya</strong> agar tidak mengganggu sistem pembuatan akun dan statistik borang.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {duplicates.map((group, gIndex) => (
                <motion.div 
                  key={group[0].nim}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: gIndex * 0.1 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 font-black rounded-lg text-xs tracking-wider">
                        Terdapat {group.length} Duplikat
                      </span>
                      <h3 className="font-bold text-slate-800 text-lg">Indikator: {group[0].nim || group[0].nama}</h3>
                    </div>
                  </div>
                  
                  <div className="p-0">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">Nama / Dibuat Pada</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">Tahun Lulus</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">Kelengkapan Kontak</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30 text-right">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.map((person, pIndex) => {
                          const kelengkapan = [person.email, person.no_hp, person.alamat, person.status_kerja].filter(Boolean).length;
                          return (
                            <tr key={person.id} className={`${pIndex === 0 ? 'bg-blue-50/20' : 'hover:bg-slate-50'} transition-colors group/row`}>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                  {person.nama} 
                                  {pIndex === 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded uppercase font-black">Data Acuan</span>}
                                </p>
                                <p className="text-xs font-semibold text-slate-400 mt-1">
                                  ID: <span className="font-mono text-[10px]">{person.id}</span>
                                </p>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-600">{person.tahun_lulus || '-'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${kelengkapan > 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {kelengkapan}/4 Terisi
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => handleDelete(person.id, person.nama, person.nim)}
                                  disabled={deletingId === person.id}
                                  className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all disabled:opacity-50"
                                  title="Hapus Rekaman Ini"
                                >
                                  {deletingId === person.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
