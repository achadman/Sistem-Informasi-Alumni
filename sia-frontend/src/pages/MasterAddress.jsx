import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Search, Trash2, Edit3, 
  Map, Building, Home, ChevronRight, Filter,
  AlertCircle, Upload, Loader2, RefreshCw, ChevronLeft
} from 'lucide-react';
import { pb } from '../lib/pb';
import { motion, AnimatePresence } from 'framer-motion';
import ImportAddressModal from '../components/ImportAddressModal';
import AutocompleteSearch from '../components/AutocompleteSearch';

const COLLECTIONS = {
  prov: 'provinces',
  reg: 'regencies',
  dist: 'districts',
  vill: 'villages'
};

export default function MasterAddress() {
  const [activeTab, setActiveTab] = useState('prov'); // prov, reg, dist, vill
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(''); // Separate input state
  const [searchTerm, setSearchTerm] = useState('');   // Debounced search query
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selection states for filtering children
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedReg, setSelectedReg] = useState(null);
  const [selectedDist, setSelectedDist] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ id_wilayah: '', name: '', parent_id: '' });

  // Debounce global text search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedProv, selectedReg, selectedDist, searchTerm, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let filter = '';
      if (activeTab === 'reg') {
         if (!selectedProv) { setData([]); setTotalPages(1); setLoading(false); return; }
         filter = `parent_id = "${selectedProv.id_wilayah}"`;
      } else if (activeTab === 'dist') {
         if (!selectedReg) { setData([]); setTotalPages(1); setLoading(false); return; }
         filter = `parent_id = "${selectedReg.id_wilayah}"`;
      } else if (activeTab === 'vill') {
         if (!selectedDist) { setData([]); setTotalPages(1); setLoading(false); return; }
         filter = `parent_id = "${selectedDist.id_wilayah}"`;
      }

      // Add text search filter
      if (searchTerm) {
         let searchFilter = `(name ~ "${searchTerm.replace(/"/g, '\\"')}" || id_wilayah ~ "${searchTerm.replace(/"/g, '\\"')}")`;
         filter = filter ? `(${filter}) && ${searchFilter}` : searchFilter;
      }

      const records = await pb.collection(COLLECTIONS[activeTab]).getList(page, 50, {
        filter,
        sort: 'id_wilayah',
      });
      
      setData(records.items);
      setTotalPages(records.totalPages);
    } catch (err) {
      if (!err.isAbort) console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateNextId = async (tab, parentId) => {
    try {
      let filter = '';
      if (tab !== 'prov') {
        if (!parentId) return ''; // Induk belum dipilih
        filter = `parent_id = "${parentId}"`;
      }
      
      const records = await pb.collection(COLLECTIONS[tab]).getFullList({
        filter: filter,
        fields: 'id_wilayah',
      });

      if (records.length === 0) {
         if (tab === 'prov') return '11';
         if (tab === 'reg') return `${parentId}.01`;
         if (tab === 'dist') return `${parentId}.01`;
         if (tab === 'vill') return `${parentId}.2001`;
      }

      let maxNum = 0;
      records.forEach(r => {
         const parts = r.id_wilayah.split('.');
         const lastPart = parts[parts.length - 1];
         const num = parseInt(lastPart, 10);
         if (!isNaN(num) && num > maxNum) {
            maxNum = num;
         }
      });

      const nextNum = maxNum + 1;
      let nextStr = nextNum.toString();

      if (tab === 'prov') {
         nextStr = nextStr.padStart(2, '0');
         return nextStr;
      } else if (tab === 'vill') {
         nextStr = nextStr.padStart(4, '0');
         return `${parentId}.${nextStr}`;
      } else {
         nextStr = nextStr.padStart(2, '0');
         return `${parentId}.${nextStr}`;
      }
    } catch (e) {
      console.error("Gagal auto-generate ID", e);
      return '';
    }
  };

  const handleAdd = async () => {
    setEditingItem(null);
    let parent_id = '';
    if (activeTab === 'reg') parent_id = selectedProv?.id_wilayah || '';
    if (activeTab === 'dist') parent_id = selectedReg?.id_wilayah || '';
    if (activeTab === 'vill') parent_id = selectedDist?.id_wilayah || '';
    
    setFormData({ id_wilayah: 'Memuat ID...', name: '', parent_id });
    setIsModalOpen(true);
    
    const nextId = await generateNextId(activeTab, parent_id);
    setFormData({ id_wilayah: nextId, name: '', parent_id });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ id_wilayah: item.id_wilayah, name: item.name, parent_id: item.parent_id });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      try {
        await pb.collection(COLLECTIONS[activeTab]).delete(id);
        fetchData();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Pengecekan Duplikasi ID Wilayah
      const existing = await pb.collection(COLLECTIONS[activeTab]).getFirstListItem(`id_wilayah = "${formData.id_wilayah}"`).catch(()=>null);
      if (existing && (!editingItem || existing.id !== editingItem.id)) {
        alert('Gagal Dibuat:\nID Wilayah [' + formData.id_wilayah + '] sudah digunakan untuk wilayah lain. ID wajib unik!');
        return;
      }

      if (editingItem) {
        await pb.collection(COLLECTIONS[activeTab]).update(editingItem.id, formData);
      } else {
        await pb.collection(COLLECTIONS[activeTab]).create(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Gagal menyimpan. Pastikan ID unik dan format valid.\nLog: ' + err.message);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchInput('');
    setSearchTerm('');
    setPage(1);
    
    // Auto clear deeper selections if user jumps up
    if (tabId === 'prov') {
      setSelectedReg(null);
      setSelectedDist(null);
    } else if (tabId === 'reg') {
      setSelectedDist(null);
    }
  };

  const getParentLabel = () => {
    if (activeTab === 'reg') return 'Provinsi';
    if (activeTab === 'dist') return 'Kota/Kab';
    if (activeTab === 'vill') return 'Kecamatan';
    return '';
  };

  const getParentName = () => {
    if (activeTab === 'reg') return selectedProv?.name || '-';
    if (activeTab === 'dist') return selectedReg?.name || '-';
    if (activeTab === 'vill') return selectedDist?.name || '-';
    return '';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Master Alamat</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data hierarki wilayah Indonesia (Provinsi sampai Desa).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <div className="hidden sm:flex bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 items-center gap-2 text-sm font-bold">
              <AlertCircle size={16} />
              <span>Gunakan Import CSV untuk data massal</span>
           </div>
           <button 
             onClick={() => setIsImportModalOpen(true)}
             className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all text-sm"
           >
             <Upload size={16} /> <span className="hidden xs:inline">Import</span> CSV
           </button>
           <button 
             onClick={handleAdd}
             className="bg-brand-primary text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all text-sm"
           >
             <Plus size={16} /> Tambah Data
           </button>
        </div>
      </header>

      {/* Tabs — scrollable on mobile */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto custom-scrollbar w-full sm:w-fit">
         {[
           { id: 'prov', label: 'Provinsi', icon: <Map size={16} /> },
           { id: 'reg', label: 'Kota/Kab', icon: <Building size={16} /> },
           { id: 'dist', label: 'Kecamatan', icon: <Home size={16} /> },
           { id: 'vill', label: 'Desa/Kel', icon: <MapPin size={16} /> },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => handleTabChange(tab.id)}
             className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
               activeTab === tab.id ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             {tab.icon}
             {tab.label}
           </button>
         ))}
      </div>

      {/* Autocomplete Hierarchy Filtering Context */}
      {activeTab !== 'prov' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
              <Filter size={16}/> Konteks Wilayah Induk
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Always show Prov filter for Reg/Dist/Vill */}
             {(activeTab === 'reg' || activeTab === 'dist' || activeTab === 'vill') && (
                <AutocompleteSearch 
                  label="Filter Provinsi"
                  collection="provinces"
                  placeholder="Ketik 3 huruf provinsi..."
                  valueDisplay={selectedProv?.name || ''}
                  onSelect={(item) => {
                    setSelectedProv(item);
                    setSelectedReg(null); // Reset child
                    setSelectedDist(null);
                    setPage(1);
                  }}
                />
             )}
             
             {/* Show Reg filter for Dist/Vill */}
             {(activeTab === 'dist' || activeTab === 'vill') && (
                <AutocompleteSearch 
                  label="Filter Kota/Kabupaten"
                  collection="regencies"
                  placeholder="Ketik 3 huruf kota/kab..."
                  disabled={!selectedProv}
                  extraFilter={selectedProv ? `parent_id = "${selectedProv.id_wilayah}"` : ''}
                  valueDisplay={selectedReg?.name || ''}
                  onSelect={(item) => {
                    setSelectedReg(item);
                    setSelectedDist(null); // Reset child
                    setPage(1);
                  }}
                />
             )}
             
             {/* Show Dist filter for Vill */}
             {(activeTab === 'vill') && (
                <AutocompleteSearch 
                  label="Filter Kecamatan"
                  collection="districts"
                  placeholder="Ketik 3 huruf kecamatan..."
                  disabled={!selectedReg}
                  extraFilter={selectedReg ? `parent_id = "${selectedReg.id_wilayah}"` : ''}
                  valueDisplay={selectedDist?.name || ''}
                  onSelect={(item) => {
                    setSelectedDist(item);
                    setPage(1);
                  }}
                />
             )}
           </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-md overflow-hidden flex flex-col">
        <div className="p-3 md:p-6 border-b border-slate-50 flex items-center justify-between gap-3 bg-slate-50/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={`Cari nama di level ${activeTab}...`}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-medium"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button onClick={() => { setPage(1); fetchData(); }} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-100 rounded-xl transition-all shrink-0">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-3 md:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-10 md:w-16">No.</th>
                <th className="px-3 md:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Wilayah</th>
                {activeTab !== 'prov' && (
                  <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{getParentLabel()}</th>
                )}
                <th className="px-3 md:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Menarik data dari server...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-slate-400">
                    <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                       <MapPin className="text-slate-300" size={22} />
                    </div>
                    <p className="font-bold text-slate-700 text-sm">Tidak ada data untuk dirender</p>
                    {activeTab !== 'prov' && <p className="text-xs mt-1">Pilih Wilayah Induk di panel atas.</p>}
                  </td>
                </tr>
              ) : data.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs font-bold text-slate-400">
                    {(page - 1) * 50 + index + 1}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3">
                      <span className="font-black text-slate-700 text-sm leading-tight">{item.name}</span>
                      
                      {/* Drill-down shortcuts — visible on tap/hover */}
                      {activeTab === 'prov' && (
                        <button 
                          onClick={() => { setSelectedProv(item); handleTabChange('reg'); }}
                          className="opacity-60 sm:opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md hover:bg-blue-100 transition-all uppercase tracking-wider flex items-center gap-1 w-fit"
                        >
                          Kota <ChevronRight size={10} />
                        </button>
                      )}
                      {activeTab === 'reg' && (
                        <button 
                          onClick={() => { setSelectedReg(item); handleTabChange('dist'); }}
                          className="opacity-60 sm:opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md hover:bg-blue-100 transition-all uppercase tracking-wider flex items-center gap-1 w-fit"
                        >
                          Kec <ChevronRight size={10} />
                        </button>
                      )}
                      {activeTab === 'dist' && (
                        <button 
                          onClick={() => { setSelectedDist(item); handleTabChange('vill'); }}
                          className="opacity-60 sm:opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md hover:bg-blue-100 transition-all uppercase tracking-wider flex items-center gap-1 w-fit"
                        >
                          Desa <ChevronRight size={10} />
                        </button>
                      )}
                    </div>
                  </td>
                  {activeTab !== 'prov' && (
                    <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 text-xs font-bold text-slate-500 uppercase tracking-tight">{getParentName()}</td>
                  )}
                  <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                       <button onClick={() => handleEdit(item)} className="p-1.5 md:p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-light rounded-lg transition-all">
                         <Edit3 size={15} />
                       </button>
                       <button onClick={() => handleDelete(item.id)} className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                         <Trash2 size={15} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Interface */}
        <div className="p-3 md:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-400">
             Hal. <span className="text-slate-800">{page}</span> / <span className="text-slate-800">{totalPages || 1}</span>
           </p>
           <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>

      {activeTab === 'vill' && (
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-start gap-4">
          <Filter className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-900">
            <p className="font-black mb-1 text-base tracking-tight">Mode Lazy-Load Aktif</p>
            <p className="opacity-90 leading-relaxed text-blue-800">Tabel desa tidak akan dimuat jika Anda belum memfilter Kecamatan. Sistem pagination di sisi server hanya menarik maksimal 50 baris per halaman, memastikan dasbor ini selalu super ringan (terlepas dari adanya puluhan ribu data di database belakang).</p>
          </div>
        </div>
      )}

      {/* Import Wizard */}
      <ImportAddressModal 
        isOpen={isImportModalOpen} 
        onClose={() => {
          setIsImportModalOpen(false);
          fetchData(); // Refresh data when import modal closes
        }} 
      />

      {/* Modal Add/Edit */}
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
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-50">
                <h3 className="text-lg font-bold text-slate-800">{editingItem ? 'Edit' : 'Tambah'} Data {activeTab.toUpperCase()}</h3>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {activeTab !== 'prov' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Wilayah Induk ({getParentLabel()})</p>
                    <p className="text-sm font-bold text-slate-700">{getParentName()}</p>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Wilayah</label>
                  <input 
                    required
                    type="text" 
                    placeholder={`Nama ${activeTab.toUpperCase()}...`}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                   <button 
                     type="button"
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all"
                   >
                     Batal
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 py-2.5 bg-brand-primary text-white rounded-xl font-bold hover:opacity-90 shadow-lg shadow-blue-100 transition-all"
                   >
                     Simpan Data
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
