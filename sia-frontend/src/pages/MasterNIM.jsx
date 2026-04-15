import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pb';
import { 
  Users, Search, Plus, Key, X, Loader2, Edit3, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MasterNIM() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Alumni selection states
  const [alumniList, setAlumniList] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    username: '',    // Will be filled by selected NIM
    name: '',        // Will be filled by selected Alumni name
    password: '',
    passwordConfirm: ''
  });

  const [isBulkCreate, setIsBulkCreate] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    password: '',
    passwordConfirm: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchAlumni();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('users').getFullList();
      setUsers(records);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Gagal memuat data Master NIM');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumni = async () => {
    try {
      const records = await pb.collection('alumni').getFullList({});
      setAlumniList(records);
    } catch (err) {
      console.error('Fetch alumni error:', err);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      username: '',
      name: '',
      password: '',
      passwordConfirm: ''
    });
    setIsModalOpen(true);
  };

  const handleAlumniSelect = (e) => {
    const selectedNim = e.target.value;
    if (!selectedNim) {
      setFormData(prev => ({ ...prev, username: '', name: '' }));
      return;
    }
    const selected = alumniList.find(a => a.nim === selectedNim);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        username: String(selected.nim),
        name: selected.nama
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      alert("Password dan Konfirmasi Password tidak cocok!");
      return;
    }

    setSaving(true);
    setBulkProgress(0);
    
    try {
      if (isBulkCreate) {
        let successCount = 0;
        let failedCount = 0;
        
        for (let i = 0; i < availableAlumni.length; i++) {
          const alumni = availableAlumni[i];
          // Adding a small delay to avoid rate limits
          await new Promise(r => setTimeout(r, 100));
          
          let safeNim = String(alumni.nim || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          
          // PocketBase minimum username length is usually 3.
          if (safeNim.length < 3) {
            safeNim = `user${alumni.id.substring(0, 6)}`;
          }
          
          try {
            await pb.collection('users').create({
              username: safeNim,
              name: alumni.nama,
              password: formData.password,
              passwordConfirm: formData.passwordConfirm,
              email: `${safeNim}_${alumni.id}@dummy.local`, // Dijamin unik
              emailVisibility: false,
              role: 'alumni'
            });
            successCount++;
          } catch (e) {
            console.error(`Gagal membuat akun untuk ${alumni.nama} (NIM: ${alumni.nim}):`, e);
            failedCount++;
          }
          
          setBulkProgress(Math.floor(((i + 1) / availableAlumni.length) * 100));
        }
        
        if (failedCount > 0) {
          alert(`Selesai! Berhasil membuat ${successCount} akun.\nGagal: ${failedCount} akun (Kemungkinan NIM ganda atau tidak valid).`);
        } else {
          alert(`Berhasil membuat ${successCount} akun secara massal.`);
        }
      } else {
        // Single create
        let safeUsername = String(formData.username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        
        if (safeUsername.length < 3) {
           safeUsername = `user${Date.now()}`;
        }
        
        await pb.collection('users').create({
          username: safeUsername,
          name: formData.name,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
          email: `${safeUsername}_${Date.now()}@dummy.local`, // Dijamin unik
          emailVisibility: false,
          role: 'alumni'
        });
      }

      setIsModalOpen(false);
      setIsBulkCreate(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      
      // Ambil detail error validasi dari PocketBase jika ada
      let errorMsg = err.message || 'Gagal membuat akun.';
      if (err.data && err.data.data) {
        const details = Object.entries(err.data.data)
          .map(([key, value]) => `${key}: ${value.message}`)
          .join('\n');
        if (details) errorMsg += `\nDetail:\n${details}`;
      }
      
      alert(errorMsg);
    } finally {
      setSaving(false);
      setBulkProgress(0);
    }
  };

  const openEditModal = (u) => {
    setEditUser(u);
    setEditFormData({ password: '', passwordConfirm: '' });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editFormData.password !== editFormData.passwordConfirm) {
      alert("Password dan Konfirmasi Password tidak cocok!");
      return;
    }

    setSaving(true);
    try {
      await pb.collection('users').update(editUser.id, {
        password: editFormData.password,
        passwordConfirm: editFormData.passwordConfirm
      });
      alert('Password berhasil diubah!');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal mengubah password. Pastikan API Rules update users mengizinkan admin.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus akun ini?")) {
      try {
        await pb.collection('users').delete(id);
        fetchUsers();
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus akun');
      }
    }
  };

  // Filter out alumni that already have accounts
  const availableAlumni = alumniList.filter(
    alumni => !users.some(user => user.username === alumni.nim)
  );

  // Search logic
  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master NIM</h1>
          <p className="text-slate-500 mt-1">Kelola pembuatan akun portal untuk alumni.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari Nama / NIM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all outline-none shadow-sm"
            />
          </div>
          <button 
            onClick={handleOpenModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-white rounded-2xl font-bold shadow-xl shadow-blue-100/30 hover:brightness-110 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span className="md:inline">Tambah Akun</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Key className="text-brand-primary" size={20} /> Data Akun Login
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-white">
                <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-wider w-16">No.</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-400 uppercase tracking-wider">Nama Alumni</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-400 uppercase tracking-wider">Username / NIM</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-10 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" /> Memuat...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-10 text-center text-slate-400">
                    {searchTerm ? `Tidak ditemukan hasil untuk "${searchTerm}"` : 'Belum ada akun alumni yang dibuat.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{u.name || '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase">
                        {u.role || 'User'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(u)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-brand-primary bg-slate-50 hover:bg-brand-light rounded-lg transition-all border border-slate-100 uppercase tracking-wide"
                            title="Ganti Password"
                          >
                            <Edit3 size={14} /> Password
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Akun"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Key className="text-brand-primary" />
                  Buat Akun Alumni
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex items-center gap-3 p-3 bg-brand-light/50 border border-blue-100 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="bulkCreate"
                    className="w-5 h-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                    checked={isBulkCreate}
                    onChange={(e) => {
                      setIsBulkCreate(e.target.checked);
                      if (e.target.checked) {
                        setFormData(prev => ({...prev, username: 'BULK'}));
                      } else {
                        setFormData(prev => ({...prev, username: ''}));
                      }
                    }}
                  />
                  <label htmlFor="bulkCreate" className="text-sm font-bold text-blue-900 cursor-pointer">
                    Buat akun untuk semua alumni sekaligus ({availableAlumni.length} alumni)
                  </label>
                </div>

                {!isBulkCreate && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Pilih Alumni</label>
                    <select 
                      required={!isBulkCreate}
                      value={formData.username}
                      onChange={handleAlumniSelect}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm font-medium cursor-pointer"
                    >
                      <option value="">-- Pilih NIM Alumni --</option>
                      {availableAlumni.map(a => (
                        <option key={a.id} value={a.nim}>
                          {a.nim} - {a.nama}
                        </option>
                      ))}
                    </select>
                    {availableAlumni.length === 0 && (
                      <p className="text-xs text-amber-500 mt-1 font-medium">Semua data alumni sudah memiliki akun tersendiri.</p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password {isBulkCreate ? 'Untuk Semua Akun' : ''}</label>
                  <input 
                    type="text" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Masukkan password..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                  <input 
                    type="password" 
                    required
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                    placeholder="Ulangi password..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm font-medium"
                  />
                </div>

                {/* Progress bar for bulk create */}
                {saving && isBulkCreate && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>Proses Pembuatan Massal</span>
                      <span>{bulkProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => { setIsModalOpen(false); setIsBulkCreate(false); }}
                    className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={saving || (!formData.username && !isBulkCreate) || (isBulkCreate && availableAlumni.length === 0)}
                    className="px-8 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : (isBulkCreate ? <Users size={18} /> : null)}
                    {saving ? 'Menyimpan...' : (isBulkCreate ? 'Buat Massal' : 'Buat Akun')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDIT PASSWORD */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Edit3 className="text-brand-primary" />
                  Ubah Password Alumni
                </h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div className="p-4 bg-brand-light/50 border border-brand-primary/20 rounded-xl mb-4">
                  <p className="text-sm font-bold text-brand-primary">
                    Ubah password untuk: {editUser?.name} ({editUser?.username})
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    placeholder="Masukkan password baru..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                  <input 
                    type="password" 
                    required
                    value={editFormData.passwordConfirm}
                    onChange={(e) => setEditFormData({...editFormData, passwordConfirm: e.target.value})}
                    placeholder="Ulangi password..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm font-medium"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={saving || !editFormData.password}
                    className="px-8 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : null}
                    {saving ? 'Menyimpan...' : 'Simpan Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
