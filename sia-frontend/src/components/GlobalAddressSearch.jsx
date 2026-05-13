import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Check, AlertCircle, ChevronRight } from 'lucide-react';
import { pb } from '../lib/pb';

export default function GlobalAddressSearch({ onSelect, placeholder = "Ketik alamat (misal: Sukapura)...", valueDisplay = "" }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(valueDisplay);
  }, [valueDisplay]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = async (q) => {
    if (q.length < 3) return;
    setLoading(true);
    try {
      // 1. Search villages
      const villageRecords = await pb.collection('villages').getList(1, 8, {
        filter: `name ~ "${q}"`,
        sort: 'name',
      });

      if (villageRecords.items.length === 0) {
        setResults([]);
        return;
      }

      // 2. Resolve parents for each village
      // To minimize requests, we'll collect all parent IDs
      const districtIds = [...new Set(villageRecords.items.map(v => v.parent_id))];
      const districts = await pb.collection('districts').getList(1, 50, {
        filter: districtIds.map(id => `id_wilayah = "${id}"`).join(' || ')
      });

      const regencyIds = [...new Set(districts.items.map(d => d.parent_id))];
      const regencies = await pb.collection('regencies').getList(1, 50, {
        filter: regencyIds.map(id => `id_wilayah = "${id}"`).join(' || ')
      });

      const provinceIds = [...new Set(regencies.items.map(r => r.parent_id))];
      const provinces = await pb.collection('provinces').getList(1, 50, {
        filter: provinceIds.map(id => `id_wilayah = "${id}"`).join(' || ')
      });

      // 3. Construct full address strings
      const fullResults = villageRecords.items.map(v => {
        const dist = districts.items.find(d => d.id_wilayah === v.parent_id);
        const reg = dist ? regencies.items.find(r => r.id_wilayah === dist.parent_id) : null;
        const prov = reg ? provinces.items.find(p => p.id_wilayah === reg.parent_id) : null;

        return {
          ...v,
          district: dist?.name || '',
          regency: reg?.name || '',
          province: prov?.name || '',
          fullText: `${v.name}, ${dist?.name || ''}, ${reg?.name || ''}, ${prov?.name || ''}`
        };
      });

      setResults(fullResults);
    } catch (err) {
      console.error('SearchAddress error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query || query === valueDisplay) return;
    
    const timer = setTimeout(() => {
      searchAddress(query);
    }, 800); // Wait for a moment as requested

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    setQuery(item.fullText);
    setIsOpen(false);
    onSelect(item);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative group">
        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-30 group-focus-within:text-brand-primary group-focus-within:opacity-100 transition-all" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 bg-main border border-border-subtle rounded-2xl text-primary placeholder:text-secondary/30 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all font-bold text-sm shadow-sm"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin text-brand-primary" />}
          {query && !loading && (
            <button 
              onClick={() => { setQuery(''); setResults([]); onSelect(null); }}
              className="text-secondary opacity-30 hover:opacity-100 font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-elevated border border-border-subtle rounded-[2rem] shadow-premium max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200 p-2">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full p-4 text-left hover:bg-brand-primary/5 rounded-2xl transition-all flex items-start gap-4 group border-b border-border-subtle/30 last:border-0"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-main flex items-center justify-center text-secondary opacity-40 group-hover:bg-brand-primary group-hover:text-white group-hover:opacity-100 transition-all">
                <MapPin size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-primary group-hover:text-brand-primary transition-colors uppercase truncate">
                  {item.name}
                </p>
                <p className="text-[10px] font-bold text-secondary opacity-60 uppercase tracking-widest mt-1">
                  {item.district}, {item.regency}
                </p>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-black bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full uppercase">
                    {item.province}
                  </span>
                  <ChevronRight size={10} className="text-brand-primary" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !loading && query.length >= 3 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-elevated border border-border-subtle rounded-2xl p-8 text-center shadow-premium animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={32} className="mx-auto mb-3 text-secondary opacity-20" />
          <p className="text-xs font-black text-secondary opacity-50 uppercase tracking-widest">
            Alamat tidak ditemukan
          </p>
        </div>
      )}
    </div>
  );
}
