import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Calendar,
  Edit3,
  FileText,
  X,
  ChevronDown,
  User,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

import AddAlumniModal from '../components/AddAlumniModal';
import ImportAlumniModal from '../components/ImportAlumniModal';
import SelectDropdown from '../components/SelectDropdown';
import { pb } from '../lib/pb';
import { exportAlumniToPDF } from '../lib/pdfGenerator';
import { useAuthStore } from '../store/authStore';
import { useAlumni, useAlumniStats } from '../hooks/useAlumni';
import { TableRowSkeleton } from '../components/Skeleton';
import { notify } from '../lib/notifications';

export default function AlumniList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isIndustri = user?.role === 'industri';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [filters, setFilters] = useState({
    provinsi: '',
    kota: '',
    tahun_lulus: '',
    status_kerja: '',
    gender: '',
    agama: '',
    keterangan: '',
    golongan_darah: '',
    fakultasId: '',
    prodi: ''
  });

  // Master Data
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [fakultasList, setFakultasList] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // Memoized filter string
  const filterString = useMemo(() => {
    let filterParts = [];
    if (searchQuery) filterParts.push(`(nama ~ "${searchQuery}" || nim ~ "${searchQuery}")`);
    if (filters.provinsi) filterParts.push(`provinsi = "${filters.provinsi}"`);
    if (filters.kota) filterParts.push(`kota_kabupaten = "${filters.kota}"`);
    if (filters.tahun_lulus) filterParts.push(`tahun_lulus = ${filters.tahun_lulus}`);
    if (filters.status_kerja) filterParts.push(`status_kerja = "${filters.status_kerja}"`);
    if (filters.gender) filterParts.push(`gender = "${filters.gender}"`);
    if (filters.agama) filterParts.push(`agama ~ "${filters.agama}"`);
    if (filters.keterangan) filterParts.push(`keterangan = "${filters.keterangan}"`);
    if (filters.golongan_darah) filterParts.push(`golongan_darah = "${filters.golongan_darah}"`);
    
    if (filters.prodi) {
      filterParts.push(`prodi = "${filters.prodi}"`);
    } else if (filters.fakultasId) {
      const childProdis = prodiList.filter(p => p.fakultas_id === filters.fakultasId);
      if (childProdis.length > 0) {
        const prodiNames = childProdis.map(p => `prodi = "${p.nama}"`);
        filterParts.push(`(${prodiNames.join(' || ')})`);
      } else {
        filterParts.push(`prodi = "___NONE___"`);
      }
    }
    return filterParts.join(' && ');
  }, [searchQuery, filters, prodiList]);

  // Data Fetching Hooks
  const { data, isLoading, isError, error } = useAlumni(currentPage, itemsPerPage, filterString);
  const statsQuery = useAlumniStats();

  const alumni = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  const dropdownRef = useRef(null);

  // Initial Data
  useEffect(() => {
    const controller = new AbortController();
    
    pb.collection('provinces').getFullList({ sort: 'name', requestKey: 'provinces' }).then(setProvinces);
    pb.collection('fakultas').getFullList({ sort: 'nama', requestKey: 'fakultas' }).then(setFakultasList);
    pb.collection('program_studi').getFullList({ expand: 'fakultas_id', sort: 'nama', requestKey: 'prodi' }).then(setProdiList);
    
    // BUG-02 Fix: Generate years instead of fetching thousands of records
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 1990; y--) {
      years.push(y);
    }
    setAvailableYears(years);

    // BUG-05 Fix: Handle click outside for dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      controller.abort();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Regency Fetching
  useEffect(() => {
    if (filters.provinsi) {
      const selectedProv = provinces.find(p => p.name === filters.provinsi);
      if (selectedProv) {
        setLoadingRegions(true);
        pb.collection('regencies').getFullList({
          filter: `parent_id = "${selectedProv.id_wilayah}"`,
          sort: 'name'
        })
          .then(setRegencies)
          .finally(() => setLoadingRegions(false));
      }
    } else {
      setRegencies([]);
    }
  }, [filters.provinsi, provinces]);

  const handleResetFilter = () => {
    setFilters({
      provinsi: '', kota: '', tahun_lulus: '', status_kerja: '',
      gender: '', agama: '', keterangan: '', golongan_darah: '',
      fakultasId: '', prodi: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSaveAlumni = () => {
    queryClient.invalidateQueries(['alumni']);
    queryClient.invalidateQueries(['alumni-stats']);
    notify.success('Data alumni berhasil diperbarui');
  };

  const handleExportCSV = async () => {
    const loadId = notify.loading('Menyiapkan data ekspor...');
    try {
      // BUG-03 Fix: Limit export to 5000 to prevent crash, use current filters
      const records = await pb.collection('alumni').getList(1, 5000, {
        filter: filterString,
        sort: '-created'
      });
      
      const allData = records.items;
      if (!allData || allData.length === 0) {
        notify.dismiss(loadId);
        notify.error('Tidak ada data untuk diekspor');
        return;
      }

      if (records.totalItems > 5000) {
        notify.info('Hanya mengekspor 5000 data terbaru untuk performa.');
      }

      const headers = ["NIM", "Nama", "Tahun Lulus", "Gender", "Program Studi", "Status Kerja", "Instansi"];
      const rows = allData.map(a => [
        `"${a.nim || ''}"`, `"${a.nama || ''}"`, a.tahun_lulus, a.gender, `"${a.prodi || ''}"`, `"${a.status_kerja || ''}"`, `"${a.np || ''}"`
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Alumni_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      notify.dismiss(loadId);
      notify.success(`Berhasil mengekspor ${allData.length} data`);
    } catch (err) {
      notify.dismiss(loadId);
      notify.error('Gagal mengekspor data');
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-12">
      <div className="flex-none space-y-3 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Database Alumni</h1>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">Kelola dan pantau data alumni institusi secara real-time.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Cari nama atau NIM..." 
                className="pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm w-full md:w-64 outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <button 
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={`p-2.5 rounded-xl border shadow-sm transition-all relative ${isFilterVisible ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-500 border-slate-100 hover:text-brand-primary hover:bg-brand-light'}`}
            >
              <Filter size={16} />
              {Object.values(filters).filter(v => v !== '').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </button>
            
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                  <Download size={16} />
                </button>
                <button onClick={() => setIsImportModalOpen(true)} className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  <UploadCloud size={16} />
                </button>
                <button 
                  onClick={() => { setEditData(null); setIsModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-blue-100/30 hover:brightness-110 transition-all active:scale-95 text-sm"
                >
                  <Plus size={16} />
                  <span className="hidden md:inline">Tambah Alumni</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {isFilterVisible && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Reuse existing filter inputs with minor cleanups */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Fakultas</label>
                    <SelectDropdown
                      value={filters.fakultasId}
                      onChange={(val) => { setFilters({...filters, fakultasId: val, prodi: ''}); setCurrentPage(1); }}
                      placeholder="Semua Fakultas"
                      options={fakultasList.map(f => ({ value: f.id, label: f.nama }))}
                    />
                  </div>
                  {/* ... (Other filters) ... */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Prodi</label>
                    <SelectDropdown
                      value={filters.prodi}
                      onChange={(val) => { setFilters({...filters, prodi: val}); setCurrentPage(1); }}
                      placeholder="Semua Prodi"
                      disabled={!filters.fakultasId}
                      options={prodiList.filter(p => p.fakultas_id === filters.fakultasId).map(p => ({ value: p.nama, label: p.nama }))}
                    />
                  </div>
                   <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Provinsi</label>
                    <SelectDropdown
                      value={filters.provinsi}
                      onChange={(val) => { setFilters({...filters, provinsi: val, kota: ''}); setCurrentPage(1); }}
                      placeholder="Semua Provinsi"
                      options={provinces.map(p => ({ value: p.name, label: p.name }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      Kota/Kab {loadingRegions && <Loader2 size={10} className="animate-spin" />}
                    </label>
                    <SelectDropdown
                      value={filters.kota}
                      onChange={(val) => { setFilters({...filters, kota: val}); setCurrentPage(1); }}
                      placeholder="Semua Kota/Kab"
                      disabled={!filters.provinsi}
                      options={regencies.map(r => ({ value: r.name, label: r.name }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tahun Lulus</label>
                    <SelectDropdown
                      value={filters.tahun_lulus}
                      onChange={(val) => { setFilters({...filters, tahun_lulus: val}); setCurrentPage(1); }}
                      placeholder="Semua Tahun"
                      options={availableYears.map(year => ({ value: year.toString(), label: year.toString() }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-50">
                  <button onClick={handleResetFilter} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all">Reset Filter</button>
                  <button onClick={() => { setIsFilterVisible(false); setCurrentPage(1); }} className="px-8 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:brightness-110 transition-all active:scale-95">Terapkan Filter</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard title="Total Alumni" value={statsQuery.data?.total || 0} trend="Database Institusi" icon={<TrendingUp className="text-blue-500" />} />
          <StatCard title="Lulus Tahun Ini" value={statsQuery.data?.currentCount || 0} trend={`Tahun ${new Date().getFullYear()}`} icon={<Calendar className="text-emerald-500" />} />
          <StatCard title="Lulus Tahun Lalu" value={statsQuery.data?.lastCount || 0} trend={`Tahun ${new Date().getFullYear() - 1}`} icon={<Calendar className="text-purple-500" />} />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft flex flex-col mt-4 overflow-clip">
        <div className="w-full overflow-x-auto xl:overflow-visible">
          <table className="w-full text-left relative">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 shadow-sm border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest w-16">No.</th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Alumni</th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">NIM</th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tahun Lulus</th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">L/P</th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Instansi</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan="8" className="px-8 py-20 text-center text-red-500 font-bold">{error?.message || 'Gagal memuat data'}</td>
                </tr>
              ) : alumni.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-8 py-20 text-center text-slate-400 font-bold">Data tidak ditemukan</td>
                </tr>
              ) : (
                alumni.map((person, index) => (
                  <tr key={person.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center overflow-hidden text-brand-primary font-bold group-hover:bg-blue-100 transition-colors shadow-sm">
                          {person.gambar ? <img src={pb.files.getURL(person, person.gambar, { thumb: '100x100' })} alt="" className="w-full h-full object-cover" /> : person.nama.charAt(0)}
                        </div>
                        <span className="font-bold text-sm text-slate-800">{person.nama}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-semibold text-sm">{person.nim}</td>
                    <td className="px-5 py-4 text-slate-600 text-sm font-medium">{person.tahun_lulus}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${person.gender === 'L' ? 'bg-brand-light text-brand-primary' : 'bg-pink-50 text-pink-600'}`}>{person.gender}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={person.status_kerja} />
                    </td>
                    <td className="px-5 py-4 text-slate-600 uppercase text-xs font-bold">{person.np || '-'}</td>
                    <td className="px-6 py-4 text-right relative">
                      <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === person.id ? null : person.id); }} className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                      {openDropdownId === person.id && (
                        <div ref={dropdownRef} className="absolute right-8 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-[30] overflow-hidden">
                          <button onClick={() => navigate(isAdmin ? `/admin/alumni/${person.id}` : `/alumni/${person.id}`)} className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-blue-50">
                            <User size={16} /> Detail
                          </button>
                          {isAdmin && (
                            <>
                              <button onClick={() => { setEditData(person); setIsModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-brand-light">
                                <Edit3 size={16} /> Edit
                              </button>
                              <button onClick={() => { exportAlumniToPDF(person); setOpenDropdownId(null); }} className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-emerald-50">
                                <FileText size={16} /> PDF
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-8 border-t border-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-400 font-medium">Menampilkan <span className="text-slate-900 font-bold">{alumni.length}</span> dari <span className="text-slate-900 font-bold">{totalItems}</span> alumni</p>
            <div className="flex gap-2">
               <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 disabled:opacity-30"><ChevronLeft size={20} /></button>
               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 disabled:opacity-30"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      </div>

      <AddAlumniModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditData(null); }} onSave={handleSaveAlumni} editData={editData} />
      <ImportAlumniModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={handleSaveAlumni} />
    </div>
  );
}

function StatCard({ title, value, trend, icon }) {
  return (
    <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-soft flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{trend}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'Bekerja': 'bg-emerald-50 text-emerald-600',
    'Wiraswasta': 'bg-blue-50 text-blue-600',
    'Belum Bekerja': 'bg-amber-50 text-amber-600',
    'Melanjutkan Studi': 'bg-purple-50 text-purple-600'
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[status] || 'bg-slate-100 text-slate-500'}`}>{status || 'N/A'}</span>;
}
