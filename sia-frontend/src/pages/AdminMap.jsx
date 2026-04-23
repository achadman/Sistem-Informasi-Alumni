import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { pb } from '../lib/pb';
import L from 'leaflet';
import { getCoordinates } from '../lib/geoData';
import { 
  Users, 
  MapPin, 
  Search, 
  Briefcase, 
  GraduationCap, 
  Navigation,
  Info 
} from 'lucide-react';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to center map
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function AdminMap() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState([-2.5489, 118.0149]);
  const [zoom, setZoom] = useState(5);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        // Disable autoCancel to prevent request being aborted on fast re-renders
        // Use 'fields' to dramatically slice data payload payload bytes (Data Stripping)
        const records = await pb.collection('alumni').getFullList({ 
          autoCancel: false,
          fields: 'id,nama,nim,provinsi,kota,status_kerja,tahun_lulus'
        });
        
        // Map records to include coordinates and micro jitter
        const processed = records.map(a => {
          const rawCoords = getCoordinates(a.provinsi, a.kota);
          
          // Inject micro-jitter (~2.5km scatter) across exact same cities
          const jitterLat = (Math.random() - 0.5) * 0.025;
          const jitterLng = (Math.random() - 0.5) * 0.025;
          
          return {
            ...a,
            coords: {
              lat: rawCoords.lat + jitterLat,
              lng: rawCoords.lng + jitterLng
            }
          };
        });
        
        setAlumni(processed);
      } catch (err) {
        console.error("Gagal ambil data peta:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  // Filtered alumni based on search
  const filteredAlumni = useMemo(() => {
    return alumni.filter(a => 
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.kota?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [alumni, searchTerm]);

  // Top 3 Provinces for Stats Overlay
  const topProvinces = useMemo(() => {
    const counts = alumni.reduce((acc, curr) => {
      const prov = curr.provinsi || 'Lainnya';
      acc[prov] = (acc[prov] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [alumni]);

  const handleFocusAlumni = (coords) => {
    setMapCenter([coords.lat, coords.lng]);
    setZoom(10);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Peta Distribusi Alumni</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            Titik sebaran alumni di seluruh Indonesia.
          </p>
        </div>

        <div className="relative group w-full lg:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama atau kota..." 
            className="pl-11 pr-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm w-full outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white p-1.5 md:p-2 rounded-[1.5rem] md:rounded-[2.5rem] shadow-soft border border-slate-100 flex-1 min-h-[450px] md:min-h-[600px] overflow-hidden relative z-0">
        {loading ? (
          <div className="w-full h-[450px] md:h-[600px] flex flex-col items-center justify-center bg-slate-50 gap-4 rounded-[1.2rem] md:rounded-[2rem]">
             <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="text-xs md:text-sm text-slate-400 font-medium animate-pulse">Memetakan lokasi alumni...</p>
          </div>
        ) : (
          <>
            <div className="h-[450px] md:h-[600px] w-full">
              <MapContainer 
                center={mapCenter} 
                zoom={zoom} 
                scrollWheelZoom={true} 
                className="w-full h-full rounded-[2rem]"
              >
                <ChangeView center={mapCenter} zoom={zoom} />
                <TileLayer
                  attribution='&copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                <MarkerClusterGroup 
                  chunkedLoading
                  iconCreateFunction={(cluster) => {
                    return L.divIcon({
                      html: `<div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 px-5 py-2 bg-blue-600 text-white rounded-full flex gap-1.5 items-center justify-center shadow-xl shadow-blue-500/40 border-[3px] border-white whitespace-nowrap w-max backdrop-blur-sm">
                               <span class="text-blue-100 text-[9px] uppercase font-black tracking-widest mt-0.5">Sekitar</span>
                               <span class="text-sm font-black">${cluster.getChildCount()}</span>
                               <span class="text-blue-100 text-[9px] uppercase font-black tracking-widest mt-0.5">Alumni</span>
                             </div>`,
                      className: 'custom-marker-cluster bg-transparent border-0',
                      iconSize: L.point(0, 0)
                    });
                  }}
                >
                  {filteredAlumni.map(person => (
                    <Marker 
                      key={person.id} 
                      position={[person.coords.lat, person.coords.lng]}
                    >
                      <Popup className="custom-popup">
                      <div className="p-3 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-3">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                             {person.nama.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 leading-tight">{person.nama}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{person.nim}</p>
                           </div>
                        </div>
                        
                        <div className="space-y-2 border-t border-slate-50 pt-3">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                             <Briefcase size={14} className="text-blue-400" />
                             <span className="font-medium text-slate-800">{person.status_kerja || 'Belum Bekerja'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                             <MapPin size={14} className="text-red-400" />
                             <span className="font-medium">{person.kota}, {person.provinsi}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                             <GraduationCap size={14} className="text-emerald-400" />
                             <span className="font-medium">Lulusan {person.tahun_lulus}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => window.open(`/admin/alumni/${person.id}`, '_self')}
                          className="w-full mt-4 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                           Detail Alumni <Navigation size={12} />
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                </MarkerClusterGroup>
              </MapContainer>
            </div>

            {/* Floating Stats Panel - Hidden on mobile, shown on lg screens */}
            <div className="hidden lg:block absolute top-8 right-8 z-[1000] w-64 space-y-4 pointer-events-none text-left">
               <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-2xl pointer-events-auto">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={14} className="text-blue-500" /> Ringkasan Sebaran
                  </h3>
                  
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">Total di Peta</span>
                        <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-blue-100">
                          {alumni.length} Jiwa
                        </span>
                     </div>
                     
                     <div className="border-t border-slate-100 pt-4 space-y-3">
                        {topProvinces.map(([name, count]) => (
                          <div 
                            key={name}
                            className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform"
                            onClick={() => handleFocusAlumni(getCoordinates(name))}
                          >
                             <span className="text-xs font-medium text-slate-500">{name}</span>
                             <span className="text-xs font-bold text-slate-800">{count} Alumni</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="bg-blue-600/90 backdrop-blur-md p-4 rounded-3xl border border-blue-400/30 shadow-xl pointer-events-auto">
                  <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Status Kepadatan</p>
                  <h4 className="text-white font-bold text-sm">Distribusi Utama</h4>
                  <div className="w-full h-1.5 bg-blue-800/50 rounded-full mt-3 overflow-hidden">
                     <div className="w-3/4 h-full bg-white rounded-full"></div>
                  </div>
               </div>
            </div>

            {/* Mobile Stats Summary - Shown only on small screens */}
            <div className="lg:hidden mt-4 grid grid-cols-2 gap-3">
               <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Alumni</p>
                  <p className="text-xl font-black text-slate-900">{alumni.length}</p>
               </div>
               <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-100">
                  <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Wilayah Utama</p>
                  <p className="text-sm font-bold text-white truncate">{topProvinces[0]?.[0] || 'N/A'}</p>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
