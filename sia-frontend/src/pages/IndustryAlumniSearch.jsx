import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, X, Bookmark, BookmarkCheck, ChevronDown,
  GraduationCap, Briefcase, MapPin, Star, SlidersHorizontal,
  User, Phone, Mail, ExternalLink, Loader2, AlertCircle, Check, Shield
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';
import CustomSelect from '../components/CustomSelect';

const STATUS_LABELS = {
  bekerja: { label: 'Bekerja', color: 'bg-emerald-100 text-emerald-700' },
  wirausaha: { label: 'Wirausaha', color: 'bg-violet-100 text-violet-700' },
  belum_bekerja: { label: 'Belum Bekerja', color: 'bg-amber-100 text-amber-700' },
  melanjutkan_studi: { label: 'Lanjut Studi', color: 'bg-blue-100 text-blue-700' },
};

export default function IndustryAlumniSearch() {
  const { user } = useAuthStore();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    fakultasId: '',
    prodi: '',
    minIpk: '',
    status: '',
    openToWork: false,
    onlyBookmarked: false,
    sort: '-created',
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const [fakultasList, setFakultasList] = useState([]);
  const [prodiList, setProdiList] = useState([]);

  const PER_PAGE = 12;

  // Fetch company profile for current user
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const record = await pb.collection('companies').getFirstListItem(`user="${user?.id}"`);
        setCompany(record);
      } catch {
        setCompany(null);
      }
    };
    if (user?.id) fetchCompany();
  }, [user]);

  // Fetch bookmarks for this company
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!company?.id) return;
      try {
        const result = await pb.collection('bookmarks').getFullList({
          filter: `company="${company.id}"`,
          fields: 'alumni',
        });
        setBookmarked(new Set(result.map(b => b.alumni)));
      } catch { /* ignore */ }
    };
    fetchBookmarks();
  }, [company]);

  // Fetch Master Data
  useEffect(() => {
    Promise.all([
      pb.collection('fakultas').getFullList({ sort: 'nama' }),
      pb.collection('program_studi').getFullList({ expand: 'fakultas_id', sort: 'nama' })
    ]).then(([fData, pData]) => {
      setFakultasList(fData);
      setProdiList(pData);
    }).catch(console.error);
  }, []);

  // Fetch alumni with filters
  const fetchAlumni = useCallback(async (pageNum = 1, f = appliedFilters) => {
    setLoading(true);
    try {
      const filterParts = [];
      if (f.search) {
        filterParts.push(`(nama ~ "${f.search}" || nim ~ "${f.search}")`);
      }
      
      if (f.prodi) {
        filterParts.push(`prodi = "${f.prodi}"`);
      } else if (f.fakultasId) {
        const childProdis = prodiList.filter(p => p.fakultas_id === f.fakultasId);
        if (childProdis.length > 0) {
          const prodiNames = childProdis.map(p => `prodi = "${p.nama}"`);
          filterParts.push(`(${prodiNames.join(' || ')})`);
        } else {
          filterParts.push(`prodi = "___NONE___"`);
        }
      }
      
      if (f.minIpk) filterParts.push(`ipk >= ${f.minIpk}`);
      if (f.status) filterParts.push(`pekerjaan_status = "${f.status}"`);
      if (f.angkatan) filterParts.push(`angkatan = "${f.angkatan}"`);
      if (f.openToWork) filterParts.push(`is_open_to_work = true`);
      
      if (f.onlyBookmarked) {
        if (bookmarked.size > 0) {
          const idParts = Array.from(bookmarked).map(id => `id = "${id}"`);
          filterParts.push(`(${idParts.join(' || ')})`);
        } else {
          filterParts.push(`id = "___NONE___"`);
        }
      }

      const finalFilter = filterParts.join(' && ');
      console.log('Applying Alumni Filter:', finalFilter);

      // Disable auto-cancellation
      pb.autoCancellation(false);
      const result = await pb.collection('alumni').getList(pageNum, PER_PAGE, {
        filter: finalFilter || '',
        sort: f.sort || '-created',
        fields: 'collectionId,collectionName,id,nama,nim,prodi,ipk,angkatan,pekerjaan_status,is_open_to_work,gambar,keahlian,kota,provinsi',
      });

      setAlumni(result.items);
      setTotal(result.totalItems);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch alumni:', err);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchAlumni(1, appliedFilters);
  }, [appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const empty = { search: '', fakultasId: '', prodi: '', minIpk: '', status: '', angkatan: '', openToWork: false, onlyBookmarked: false, sort: '-created' };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const activeFilterCount = Object.entries(appliedFilters).filter(([k, v]) => {
    if (k === 'openToWork' || k === 'onlyBookmarked') return v === true;
    return v !== '';
  }).length;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBookmark = async (alumniId) => {
    if (!company?.id) return;

    const isBookmarked = bookmarked.has(alumniId);
    setBookmarkLoading(prev => new Set([...prev, alumniId]));

    try {
      if (isBookmarked) {
        // Remove bookmark
        const bm = await pb.collection('bookmarks').getFirstListItem(
          `company="${company.id}" && alumni="${alumniId}"`
        );
        await pb.collection('bookmarks').delete(bm.id);
        setBookmarked(prev => {
          const next = new Set(prev);
          next.delete(alumniId);
          return next;
        });
        showToast('Bookmark dihapus', 'info');
      } else {
        // Add bookmark
        await pb.collection('bookmarks').create({
          company: company.id,
          alumni: alumniId,
        });
        setBookmarked(prev => new Set([...prev, alumniId]));
        showToast('Alumni ditambahkan ke bookmark ⭐');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      showToast('Gagal memperbarui bookmark', 'error');
    } finally {
      setBookmarkLoading(prev => {
        const next = new Set(prev);
        next.delete(alumniId);
        return next;
      });
    }
  };

  const angkatanOptions = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

  const totalPages = Math.ceil(total / PER_PAGE);

  if (loading && !company) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Protection: If company is not verified, show restriction message
  if (company && !company.verified) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <div className="premium-card p-10 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 text-brand-primary/10 opacity-5 rotate-12">
            <Search size={200} />
          </div>
          <div className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative z-10 transition-transform hover:scale-110">
            <Shield size={40} className="text-brand-primary" />
          </div>
          <h2 className="text-2xl font-black text-primary tracking-tight mb-4 relative z-10">Pencarian Terbatas</h2>
          <p className="text-secondary leading-relaxed mb-10 relative z-10 font-medium opacity-80">
            Fitur pencarian alumni dan melihat profil lengkap hanya tersedia untuk perusahaan yang telah 
            <span className="text-brand-primary font-black ml-1">diverifikasi oleh Admin</span>. 
            Hal ini dilakukan untuk menjaga privasi data alumni kami.
          </p>
          <div className="flex flex-col gap-3 relative z-10">
            <button
              onClick={() => window.location.href = '/industri'}
              className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              Kembali ke Dashboard
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-center gap-2 text-[10px] font-black text-secondary opacity-30 uppercase tracking-widest relative z-10">
            <AlertCircle size={12} /> Status: Menunggu Verifikasi
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm border ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-100'
                : toast.type === 'info'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}
          >
            <Check size={16} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header Section */}
      <div className="sticky top-0 z-30 pt-2 pb-6 bg-main/90 backdrop-blur-md -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-2xl font-black text-primary tracking-tight">Pencarian Alumni</h1>
            <p className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5 opacity-50">
              {total > 0 ? `${total} Alumni Ditemukan` : 'Kandidat Terbaik'}
            </p>
          </div>

          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full lg:max-w-3xl">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-30" />
              <input
                type="text"
                placeholder="Cari nama atau NIM..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="w-full pl-11 pr-4 py-3 bg-surface border border-border-subtle rounded-2xl text-sm text-primary placeholder:text-secondary/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary transition-all font-bold shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleApplyFilters}
                className="flex-1 sm:flex-none px-6 py-3 bg-brand-primary hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                Cari
              </button>

              {/* Bookmark Toggle Button */}
              <button
                onClick={() => {
                  const newVal = !filters.onlyBookmarked;
                  setFilters(f => ({ ...f, onlyBookmarked: newVal }));
                  setAppliedFilters(f => ({ ...f, onlyBookmarked: newVal }));
                }}
                title="Filter Bookmark"
                className={`p-3 rounded-2xl transition-all active:scale-95 border flex items-center justify-center ${
                  filters.onlyBookmarked
                    ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-surface text-secondary border-border-subtle hover:bg-main'
                }`}
              >
                <Bookmark size={18} fill={filters.onlyBookmarked ? "currentColor" : "none"} />
              </button>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative p-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center border ${
                  showFilters || activeFilterCount > (appliedFilters.onlyBookmarked ? 1 : 0)
                    ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-blue-500/20'
                    : 'bg-surface text-secondary border-border-subtle hover:bg-main'
                }`}
              >
                <SlidersHorizontal size={18} />
                {(activeFilterCount > (appliedFilters.onlyBookmarked ? 1 : 0)) && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-black shadow-lg">
                    {activeFilterCount - (appliedFilters.onlyBookmarked ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-soft"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-brand-primary" />
                <h3 className="font-black text-primary uppercase text-xs tracking-widest">Filter & Urutkan</h3>
              </div>
              <button onClick={handleResetFilters} className="text-[10px] font-black text-secondary/40 hover:text-red-500 transition-colors uppercase tracking-widest">
                Reset Semua
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {/* Urutan */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Urutkan</label>
                <CustomSelect
                  value={filters.sort}
                  onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
                  options={[
                    { value: '-created', label: 'Terbaru' },
                    { value: '-ipk', label: 'IPK Tertinggi' },
                    { value: 'ipk', label: 'IPK Terendah' },
                    { value: 'nama', label: 'Nama (A-Z)' }
                  ]}
                  placeholder="Urutkan"
                />
              </div>
              {/* Fakultas */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Fakultas</label>
                <CustomSelect
                  value={filters.fakultasId}
                  onChange={(e) => setFilters(f => ({ ...f, fakultasId: e.target.value, prodi: '' }))}
                  options={fakultasList.map(f => ({ value: f.id, label: f.nama }))}
                  placeholder="Semua Fakultas"
                />
              </div>

              {/* Program Studi */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Prodi</label>
                <CustomSelect
                  value={filters.prodi}
                  onChange={(e) => setFilters(f => ({ ...f, prodi: e.target.value }))}
                  disabled={!filters.fakultasId}
                  options={prodiList.filter(p => p.fakultas_id === filters.fakultasId).map(p => ({ value: p.nama, label: p.nama }))}
                  placeholder="Semua Prodi"
                />
              </div>

              {/* Status Kerja */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Status</label>
                <CustomSelect
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                  options={[
                    { value: 'belum_bekerja', label: 'Belum Bekerja' },
                    { value: 'bekerja', label: 'Bekerja' },
                    { value: 'wirausaha', label: 'Wirausaha' },
                    { value: 'melanjutkan_studi', label: 'Lanjut Studi' }
                  ]}
                  placeholder="Semua Status"
                />
              </div>

              {/* IPK Minimum */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">IPK Min</label>
                <CustomSelect
                  value={filters.minIpk}
                  onChange={(e) => setFilters(f => ({ ...f, minIpk: e.target.value }))}
                  options={[
                    { value: '3.5', label: '3.50 ke atas' },
                    { value: '3.0', label: '3.00 ke atas' },
                    { value: '2.75', label: '2.75 ke atas' },
                    { value: '2.5', label: '2.50 ke atas' }
                  ]}
                  placeholder="Semua IPK"
                />
              </div>

              {/* Angkatan */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Angkatan</label>
                <CustomSelect
                  value={filters.angkatan}
                  onChange={(e) => setFilters(f => ({ ...f, angkatan: e.target.value }))}
                  options={angkatanOptions.map(a => ({ value: a, label: a }))}
                  placeholder="Semua Angkatan"
                />
              </div>

              {/* Open to Work */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Preferensi</label>
                <button
                  onClick={() => setFilters(f => ({ ...f, openToWork: !f.openToWork }))}
                  className={`w-full input-warm flex items-center justify-center font-bold transition-all border ${
                    filters.openToWork
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-500/10'
                      : 'text-secondary opacity-70'
                  }`}
                >
                  <span className="text-xs">✅ Open to Work</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleApplyFilters}
                className="px-8 py-3 bg-brand-primary hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                Terapkan Filter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {appliedFilters.fakultasId && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
              Fakultas: {fakultasList.find(f => f.id === appliedFilters.fakultasId)?.nama || 'Fakultas'}
              <button onClick={() => { 
                setFilters(f => ({...f, fakultasId: '', prodi: ''})); 
                setAppliedFilters(f => ({...f, fakultasId: '', prodi: ''})); 
              }}>
                <X size={12} />
              </button>
            </span>
          )}
          {appliedFilters.prodi && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
              Prodi: {appliedFilters.prodi}
              <button onClick={() => { setFilters(f => ({...f, prodi: ''})); setAppliedFilters(f => ({...f, prodi: ''})); }}>
                <X size={12} />
              </button>
            </span>
          )}
          {appliedFilters.status && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
              Status: {STATUS_LABELS[appliedFilters.status]?.label}
              <button onClick={() => { setFilters(f => ({...f, status: ''})); setAppliedFilters(f => ({...f, status: ''})); }}>
                <X size={12} />
              </button>
            </span>
          )}
          {appliedFilters.minIpk && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
              IPK ≥ {appliedFilters.minIpk}
              <button onClick={() => { setFilters(f => ({...f, minIpk: ''})); setAppliedFilters(f => ({...f, minIpk: ''})); }}>
                <X size={12} />
              </button>
            </span>
          )}
          {appliedFilters.angkatan && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
              Angkatan: {appliedFilters.angkatan}
              <button onClick={() => { setFilters(f => ({...f, angkatan: ''})); setAppliedFilters(f => ({...f, angkatan: ''})); }}>
                <X size={12} />
              </button>
            </span>
          )}
          {appliedFilters.openToWork && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
              Open to Work
              <button onClick={() => { setFilters(f => ({...f, openToWork: false})); setAppliedFilters(f => ({...f, openToWork: false})); }}>
                <X size={12} />
              </button>
            </span>
          )}
          {appliedFilters.onlyBookmarked && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">
              Hanya Bookmark
              <button onClick={() => { setFilters(f => ({...f, onlyBookmarked: false})); setAppliedFilters(f => ({...f, onlyBookmarked: false})); }}>
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Alumni Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 mb-4" />
              <div className="h-4 bg-slate-100 rounded-lg w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded-lg w-1/2 mb-4" />
              <div className="h-3 bg-slate-100 rounded-lg w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
            </div>
          ))}
        </div>
      ) : alumni.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-slate-300" />
          </div>
          <p className="font-black text-slate-700 text-lg">Tidak ada alumni ditemukan</p>
          <p className="text-slate-400 text-sm mt-2">Coba ubah filter atau kata kunci pencarian</p>
          <button onClick={handleResetFilters} className="mt-4 px-5 py-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Reset filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {alumni.map((a, i) => {
            const statusInfo = STATUS_LABELS[a.pekerjaan_status];
            const skills = (() => {
              try { return JSON.parse(a.keahlian || '[]'); } catch { return []; }
            })();

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-surface border border-border-subtle rounded-[2.5rem] p-6 hover:shadow-2xl hover:shadow-blue-500/10 hover:ring-2 hover:ring-brand-primary/50 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col sm:flex-row gap-8 items-center sm:items-start"
              >
                {/* Decorative Pattern Background */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-brand-primary/[0.02] rounded-full -mr-16 -mt-16 group-hover:bg-brand-primary/[0.05] transition-colors duration-700" />

                {/* Left Side: Photo Section */}
                <div className="relative flex-shrink-0">
                  <div className="w-32 h-40 rounded-[2.2rem] bg-main p-1 border-2 border-border-subtle group-hover:border-brand-primary/30 transition-all duration-500 overflow-hidden shadow-sm group-hover:scale-[1.02]">
                    {a.gambar ? (
                      <img 
                        src={pb.files.getUrl(a, a.gambar)} 
                        alt={a.nama} 
                        className="w-full h-full object-cover rounded-[2rem]" 
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-4xl font-black">
                        {a.nama?.charAt(0) || 'A'}
                      </div>
                    )}
                  </div>
                  
                  {/* Status Badge Over Photo */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {statusInfo ? (
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] shadow-lg border ${
                        a.pekerjaan_status === 'bekerja' ? 'bg-emerald-500 text-white border-emerald-400' :
                        a.pekerjaan_status === 'wirausaha' ? 'bg-violet-500 text-white border-violet-400' :
                        a.pekerjaan_status === 'melanjutkan_studi' ? 'bg-blue-500 text-white border-blue-400' :
                        'bg-amber-500 text-white border-amber-400'
                      }`}>
                        {statusInfo.label}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Right Side: Information Section */}
                <div className="flex-1 min-w-0 flex flex-col h-full py-1">
                  {/* Name & Basic Info */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-black text-primary text-xl tracking-tight leading-tight group-hover:text-brand-primary transition-colors truncate">
                        {a.nama}
                      </h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBookmark(a.id); }}
                        disabled={bookmarkLoading.has(a.id)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 border flex-shrink-0 ${
                          bookmarked.has(a.id) 
                            ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-blue-500/20' 
                            : 'bg-main text-secondary opacity-30 hover:opacity-100 hover:text-brand-primary border-border-subtle'
                        }`}
                      >
                        {bookmarkLoading.has(a.id) ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Bookmark size={16} fill={bookmarked.has(a.id) ? "currentColor" : "none"} />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] font-black text-secondary opacity-40 uppercase tracking-[0.25em] mt-0.5">
                      {a.nim}
                    </p>
                  </div>

                  {/* Academic Stats Row */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                        <GraduationCap size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-secondary opacity-40 uppercase tracking-widest leading-none mb-1">Prodi / Angkatan</p>
                        <p className="text-[11px] font-bold text-primary truncate">
                          {a.prodi || '-'} <span className="text-brand-primary opacity-40 ml-1">'{String(a.angkatan || '').slice(-2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-amber-500/5 flex items-center justify-center text-amber-500">
                        <Star size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-secondary opacity-40 uppercase tracking-widest leading-none mb-1">Indeks Prestasi</p>
                        <p className="text-[12px] font-black text-primary">{Number(a.ipk || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="mt-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="px-2.5 py-1.5 bg-main rounded-xl border border-border-subtle flex items-center gap-2">
                        <Briefcase size={12} className="text-brand-primary opacity-50" />
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Keahlian:</p>
                      </div>
                      {skills.length > 0 ? (
                        skills.slice(0, 3).map(skill => (
                          <span key={skill} className="px-3 py-1.5 bg-surface border border-border-subtle text-primary text-[10px] font-bold rounded-xl group-hover:border-brand-primary/30 transition-colors">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] italic text-secondary opacity-30">Belum ada data keahlian</span>
                      )}
                      {skills.length > 3 && (
                        <span className="text-[10px] font-black text-brand-primary bg-brand-primary/5 px-2 py-1 rounded-lg">
                          +{skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Open to Work & Location Footer */}
                  <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {a.kota && (
                        <div className="flex items-center gap-1.5 text-secondary opacity-50 font-bold text-[10px] uppercase tracking-wider">
                          <MapPin size={12} />
                          {a.kota}
                        </div>
                      )}
                      {a.is_open_to_work && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                          Ready to Hire
                        </span>
                      )}
                    </div>
                    
                    <Link 
                      to={`/industri/alumni/${a.id}`}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary opacity-30 hover:opacity-100 hover:text-brand-primary transition-all group/link"
                    >
                      Profil Lengkap
                      <ExternalLink size={12} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-slate-400 font-medium">
            Halaman {page} dari {totalPages} ({total} alumni)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchAlumni(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={() => fetchAlumni(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
