import React, { useState, useEffect } from 'react';
import { Sun, Moon, Plus, Trash2, Edit3, Save, X, Building2, BookOpen, Loader2 } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';

export default function Settings() {
  const { theme, toggleTheme } = useUIStore();
  const { user } = useAuthStore();
  
  const isAdmin = user?.role === 'admin';

  const [fakultasList, setFakultasList] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [loading, setLoading] = useState(false);

  // States for Fakultas CRUD
  const [newFakultas, setNewFakultas] = useState('');
  const [editFakultasId, setEditFakultasId] = useState(null);
  const [editFakultasName, setEditFakultasName] = useState('');

  // States for Prodi CRUD
  const [newProdi, setNewProdi] = useState('');
  const [newProdiFakultasId, setNewProdiFakultasId] = useState('');
  const [editProdiId, setEditProdiId] = useState(null);
  const [editProdiName, setEditProdiName] = useState('');
  const [editProdiFakultasId, setEditProdiFakultasId] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchMasterData();
    }
  }, [isAdmin]);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [fData, pData] = await Promise.all([
        pb.collection('fakultas').getFullList({ sort: 'nama' }),
        pb.collection('program_studi').getFullList({ expand: 'fakultas_id', sort: 'nama' })
      ]);
      setFakultasList(fData);
      setProdiList(pData);
    } catch (error) {
      console.error('Failed fetching master data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFakultas = async (e) => {
    e.preventDefault();
    if (!newFakultas.trim()) return;
    try {
      await pb.collection('fakultas').create({ nama: newFakultas.trim() });
      setNewFakultas('');
      fetchMasterData();
    } catch (err) {
      alert('Gagal menambah fakultas. Mungkin nama sudah ada?');
    }
  };

  const handleUpdateFakultas = async (id) => {
    try {
      await pb.collection('fakultas').update(id, { nama: editFakultasName.trim() });
      setEditFakultasId(null);
      fetchMasterData();
    } catch (err) {
      alert('Gagal menyimpan perubahan.');
    }
  };

  const handleDeleteFakultas = async (id) => {
    if (!window.confirm('Yakin ingin menghapus Fakultas ini? Program studi yang merujuk ke sini mungkin akan terkendala.')) return;
    try {
      await pb.collection('fakultas').delete(id);
      fetchMasterData();
    } catch (err) {
      alert('Gagal menghapus Fakultas. Pastikan tidak ada program studi yang masih terkait dengan fakultas ini.');
    }
  };

  const handleAddProdi = async (e) => {
    e.preventDefault();
    if (!newProdi.trim() || !newProdiFakultasId) return alert('Silakan pilih fakultas dan isi nama prodi.');
    try {
      await pb.collection('program_studi').create({ 
        nama: newProdi.trim(),
        fakultas_id: newProdiFakultasId
      });
      setNewProdi('');
      fetchMasterData();
    } catch (err) {
      alert('Gagal menambah Program Studi.');
    }
  };

  const handleUpdateProdi = async (id) => {
    try {
      await pb.collection('program_studi').update(id, { 
        nama: editProdiName.trim(),
        fakultas_id: editProdiFakultasId
      });
      setEditProdiId(null);
      fetchMasterData();
    } catch (err) {
      alert('Gagal menyimpan perubahan.');
    }
  };

  const handleDeleteProdi = async (id) => {
    if (!window.confirm('Yakin ingin menghapus Program Studi ini?')) return;
    try {
      await pb.collection('program_studi').delete(id);
      fetchMasterData();
    } catch (err) {
      alert('Gagal menghapus Program Studi.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Pengaturan</h1>
          <p className="text-secondary mt-1 text-sm md:text-base">Konfigurasi preferensi aplikasi Anda.</p>
        </div>
      </div>

      <div className="bg-surface border border-border-subtle rounded-3xl p-6 lg:p-8 hover-glow transition-all duration-300">
        <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
          <Moon className="text-brand-primary" size={20} />
          Tampilan Sistem
        </h2>
        
        <div className="flex items-center justify-between border border-border-subtle bg-main p-4 rounded-2xl">
          <div>
            <h3 className="font-semibold text-primary">Tema Aplikasi</h3>
            <p className="text-sm text-secondary">Pilih tema gelap atau terang.</p>
          </div>
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all bg-surface hover:bg-main text-primary border border-border-subtle active:scale-95 shadow-sm"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={20} className="text-yellow-400" />
                <span>Terang</span>
              </>
            ) : (
              <>
                <Moon size={20} className="text-slate-600" />
                <span>Gelap</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Admin specific master data crud */}
      {isAdmin && (
        <>
          {/* FAKULTAS MASTER */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 lg:p-8 hover-glow transition-all duration-300">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
              <Building2 className="text-emerald-500" size={20} />
              Master Data Fakultas
            </h2>

            <form onSubmit={handleAddFakultas} className="flex gap-3 mb-6">
               <input 
                 type="text" 
                 value={newFakultas}
                 onChange={(e) => setNewFakultas(e.target.value)}
                 placeholder="Input nama fakultas baru..." 
                 className="flex-1 bg-main border border-border-subtle rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-primary"
                 required
               />
               <button type="submit" disabled={!newFakultas.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                 <Plus size={18} /> Tambah
               </button>
            </form>

            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-secondary" />
                </div>
              ) : fakultasList.length === 0 ? (
                <p className="text-secondary text-sm text-center py-4">Belum ada data Fakultas.</p>
              ) : (
                fakultasList.map(item => (
                  <div key={item.id} className="flex items-center justify-between border border-border-subtle bg-main p-3 rounded-xl">
                    {editFakultasId === item.id ? (
                      <div className="flex-1 flex items-center gap-2 mr-4">
                        <input 
                          type="text" 
                          autoFocus
                          value={editFakultasName} 
                          onChange={(e) => setEditFakultasName(e.target.value)}
                          className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-sm outline-none text-primary"
                        />
                        <button onClick={() => handleUpdateFakultas(item.id)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg shrink-0">
                          <Save size={16} />
                        </button>
                        <button onClick={() => setEditFakultasId(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg shrink-0">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-primary text-sm px-2 truncate">{item.nama}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setEditFakultasId(item.id); setEditFakultasName(item.nama); }} className="p-2 text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeleteFakultas(item.id)} className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PROGRAM STUDI MASTER */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 lg:p-8 hover-glow transition-all duration-300">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
              <BookOpen className="text-blue-500" size={20} />
              Master Data Program Studi
            </h2>

            <form onSubmit={handleAddProdi} className="flex flex-col md:flex-row gap-3 mb-6 outline-none">
               <select 
                 value={newProdiFakultasId}
                 onChange={(e) => setNewProdiFakultasId(e.target.value)}
                 className="bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-primary w-full md:w-1/3"
                 required
               >
                 <option value="">-- Pilih Fakultas --</option>
                 {fakultasList.map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
               </select>

               <input 
                 type="text" 
                 value={newProdi}
                 onChange={(e) => setNewProdi(e.target.value)}
                 placeholder="Input nama program studi..." 
                 className="flex-1 bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-primary"
                 required
               />
               <button type="submit" disabled={!newProdi.trim() || !newProdiFakultasId} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0">
                 <Plus size={18} /> Tambah
               </button>
            </form>

            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-secondary" />
                </div>
              ) : prodiList.length === 0 ? (
                <p className="text-secondary text-sm text-center py-4">Belum ada data Program Studi.</p>
              ) : (
                prodiList.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between border border-border-subtle bg-main p-3 rounded-xl gap-3">
                    {editProdiId === item.id ? (
                      <div className="flex-1 flex flex-col md:flex-row gap-2 w-full">
                        <select 
                          value={editProdiFakultasId}
                          onChange={(e) => setEditProdiFakultasId(e.target.value)}
                          className="bg-surface border border-border-subtle rounded-lg px-2 py-1.5 text-sm outline-none text-primary"
                        >
                          {fakultasList.map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
                        </select>
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="text" 
                            autoFocus
                            value={editProdiName} 
                            onChange={(e) => setEditProdiName(e.target.value)}
                            className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-sm outline-none text-primary min-w-[200px]"
                          />
                          <button onClick={() => handleUpdateProdi(item.id)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg shrink-0">
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditProdiId(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg shrink-0">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 pr-4">
                          <h3 className="font-semibold text-primary text-sm px-2 truncate leading-tight">{item.nama}</h3>
                          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest px-2 mt-1 truncate">
                            {item.expand?.fakultas_id?.nama || 'Fakultas Tidak Diketahui'}
                          </p>
                        </div>
                        <div className="flex items-center justify-end gap-1 shrink-0 self-end sm:self-center">
                          <button 
                            onClick={() => { 
                              setEditProdiId(item.id); 
                              setEditProdiName(item.nama); 
                              setEditProdiFakultasId(item.fakultas_id); 
                            }} 
                            className="p-2 text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeleteProdi(item.id)} className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
