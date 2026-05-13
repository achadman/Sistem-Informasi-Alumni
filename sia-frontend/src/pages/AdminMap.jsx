import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  const searchInputRef = useRef(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState([-2.5489, 118.0149]);
  const [zoom, setZoom] = useState(5);
  const [activeTab, setActiveTab] = useState('Alumni');
  const [sideStats, setSideStats] = useState({ regions: [], workStatus: [] });
  const [counts, setCounts] = useState({ alumni: 0, jobs: 0 });

  // SEARCH STATE
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState('');

  const handleSearchTrigger = () => {
    if (searchInputRef.current) {
      setConfirmedSearchTerm(searchInputRef.current.value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchTrigger();
    }
  };
  
  // UI States

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [alumniCountRes, jobsCountRes, regionRes, workRes] = await Promise.all([
          pb.collection('alumni').getList(1, 1, { $autoCancel: false }),
          pb.collection('job_postings').getList(1, 1, { $autoCancel: false }),
          pb.collection('view_statistik_wilayah').getFullList({ $autoCancel: false }),
          pb.collection('view_statistik_kerja').getFullList({ $autoCancel: false })
        ]);

        const jobRecords = await pb.collection('job_postings').getFullList({
          expand: 'company',
          filter: 'status="Aktif"',
          $autoCancel: false
        });

        setCounts({
          alumni: alumniCountRes.totalItems,
          jobs: jobsCountRes.totalItems
        });

        setSideStats({
          regions: regionRes.slice(0, 5).map(r => [r.name, r.value]),
          workStatus: workRes.map(w => [w.name, w.value])
        });

        const processedJobs = jobRecords.map(j => {
          const rawCoords = getCoordinates(j.lokasi, '');
          return { ...j, coords: { lat: rawCoords.lat + (Math.random() - 0.5) * 0.02, lng: rawCoords.lng + (Math.random() - 0.5) * 0.02 } };
        });

        setJobs(processedJobs);
      } catch (err) {
        console.error("Gagal ambil data awal peta:", err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch Alumni directly from Backend based on Search
  useEffect(() => {
    const fetchAlumni = async () => {
      setLoading(true);
      try {
        let filterStr = '';
        if (confirmedSearchTerm) {
          const term = confirmedSearchTerm.replace(/"/g, ''); // Hindari injection
          filterStr = `nama ~ "${term}" || kota_kabupaten ~ "${term}" || provinsi ~ "${term}" || nim ~ "${term}"`;
        }

        const alumniRecords = await pb.collection('alumni').getList(1, 1000, { 
          sort: '-created',
          filter: filterStr,
          fields: 'id,nama,nim,provinsi,kota_kabupaten,status_kerja,tahun_lulus'
        });
        
        const processedAlumni = alumniRecords.items.map(a => {
          const rawCoords = getCoordinates(a.provinsi, a.kota_kabupaten);
          return { ...a, kota: a.kota_kabupaten, coords: { lat: rawCoords.lat + (Math.random() - 0.5) * 0.02, lng: rawCoords.lng + (Math.random() - 0.5) * 0.02 } };
        });

        setAlumni(processedAlumni);
      } catch (err) {
        console.error("Gagal ambil data peta alumni:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlumni();
  }, [confirmedSearchTerm]);

  // Alias untuk mempermudah tanpa mengubah struktur JSX di bawah
  const filteredAlumni = alumni;

  const filteredJobs = useMemo(() => {
    const term = confirmedSearchTerm.toLowerCase();
    if (!term) return jobs;
    return jobs.filter(j => 
      (j.judul && j.judul.toLowerCase().includes(term)) ||
      (j.expand?.company?.nama && j.expand.company.nama.toLowerCase().includes(term)) ||
      (j.lokasi && j.lokasi.toLowerCase().includes(term))
    );
  }, [jobs, confirmedSearchTerm]);

  // TOP REGIONS - Diambil dari state sideStats (View-powered)
  const topRegionsDisplay = useMemo(() => sideStats.regions, [sideStats.regions]);

  const workStatusStats = useMemo(() => sideStats.workStatus, [sideStats.workStatus]);

  const handleFocusRegion = (name) => {
    setMapCenter(getCoordinates(name, ''));
    setZoom(10);
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-700 pb-10">
      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full relative min-h-[600px]">
        
        {/* Side Panel (No internal scroll) */}
        <div className="w-full lg:w-[320px] xl:w-[360px] flex flex-col gap-4 animate-in fade-in slide-in-from-left-4">
          
          {/* Search Bar */}
          <div className="relative group w-full shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau kota..." 
              className="pl-11 pr-24 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm w-full outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-medium"
              ref={searchInputRef}
              defaultValue={confirmedSearchTerm}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={handleSearchTrigger}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
            >
              Cari
            </button>
          </div>
             {/* Filter Toggle */}
             <div className="bg-surface p-1.5 rounded-2xl border border-border-subtle shadow-sm flex items-center shrink-0">
               {['Alumni', 'Lowongan'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`flex-1 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-brand-primary text-white shadow-md' : 'text-secondary hover:bg-main'}`}
                 >
                   {tab}
                 </button>
               ))}
             </div>
             
             <div className="grid grid-cols-2 gap-3 shrink-0">
               <div className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm flex flex-col justify-center">
                 <p className="text-[10px] font-black text-secondary opacity-80 uppercase tracking-widest flex items-center gap-1.5"><Users size={12} className="text-blue-500"/> Alumni</p>
                 <p className="text-2xl font-black text-primary mt-1">{counts.alumni}</p>
               </div>
               <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-sm flex flex-col justify-center">
                 <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><Briefcase size={12}/> Lowongan</p>
                 <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{counts.jobs}</p>
               </div>
             </div>

             {/* Top Regions */}
             <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-sm shrink-0">
                <h3 className="text-[11px] font-black text-secondary opacity-80 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin size={14} className="text-brand-primary" /> 
                  {activeTab === 'Alumni' ? '5 Provinsi Teratas' : '5 Daerah Teratas'}
                </h3>
                <div className="space-y-1">
                  {topRegionsDisplay.length > 0 ? topRegionsDisplay.map(([name, count]) => (
                    <div 
                      key={name}
                      className="flex items-center justify-between group cursor-pointer hover:bg-main p-2.5 -mx-2.5 rounded-xl transition-colors"
                      onClick={() => handleFocusRegion(name)}
                    >
                       <span className="text-sm font-bold text-primary group-hover:text-brand-primary transition-colors line-clamp-1 pr-3">{name}</span>
                       <span className="text-xs font-black text-secondary bg-main border border-border-subtle px-2 py-1 rounded-md shrink-0">{count}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-secondary font-medium py-2">Data belum tersedia.</p>
                  )}
                </div>
             </div>

             {/* Extra Information Panel (Progress Bars) */}
             <div className="bg-surface p-5 rounded-2xl border border-border-subtle shadow-sm flex-1 shrink-0">
                <h3 className="text-[11px] font-black text-secondary opacity-80 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info size={14} className={activeTab === 'Alumni' ? "text-brand-primary" : "text-emerald-500"} /> 
                  {activeTab === 'Alumni' ? 'Status Pekerjaan' : 'Tipe Pekerjaan'}
                </h3>
                <div className="space-y-4">
                  {workStatusStats.length > 0 ? workStatusStats.map(([name, count]) => {
                    const total = activeTab === 'Alumni' ? counts.alumni : counts.jobs;
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                    <div key={name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-primary line-clamp-1 pr-2">{name}</span>
                        <span className="font-black text-secondary shrink-0">{count} <span className="opacity-60">({percentage}%)</span></span>
                      </div>
                      <div className="w-full bg-main border border-border-subtle rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${activeTab === 'Alumni' ? 'bg-brand-primary' : 'bg-emerald-500'}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}) : (
                    <p className="text-xs text-secondary font-medium py-2">Data belum tersedia.</p>
                  )}
                </div>
             </div>
           </div>

        {/* Map Container */}
        <div className="w-full flex flex-col bg-white p-1.5 md:p-2 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-200 relative z-0 flex-1 mb-4 min-h-[500px]">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-main gap-4 rounded-[1.2rem] md:rounded-[2rem]">
               <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
               <p className="text-xs md:text-sm text-secondary font-black uppercase tracking-widest animate-pulse">Memetakan lokasi data...</p>
            </div>
          ) : (
            <div className="flex-1 w-full h-full relative bg-main rounded-[1.2rem] md:rounded-[2rem] overflow-hidden">
              <MapContainer 
                center={mapCenter} 
                zoom={zoom} 
                scrollWheelZoom={true} 
                preferCanvas={true} // OPTIMASI: Menggunakan Canvas untuk performa marker ribuan data
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <ChangeView center={mapCenter} zoom={zoom} />
                <TileLayer
                  attribution='&copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  updateWhenIdle={true} // Hanya update saat peta diam (mengurangi lag)
                  updateWhenZooming={false}
                />
                
                {activeTab === 'Alumni' && (
                  <MarkerClusterGroup 
                    key={`alumni-cluster-${confirmedSearchTerm}`}
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
                             <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-lg">
                               {person.nama.charAt(0)}
                             </div>
                             <div>
                                <p className="font-bold text-slate-900 leading-tight">{person.nama}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{person.nim}</p>
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
                            className="w-full mt-4 py-2 bg-brand-primary text-white text-[10px] font-bold uppercase rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
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
                    key={`jobs-cluster-${confirmedSearchTerm}`}
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
                             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
                               <Briefcase size={20} />
                             </div>
                             <div>
                                <p className="font-bold text-slate-900 leading-tight truncate max-w-[140px]">{job.judul}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate max-w-[140px]">{job.expand?.company?.nama || 'Perusahaan'}</p>
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
                            className="w-full mt-4 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
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
