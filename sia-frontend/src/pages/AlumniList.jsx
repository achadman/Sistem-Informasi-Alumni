import React, { useState, useEffect } from 'react';
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
  MapPin,
  Calendar,
  Loader2,
  Edit3,
  FileText,
  X,
  ChevronDown,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddAlumniModal from '../components/AddAlumniModal';
import { pb } from '../lib/pb';
import { exportAlumniToPDF } from '../lib/pdfGenerator';

export default function AlumniList() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [error, setError] = useState(null);
  const [batchStats, setBatchStats] = useState({ current: 0, last: 0 });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Filter States
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    provinsi: '',
    kota: '',
    tahun_lulus: '',
    status_kerja: '',
    gender: '',
    agama: '',
    keterangan: '',
    golongan_darah: ''
  });
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch Provinces on Mount
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Gagal ambil provinsi:", err));
  }, []);

  // Fetch Regencies when Provincia filter changes
  useEffect(() => {
    if (filters.provinsi) {
      const selectedProv = provinces.find(p => p.name === filters.provinsi);
      if (selectedProv) {
        setLoadingRegions(true);
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProv.id}.json`)
          .then(res => res.json())
          .then(data => setRegencies(data))
          .catch(err => console.error(err))
          .finally(() => setLoadingRegions(false));
      }
    } else {
      setRegencies([]);
    }
  }, [filters.provinsi, provinces]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchAlumni();
  }, [currentPage, searchQuery, filters]);

  const fetchAlumni = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build filter string
      let filterParts = [];
      
      if (searchQuery) {
        filterParts.push(`(nama ~ "${searchQuery}" || nim ~ "${searchQuery}")`);
      }

      if (filters.provinsi) filterParts.push(`provinsi = "${filters.provinsi}"`);
      if (filters.kota) filterParts.push(`kota = "${filters.kota}"`);
      if (filters.tahun_lulus) filterParts.push(`tahun_lulus = ${filters.tahun_lulus}`);
      if (filters.status_kerja) filterParts.push(`status_kerja = "${filters.status_kerja}"`);
      if (filters.gender) filterParts.push(`gender = "${filters.gender}"`);
      if (filters.agama) filterParts.push(`agama ~ "${filters.agama}"`);
      if (filters.keterangan) filterParts.push(`keterangan = "${filters.keterangan}"`);
      if (filters.golongan_darah) filterParts.push(`golongan_darah = "${filters.golongan_darah}"`);

      const filterString = filterParts.join(' && ');
      const pageToFetch = Math.max(1, currentPage);

      // DEFENSIVE: Only pass filter if it's not empty. 
      // REMOVED sort: '+created' as it causes 400 error due to PB collection rules
      const options = {};
      if (filterString) {
        options.filter = filterString;
      }

      const result = await pb.collection('alumni').getList(pageToFetch, itemsPerPage, options);
      
      console.log('API RESPONSE SUCCESS:', result);
      setAlumni(result.items || []);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.totalItems || 0);

      // STRATEGY: Fetch all years once to calculate global stats accurately
      // This is much more robust than individual numeric filters
      const allYearsRes = await pb.collection('alumni').getFullList({ 
        fields: 'tahun_lulus',
        requestKey: 'batch-stats' // Unique key to avoid cancelling main list
      });
      
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      
      const currentCount = allYearsRes.filter(a => Number(a.tahun_lulus) === currentYear).length;
      const lastCount = allYearsRes.filter(a => Number(a.tahun_lulus) === lastYear).length;
      
      setBatchStats({ current: currentCount, last: lastCount });

    } catch (err) {
      if (err.isAbort) {
        console.log("Request autocancelled");
        return;
      }
      console.error("DEBUG API ERROR:", err);
      setError(err.message || "Gagal menghubungkan ke database");
      setAlumni([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setCurrentPage(1); 
    fetchAlumni();
  };

  const handleResetFilter = () => {
    setFilters({
      provinsi: '',
      kota: '',
      tahun_lulus: '',
      status_kerja: '',
      gender: '',
      agama: '',
      keterangan: '',
      golongan_darah: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const handleSaveAlumni = () => {
    fetchAlumni();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Database Alumni</h1>
          <p className="text-slate-500 mt-1">Kelola dan pantau data alumni institusi secara real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama atau NIM..." 
              className="pl-12 pr-6 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm w-full md:w-80 outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={`p-3.5 rounded-2xl border shadow-sm transition-all relative ${isFilterVisible ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-500 border-slate-100 hover:text-brand-primary hover:bg-brand-light'}`}
          >
            <Filter size={20} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <button className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
            <Download size={20} />
          </button>

          <button 
            onClick={() => {
              setEditData(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3.5 bg-brand-primary text-white rounded-2xl font-bold shadow-xl shadow-blue-100/30 hover:brightness-110 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Tambah Alumni</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterVisible && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'circOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-light text-brand-primary rounded-xl">
                    <Filter size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Filter Data Alumni</h3>
                </div>
                <button 
                  onClick={() => setIsFilterVisible(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Provinsi</label>
                  <div className="relative">
                    <select 
                      value={filters.provinsi}
                      onChange={(e) => setFilters({...filters, provinsi: e.target.value, kota: ''})}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm appearance-none font-medium"
                    >
                      <option value="">Semua Provinsi</option>
                      {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    Kota/Kab {loadingRegions && <Loader2 size={10} className="animate-spin" />}
                  </label>
                  <div className="relative">
                    <select 
                      value={filters.kota}
                      onChange={(e) => setFilters({...filters, kota: e.target.value})}
                      disabled={!filters.provinsi}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm appearance-none font-medium disabled:opacity-50"
                    >
                      <option value="">Semua Kota/Kab</option>
                      {regencies.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tahun Lulus</label>
                  <input 
                    type="number"
                    placeholder="Contoh: 2023"
                    value={filters.tahun_lulus}
                    onChange={(e) => setFilters({...filters, tahun_lulus: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Status Kerja</label>
                  <div className="relative">
                    <select 
                      value={filters.status_kerja}
                      onChange={(e) => setFilters({...filters, status_kerja: e.target.value})}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm appearance-none font-medium"
                    >
                      <option value="">Semua Status</option>
                      <option value="Bekerja">Bekerja</option>
                      <option value="Wiraswasta">Wiraswasta</option>
                      <option value="Belum Bekerja">Belum Bekerja</option>
                      <option value="Melanjutkan Studi">Melanjutkan Studi</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                  <div className="relative">
                    <select 
                      value={filters.gender}
                      onChange={(e) => setFilters({...filters, gender: e.target.value})}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm appearance-none font-medium"
                    >
                      <option value="">Semua L/P</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Agama</label>
                  <input 
                    type="text"
                    placeholder="Cari agama..."
                    value={filters.agama}
                    onChange={(e) => setFilters({...filters, agama: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Golongan Darah</label>
                  <div className="relative">
                    <select 
                      value={filters.golongan_darah}
                      onChange={(e) => setFilters({...filters, golongan_darah: e.target.value})}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm appearance-none font-medium"
                    >
                      <option value="">Semua Gol. Darah</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Status Akademik / Hidup</label>
                  <div className="relative">
                    <select 
                      value={filters.keterangan}
                      onChange={(e) => setFilters({...filters, keterangan: e.target.value})}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-primary/40 transition-all text-sm appearance-none font-medium"
                    >
                      <option value="">Semua Status</option>
                      <option value="Lulus">Lulus</option>
                      <option value="Drop Out (DO)">Drop Out (DO)</option>
                      <option value="Mengundurkan Diri (Keluar)">Mengundurkan Diri (Keluar)</option>
                      <option value="Pindah Universitas">Pindah Universitas</option>
                      <option value="Meninggal Dunia">Meninggal Dunia</option>
                      <option value="Lainnya">Lainnya...</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-50">
                <button 
                  onClick={handleResetFilter}
                  className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Reset Filter
                </button>
                <button 
                  onClick={handleApplyFilter}
                  className="px-8 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:brightness-110 transition-all active:scale-95"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(() => {
          const currentYear = new Date().getFullYear();
          const lastYear = currentYear - 1;
          const currentYearCount = batchStats.current;
          const lastYearCount = batchStats.last;
          const growth = currentYearCount - lastYearCount;

          return (
            <>
              <StatCard 
                title="Total Alumni" 
                value={totalItems} 
                trend={searchQuery ? "Hasil pencarian" : "Semua database"} 
                icon={<TrendingUp className="text-blue-500" />} 
              />
              <StatCard 
                title={`Lulus Tahun ${currentYear}`} 
                value={currentYearCount} 
                trend={growth >= 0 ? `+${growth} dari tahun lalu` : `${growth} dari tahun lalu`} 
                icon={<Calendar className="text-emerald-500" />} 
              />
              <StatCard 
                title={`Lulus Tahun ${lastYear}`} 
                value={lastYearCount} 
                trend="Angkatan sebelumnya" 
                icon={<Calendar className="text-purple-500" />} 
              />
            </>
          );
        })()}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-6 text-sm font-bold text-slate-400 uppercase tracking-wider w-16">No.</th>
                <th className="px-6 py-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Alumni</th>
                <th className="px-6 py-6 text-sm font-bold text-slate-400 uppercase tracking-wider">NIM</th>
                <th className="px-6 py-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Tahun Lulus</th>
                <th className="px-6 py-6 text-sm font-bold text-slate-400 uppercase tracking-wider">L/P</th>
                <th className="px-6 py-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Instansi</th>
                <th className="px-8 py-6 text-sm font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin inline-block mr-2 text-brand-primary" />
                    <span className="text-slate-500 font-medium">Memuat data alumni...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="px-8 py-20 text-center">
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mx-auto max-w-sm">
                      <p className="font-bold text-sm">Error Database (400)</p>
                      <p className="text-xs mt-1">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : alumni.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-8 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={40} className="opacity-20 mb-2" />
                      <p className="font-bold text-slate-400">Data Tidak Ditemukan</p>
                      <p className="text-xs">Coba ubah filter atau kata kunci pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                alumni.map((person, index) => (
                  <tr key={person.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-400">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center overflow-hidden text-brand-primary font-bold group-hover:bg-blue-100 transition-colors shadow-sm">
                          {person.gambar ? (
                            <img src={pb.files.getURL(person, person.gambar, { 'thumb': '100x100' })} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            person.nama.charAt(0)
                          )}
                        </div>
                        <span className="font-bold text-slate-800">{person.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium">#{person.nim}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {person.tahun_lulus}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${person.gender === 'L' ? 'bg-brand-light text-brand-primary' : 'bg-pink-50 text-pink-600'}`}>
                        {person.gender}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={person.status_kerja || person.status} />
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
                        {person.keterangan || 'Lulus'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-600 uppercase text-xs font-bold">{person.np || '-'}</td>
                    <td className="px-8 py-5 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === person.id ? null : person.id);
                        }}
                        className="text-slate-300 hover:text-slate-600 p-2 rounded-xl transition-colors"
                      >
                        <MoreHorizontal size={24} />
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownId === person.id && (
                        <div className="absolute right-8 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 animate-in slide-in-from-top-2 fade-in overflow-hidden">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/alumni/${person.id}`);
                            }}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-50"
                          >
                            <User size={16} />
                            Detail Alumni
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditData(person);
                              setIsModalOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-brand-light hover:text-brand-primary transition-colors"
                          >
                            <Edit3 size={16} />
                            Edit Data
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              exportAlumniToPDF(person);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border-t border-slate-50"
                          >
                            <FileText size={16} />
                            Download PDF
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

        {/* Pagination */}
        <div className="p-8 border-t border-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-400 font-medium font-outfit">
            Menampilkan <span className="text-slate-900 font-bold">{alumni.length}</span> dari <span className="text-slate-900 font-bold">{totalItems}</span> alumni
          </p>
          <div className="flex gap-2">
             <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
             >
               <ChevronLeft size={20} />
             </button>
             
             {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
               <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${currentPage === page ? 'bg-brand-primary text-white shadow-md shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                 {page}
               </button>
             ))}

             <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
             >
               <ChevronRight size={20} />
             </button>
          </div>
        </div>
      </div>

      <AddAlumniModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }} 
        onSave={handleSaveAlumni}
        editData={editData}
      />
    </div>
  );
}

function StatCard({ title, value, trend, icon }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-soft flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{trend}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'Bekerja': 'bg-emerald-50 text-emerald-600',
    'Wiraswasta': 'bg-blue-50 text-blue-600',
    'Melanjutkan Studi': 'bg-purple-50 text-purple-600',
    'Belum Bekerja': 'bg-amber-50 text-amber-600'
  };
  return <span className={`px-4 py-1.5 rounded-2xl text-xs font-bold shadow-sm ${styles[status] || styles['Belum Bekerja'] || 'bg-slate-50 text-slate-500'}`}>{status || 'Belum Bekerja'}</span>;
}
