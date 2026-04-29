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
import { useAuthStore } from '../store/authStore';

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
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isIndustri = user?.role === 'industri';

  const [alumni, setAlumni] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState([-2.5489, 118.0149]);
  const [zoom, setZoom] = useState(5);
  
  // UI States
  const [activeTab, setActiveTab] = useState('Alumni'); // 'Alumni', 'Lowongan'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alumniRecords, jobRecords] = await Promise.all([
          pb.collection('alumni').getFullList({ 
            autoCancel: false,
            fields: 'id,nama,nim,provinsi,kota,status_kerja,tahun_lulus'
          }),
          pb.collection('job_postings').getFullList({
            autoCancel: false,
            expand: 'company',
            filter: 'status="Aktif"'
          })
        ]);
        
        const processedAlumni = alumniRecords.map(a => {
          const rawCoords = getCoordinates(a.provinsi, a.kota);
          const jitterLat = (Math.random() - 0.5) * 0.025;
          const jitterLng = (Math.random() - 0.5) * 0.025;
          return {
            ...a,
            coords: { lat: rawCoords.lat + jitterLat, lng: rawCoords.lng + jitterLng }
          };
        });
        
        const processedJobs = jobRecords.map(j => {
          const rawCoords = getCoordinates(j.lokasi, '');
          const jitterLat = (Math.random() - 0.5) * 0.025;
          const jitterLng = (Math.random() - 0.5) * 0.025;
          return {
            ...j,
            coords: { lat: rawCoords.lat + jitterLat, lng: rawCoords.lng + jitterLng }
          };
        });

        setAlumni(processedAlumni);
        setJobs(processedJobs);
      } catch (err) {
        console.error("Gagal ambil data peta:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAlumni = useMemo(() => alumni.filter(a => 
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.kota?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [alumni, searchTerm]);

  const filteredJobs = useMemo(() => jobs.filter(j => 
      j.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.expand?.company?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.lokasi?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [jobs, searchTerm]);

  // Top Regions based on Active Tab
  const topRegions = useMemo(() => {
    if (activeTab === 'Alumni') {
      const counts = alumni.reduce((acc, curr) => {
        const prov = curr.provinsi || 'Lainnya';
        acc[prov] = (acc[prov] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    } else {
      const counts = jobs.reduce((acc, curr) => {
        const loc = curr.lokasi ? curr.lokasi.split(',')[0].trim() : 'Lainnya';
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }
  }, [alumni, jobs, activeTab]);

  const handleFocusRegion = (name) => {
    setMapCenter(getCoordinates(name, ''));
    setZoom(10);
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-700 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Peta Distribusi</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            Titik sebaran alumni dan lowongan kerja.
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

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
        
        {/* Side Panel */}
        <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col gap-4 animate-in fade-in slide-in-from-left-4">
             {/* Filter Toggle */}
             <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex items-center">
               {['Alumni', 'Lowongan'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   {tab}
                 </button>
               ))}
             </div>
             
             {/* Stats Cards */}
             <div className="grid grid-cols-2 gap-3">
               <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={12} className="text-blue-500"/> Alumni</p>
                 <p className="text-2xl font-black text-slate-900 mt-1">{alumni.length}</p>
               </div>
               <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><Briefcase size={12}/> Lowongan</p>
                 <p className="text-2xl font-black text-emerald-700 mt-1">{jobs.length}</p>
               </div>
             </div>

             {/* Top Regions */}
             <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin size={14} className="text-blue-500" /> 
                  {activeTab === 'Alumni' ? '5 Provinsi Teratas' : '5 Daerah Teratas'}
                </h3>
                <div className="space-y-1">
                  {topRegions.length > 0 ? topRegions.map(([name, count]) => (
                    <div 
                      key={name}
                      className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2.5 -mx-2.5 rounded-xl transition-colors"
                      onClick={() => handleFocusRegion(name)}
                    >
                       <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{name}</span>
                       <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{count}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 font-medium py-2">Data belum tersedia.</p>
                  )}
                </div>
             </div>
           </div>

        {/* Map Container */}
        <div className="w-full flex flex-col h-[500px] lg:h-[calc(100vh-220px)] min-h-[500px] bg-white p-1.5 md:p-2 rounded-[1.5rem] md:rounded-[2.5rem] shadow-soft border border-slate-100 relative z-0 flex-1">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-4 rounded-[1.2rem] md:rounded-[2rem]">
               <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
               <p className="text-xs md:text-sm text-slate-400 font-medium animate-pulse">Memetakan lokasi data...</p>
            </div>
          ) : (
            <div className="flex-1 w-full relative bg-slate-50 rounded-[1.2rem] md:rounded-[2rem] overflow-hidden">
              <MapContainer 
                center={mapCenter} 
                zoom={zoom} 
                scrollWheelZoom={true} 
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <ChangeView center={mapCenter} zoom={zoom} />
                <TileLayer
                  attribution='&copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                {activeTab === 'Alumni' && (
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
                            onClick={() => window.open(isAdmin ? `/admin/alumni/${person.id}` : isIndustri ? `/industri/alumni/${person.id}` : `/alumni/${person.id}`, '_self')}
                            className="w-full mt-4 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                          >
                             Detail Alumni <Navigation size={12} />
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  </MarkerClusterGroup>
                )}

                {activeTab === 'Lowongan' && (
                  <MarkerClusterGroup 
                    chunkedLoading
                    iconCreateFunction={(cluster) => {
                      return L.divIcon({
                        html: `<div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 px-5 py-2 bg-emerald-600 text-white rounded-full flex gap-1.5 items-center justify-center shadow-xl shadow-emerald-500/40 border-[3px] border-white whitespace-nowrap w-max backdrop-blur-sm">
                                 <span class="text-emerald-100 text-[9px] uppercase font-black tracking-widest mt-0.5">Sekitar</span>
                                 <span class="text-sm font-black">${cluster.getChildCount()}</span>
                                 <span class="text-emerald-100 text-[9px] uppercase font-black tracking-widest mt-0.5">Lowongan</span>
                               </div>`,
                        className: 'custom-marker-cluster bg-transparent border-0',
                        iconSize: L.point(0, 0)
                      });
                    }}
                  >
                    {filteredJobs.map(job => (
                      <Marker 
                        key={job.id} 
                        position={[job.coords.lat, job.coords.lng]}
                      >
                        <Popup className="custom-popup">
                        <div className="p-3 min-w-[200px]">
                          <div className="flex items-center gap-3 mb-3">
                             <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                               <Briefcase size={20} />
                             </div>
                             <div>
                                <p className="font-bold text-slate-900 leading-tight truncate max-w-[140px]">{job.judul}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[140px]">{job.expand?.company?.nama || 'Perusahaan'}</p>
                             </div>
                          </div>
                          
                          <div className="space-y-2 border-t border-slate-50 pt-3">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                               <MapPin size={14} className="text-red-400" />
                               <span className="font-medium truncate max-w-[150px] block">{job.lokasi}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                               <Briefcase size={14} className="text-emerald-400" />
                               <span className="font-medium">{job.tipe_kerja}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => window.open(isAdmin || isIndustri ? `/industri/lowongan?jobId=${job.id}` : `/lowongan?jobId=${job.id}`, '_self')}
                            className="w-full mt-4 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                          >
                             Lihat Lowongan <Navigation size={12} />
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  </MarkerClusterGroup>
                )}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
