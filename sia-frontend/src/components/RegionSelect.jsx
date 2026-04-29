import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import AutocompleteSearch from './AutocompleteSearch';

export default function RegionSelect({ formData, handleChange, isIndonesia, direction = "down" }) {
  // We maintain local IDs for cascading filters 
  // (Note: AddAlumniModal only saves names to db, but we need IDs to query Pocketbase correctly)
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedRegId, setSelectedRegId] = useState('');
  const [selectedDistId, setSelectedDistId] = useState('');

  const handleProvSelect = (item) => {
    if (!item) {
      setSelectedProvId('');
      setSelectedRegId('');
      setSelectedDistId('');
      handleChange({ target: { name: 'provinsi', value: '' } });
      handleChange({ target: { name: 'kota_kabupaten', value: '' } });
      handleChange({ target: { name: 'kecamatan', value: '' } });
      handleChange({ target: { name: 'kelurahan', value: '' } });
      return;
    }
    
    setSelectedProvId(item.id_wilayah);
    setSelectedRegId('');
    setSelectedDistId('');

    handleChange({ target: { name: 'provinsi', value: item.name } });
    handleChange({ target: { name: 'kota_kabupaten', value: '' } });
    handleChange({ target: { name: 'kecamatan', value: '' } });
    handleChange({ target: { name: 'kelurahan', value: '' } });
  };

  const handleRegSelect = (item) => {
    if (!item) {
      setSelectedRegId('');
      setSelectedDistId('');
      handleChange({ target: { name: 'kota_kabupaten', value: '' } });
      handleChange({ target: { name: 'kecamatan', value: '' } });
      handleChange({ target: { name: 'kelurahan', value: '' } });
      return;
    }

    setSelectedRegId(item.id_wilayah);
    setSelectedDistId('');

    handleChange({ target: { name: 'kota_kabupaten', value: item.name } });
    handleChange({ target: { name: 'kecamatan', value: '' } });
    handleChange({ target: { name: 'kelurahan', value: '' } });
  };

  const handleDistSelect = (item) => {
    if (!item) {
      setSelectedDistId('');
      handleChange({ target: { name: 'kecamatan', value: '' } });
      handleChange({ target: { name: 'kelurahan', value: '' } });
      return;
    }

    setSelectedDistId(item.id_wilayah);
    handleChange({ target: { name: 'kecamatan', value: item.name } });
    handleChange({ target: { name: 'kelurahan', value: '' } });
  };

  const handleVillSelect = (item) => {
    if (!item) {
      handleChange({ target: { name: 'kelurahan', value: '' } });
      return;
    }
    handleChange({ target: { name: 'kelurahan', value: item.name } });
    
    // Auto clear RT/RW when village changes to encourage re-eval
    handleChange({ target: { name: 'rt', value: '' } });
    handleChange({ target: { name: 'rw', value: '' } });
  };

  if (!isIndonesia) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2 mb-4 w-full animate-in fade-in">
        <TextInput name="provinsi" label="Provinsi / State" value={formData.provinsi} onChange={handleChange} />
        <TextInput name="kota_kabupaten" label="Kota / Regency" value={formData.kota_kabupaten} onChange={handleChange} />
        <TextInput name="kecamatan" label="Kecamatan / District" value={formData.kecamatan} onChange={handleChange} />
        <TextInput name="kelurahan" label="Kelurahan / Sub-district" value={formData.kelurahan} onChange={handleChange} />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full animate-in fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Provinsi */}
        <div className="w-full">
           <AutocompleteSearch 
             label="Provinsi"
             collection="provinces"
             placeholder="Cari atau pilih provinsi..."
             valueDisplay={formData.provinsi}
             onSelect={handleProvSelect}
             direction={direction}
           />
        </div>

        {/* Kota/Kab */}
        <div className="w-full">
           <AutocompleteSearch 
             label="Kota/Kab"
             collection="regencies"
             placeholder="Cari atau pilih kota/kab..."
             disabled={!selectedProvId && !formData.provinsi}
             extraFilter={selectedProvId ? `parent_id = "${selectedProvId}"` : ''}
             valueDisplay={formData.kota_kabupaten}
             onSelect={handleRegSelect}
             direction={direction}
           />
           {!formData.provinsi && <p className="text-[10px] text-slate-400 mt-1 italic">Pilih provinsi terlebih dahulu</p>}
        </div>

        {/* Kecamatan */}
        <div className="w-full">
           <AutocompleteSearch 
             label="Kecamatan"
             collection="districts"
             placeholder="Cari atau pilih kecamatan..."
             disabled={!selectedRegId && !formData.kota_kabupaten}
             extraFilter={selectedRegId ? `parent_id = "${selectedRegId}"` : ''}
             valueDisplay={formData.kecamatan}
             onSelect={handleDistSelect}
             direction={direction}
           />
           {!formData.kota_kabupaten && formData.provinsi && <p className="text-[10px] text-slate-400 mt-1 italic">Pilih kota terlebih dahulu</p>}
        </div>

        {/* Kelurahan */}
        <div className="w-full">
           <AutocompleteSearch 
             label="Kelurahan/Desa"
             collection="villages"
             placeholder="Cari atau pilih kelurahan/desa..."
             disabled={!selectedDistId && !formData.kecamatan}
             extraFilter={selectedDistId ? `parent_id = "${selectedDistId}"` : ''}
             valueDisplay={formData.kelurahan}
             onSelect={handleVillSelect}
             direction={direction}
           />
           {!formData.kecamatan && formData.kota_kabupaten && <p className="text-[10px] text-slate-400 mt-1 italic">Pilih kecamatan terlebih dahulu</p>}
        </div>
        
      </div>
    </div>
  );
}

function TextInput({ name, label, value, onChange }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 text-sm font-medium transition-all bg-slate-50" 
      />
    </div>
  );
}
