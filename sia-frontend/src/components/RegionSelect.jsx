import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RegionSelect({ formData, handleChange, isIndonesia }) {
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingReg, setLoadingReg] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingVill, setLoadingVill] = useState(false);

  // States to hold the selected IDs from API to fetch the next levels
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedRegId, setSelectedRegId] = useState('');
  const [selectedDistId, setSelectedDistId] = useState('');

  // 1. Fetch Provinces
  useEffect(() => {
    if (isIndonesia) {
      setLoadingProv(true);
      fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
        .then(res => res.json())
        .then(data => setProvinces(data))
        .catch(err => console.error(err))
        .finally(() => setLoadingProv(false));
    }
  }, [isIndonesia]);

  // 2. Fetch Regencies when Province changes
  useEffect(() => {
    if (selectedProvId) {
      setLoadingReg(true);
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
        .then(res => res.json())
        .then(data => setRegencies(data))
        .catch(err => console.error(err))
        .finally(() => setLoadingReg(false));
      
      // Reset child regions when parent changes
      setDistricts([]);
      setVillages([]);
    }
  }, [selectedProvId]);

  // 3. Fetch Districts when Regency changes
  useEffect(() => {
    if (selectedRegId) {
      setLoadingDist(true);
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedRegId}.json`)
        .then(res => res.json())
        .then(data => setDistricts(data))
        .catch(err => console.error(err))
        .finally(() => setLoadingDist(false));
      
      setVillages([]);
    }
  }, [selectedRegId]);

  // 4. Fetch Villages when District changes
  useEffect(() => {
    if (selectedDistId) {
      setLoadingVill(true);
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistId}.json`)
        .then(res => res.json())
        .then(data => setVillages(data))
        .catch(err => console.error(err))
        .finally(() => setLoadingVill(false));
    }
  }, [selectedDistId]);

  // Handlers to update the form data with NAMES and internal states with IDs
  const handleProvChange = (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const id = selectedOption.getAttribute('data-id');
    const name = selectedOption.value;
    
    setSelectedProvId(id);
    setSelectedRegId('');
    setSelectedDistId('');

    // Update parent formData
    handleChange({ target: { name: 'provinsi', value: name } });
    handleChange({ target: { name: 'kota', value: '' } });
    handleChange({ target: { name: 'kecamatan', value: '' } });
    handleChange({ target: { name: 'kelurahan', value: '' } });
  };

  const handleRegChange = (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const id = selectedOption.getAttribute('data-id');
    const name = selectedOption.value;
    
    setSelectedRegId(id);
    setSelectedDistId('');

    handleChange({ target: { name: 'kota', value: name } });
    handleChange({ target: { name: 'kecamatan', value: '' } });
    handleChange({ target: { name: 'kelurahan', value: '' } });
  };

  const handleDistChange = (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const id = selectedOption.getAttribute('data-id');
    const name = selectedOption.value;
    
    setSelectedDistId(id);

    handleChange({ target: { name: 'kecamatan', value: name } });
    handleChange({ target: { name: 'kelurahan', value: '' } });
  };

  const handleVillChange = (e) => {
    handleChange(e);
  };

  if (!isIndonesia) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2 mb-4 w-full">
        <TextInput name="provinsi" label="Provinsi / State" value={formData.provinsi} onChange={handleChange} />
        <TextInput name="kota" label="Kota / Regency" value={formData.kota} onChange={handleChange} />
        <TextInput name="kecamatan" label="Kecamatan / District" value={formData.kecamatan} onChange={handleChange} />
        <TextInput name="kelurahan" label="Kelurahan / Sub-district" value={formData.kelurahan} onChange={handleChange} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
          Provinsi {loadingProv && <Loader2 size={10} className="animate-spin" />}
        </label>
        <select 
          name="provinsi" 
          value={formData.provinsi} 
          onChange={handleProvChange}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 bg-white"
        >
          <option value="">Pilih Provinsi</option>
          {provinces.map(prov => (
            <option key={prov.id} data-id={prov.id} value={prov.name}>{prov.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
          Kota/Kab {loadingReg && <Loader2 size={10} className="animate-spin" />}
        </label>
        <select 
          name="kota" 
          value={formData.kota} 
          onChange={handleRegChange}
          disabled={!selectedProvId}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 bg-white disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">Pilih Kota/Kab</option>
          {regencies.map(reg => (
            <option key={reg.id} data-id={reg.id} value={reg.name}>{reg.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
          Kecamatan {loadingDist && <Loader2 size={10} className="animate-spin" />}
        </label>
        <select 
          name="kecamatan" 
          value={formData.kecamatan || ''} 
          onChange={handleDistChange}
          disabled={!selectedRegId}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 bg-white disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">Pilih Kecamatan</option>
          {districts.map(dist => (
            <option key={dist.id} data-id={dist.id} value={dist.name}>{dist.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
          Kelurahan/Desa {loadingVill && <Loader2 size={10} className="animate-spin" />}
        </label>
        <select 
          name="kelurahan" 
          value={formData.kelurahan} 
          onChange={handleVillChange}
          disabled={!selectedDistId}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 bg-white disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">Pilih Kelurahan</option>
          {villages.map(vill => (
            <option key={vill.id} value={vill.name}>{vill.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TextInput({ name, label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      <input 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400" 
      />
    </div>
  );
}
