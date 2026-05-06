import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin, Check, AlertCircle } from 'lucide-react';
import { pb } from '../lib/pb';

export default function AutocompleteSearch({ 
  collection, 
  placeholder = "Cari atau pilih...", 
  label, 
  onSelect,
  extraFilter = "",
  disabled = false,
  valueDisplay = "",
  direction = "down"
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update query when valueDisplay prop changes (e.g., controlled by parent selection)
  useEffect(() => {
    setQuery(valueDisplay);
  }, [valueDisplay]);

  useEffect(() => {
    // If the component is closed and the user isn't actively interacting, we can skip fetching
    // However, if we want it to fetch on focus, we handle that in the input's onFocus.
  }, []);

  const fetchOptions = async (currentQuery) => {
    // If the database is potentially huge (villages), we might want to restrict empty searches
    // but for provinces/regencies, it's better to show initial options.
    const isLargeCollection = collection === 'villages';
    
    setLoading(true);
    setFetchError(false);
    try {
      let combinedFilter = '';
      
      // If there is text, use it as a search filter
      if (currentQuery.trim()) {
         let nameFilter = `name ~ "${currentQuery.replace(/"/g, '\\"')}"`;
         let idFilter = `id_wilayah ~ "${currentQuery.replace(/"/g, '\\"')}"`;
         combinedFilter = `(${nameFilter} || ${idFilter})`;
      }

      // Add parent filter (e.g. province_id) if present
      if (extraFilter) {
        combinedFilter = combinedFilter ? `(${extraFilter}) && ${combinedFilter}` : extraFilter;
      }

      // If it's a huge collection and we have NO filter yet, don't fetch all (safety)
      if (isLargeCollection && !combinedFilter && !currentQuery) {
        setResults([]);
        setLoading(false);
        return;
      }

      const records = await pb.collection(collection).getList(1, 100, {
        filter: combinedFilter,
        sort: 'name',
        requestKey: null, // Ensure request is not cancelled when multiple components mount
      });
      
      setResults(records.items);
    } catch (error) {
      if (!error.isAbort) {
         console.error(`Autocomplete fetch error [${collection}]: `, error);
         setFetchError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchOptions(query);
    }, 200); // Faster response: 200ms debounce

    return () => clearTimeout(timer);
  }, [query, collection, extraFilter, isOpen]);

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    onSelect(item);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelect(null);
  };

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={wrapperRef}>
      {label && <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) handleClear();
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all text-sm font-medium disabled:bg-slate-100 placeholder:text-slate-300"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={16} />
        ) : query ? (
          <button 
            type="button" 
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all font-bold text-xs"
          >
            ×
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div className={`absolute z-50 w-full ${direction === 'up' ? 'bottom-full mb-2' : 'mt-2'} bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-h-72 overflow-y-auto overflow-hidden animate-in fade-in ${direction === 'up' ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} duration-200`}>
          {loading ? (
             <div className="p-10 text-center text-sm text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
                <p className="font-bold">Mencari data...</p>
             </div>
          ) : fetchError ? (
            <div className="p-8 text-center">
               <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
               <p className="text-sm font-black text-red-600">Gagal Mengambil Data</p>
               <p className="text-[10px] text-slate-400 mt-1 italic">Pastikan koneksi internet stabil</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400 flex flex-col items-center gap-3">
               <AlertCircle size={28} className="text-slate-200" />
               <span className="font-bold">Data tidak ditemukan</span>
            </div>
          ) : (
            <div className="py-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-6 py-4.5 text-left hover:bg-blue-50/50 transition-all flex items-center gap-4 border-b border-slate-50 last:border-b-0 group active:bg-blue-100"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-slate-700 truncate group-hover:text-blue-700 transition-colors uppercase">
                      {item.name}
                    </p>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5 group-hover:text-blue-300">
                      Wilayah Terverifikasi
                    </p>
                  </div>
                  <Check size={18} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
