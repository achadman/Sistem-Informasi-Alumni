import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Mail, Phone, Globe, MapPin, 
  CheckCircle2, Briefcase, ExternalLink, ArrowLeft,
  Calendar, Users, Shield, Link as LinkIcon
} from 'lucide-react';
import { pb } from '../lib/pb';
import { formatDate } from '../lib/utils';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const record = await pb.collection('companies').getOne(id);
        setCompany(record);

        // Fetch active jobs by this company
        const jobsResult = await pb.collection('job_postings').getList(1, 6, {
          filter: `company="${record.id}" && status="Aktif"`,
          sort: '-created'
        });
        setJobs(jobsResult.items);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Memuat profil perusahaan...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-20 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <Building2 size={40} className="text-slate-200" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Perusahaan Tidak Ditemukan</h2>
        <button onClick={() => navigate(-1)} className="mt-6 text-blue-600 font-bold flex items-center gap-2 mx-auto hover:underline">
          <ArrowLeft size={18} /> Kembali
        </button>
      </div>
    );
  }

  const socialMedia = Array.isArray(company.social_media) ? company.social_media : (typeof company.social_media === 'string' ? JSON.parse(company.social_media || '[]') : []);

  return (
    <div className="min-h-screen bg-[#f1f5f9] -m-8 p-6 lg:p-12 lg:px-[2.5%] font-outfit">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors group mb-4"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-slate-50 transition-all">
            <ArrowLeft size={18} />
          </div>
          Kembali
        </button>

        {/* Main Card (LinkedIn Style) */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-64 relative overflow-hidden bg-slate-200">
            {company.banner ? (
              <img src={pb.files.getUrl(company, company.banner)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 opacity-90" />
            )}
          </div>

          {/* Profile Area */}
          <div className="px-12 pb-12 relative">
            <div className="flex flex-col items-start gap-6 -mt-24 mb-10 px-2">
              {/* Logo */}
              <div className="relative">
                <div className="w-48 h-48 rounded-[2.5rem] border-[8px] border-white bg-white shadow-2xl overflow-hidden flex items-center justify-center p-4">
                  {company.logo ? (
                    <img src={pb.files.getUrl(company, company.logo)} alt={company.nama} className="w-full h-full object-contain" />
                  ) : (
                    <Building2 size={80} className="text-slate-100" />
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="w-full">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{company.nama}</h1>
                  {company.verified && (
                    <div className="p-1.5 bg-blue-600 text-white rounded-full shrink-0 shadow-lg shadow-blue-200" title="Kemitraan Terverifikasi">
                      <CheckCircle2 size={16} fill="currentColor" />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4 text-slate-500 text-sm font-bold">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Shield size={14} /></div>
                    <span className="uppercase tracking-widest text-[11px]">{company.industri || 'Bidang Industri'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <MapPin size={16} />
                    <span>{[company.kota, company.provinsi].filter(Boolean).join(', ') || '-'}</span>
                  </div>
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-blue-500 hover:underline">
                      <Globe size={16} />
                      <span>{company.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8 items-start">
          
          {/* Left Column: About & Jobs */}
          <div className="space-y-8">
            {/* About Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4">Tentang Perusahaan</h3>
              <p className="text-slate-600 leading-[1.8] whitespace-pre-wrap text-[15px]">
                {company.deskripsi || "Perusahaan ini belum menambahkan deskripsi profil."}
              </p>
            </div>

            {/* Active Jobs Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8 border-l-4 border-blue-500 pl-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lowongan Aktif</h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-tighter">{jobs.length} Tersedia</span>
              </div>
              
              {jobs.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Briefcase size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">Belum ada lowongan aktif saat ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map(job => (
                    <div 
                      key={job.id} 
                      onClick={() => navigate(`/lowongan?jobId=${job.id}`)}
                      className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-white hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{job.judul}</h4>
                      <div className="flex items-center gap-3 mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{job.tipe_kerja}</span>
                        <span className="opacity-20">•</span>
                        <span>{job.lokasi?.split(',')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Contact & Social */}
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Informasi Kontak</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-400"><Mail size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Alamat Email</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{company.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-400"><Phone size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Telepon</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{company.no_hp || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-400"><MapPin size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Kantor Pusat</p>
                    <p className="text-sm font-bold text-slate-900 mt-1 leading-relaxed">{company.alamat || company.kota || '-'}</p>
                  </div>
                </div>
              </div>

              {socialMedia.length > 0 && (
                <div className="mt-12 pt-10 border-t border-slate-100">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Media Sosial</h3>
                  <div className="flex flex-wrap gap-3">
                    {socialMedia.map((sm, idx) => (
                      <a key={idx} href={sm.url} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center gap-2">
                        <LinkIcon size={12} /> {sm.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Verification Status (Admin Only view logic could go here) */}
            <div className={`p-8 rounded-3xl border-2 border-dashed flex flex-col items-center text-center ${company.verified ? 'bg-emerald-50/30 border-emerald-100' : 'bg-amber-50/30 border-amber-100'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${company.verified ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-amber-500 text-white shadow-lg shadow-amber-200'}`}>
                {company.verified ? <CheckCircle2 size={24} /> : <Shield size={24} />}
              </div>
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Status Verifikasi</h4>
              <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed px-4">
                {company.verified 
                  ? "Perusahaan ini telah diverifikasi dan memiliki akses penuh untuk mempublikasikan lowongan."
                  : "Menunggu peninjauan admin. Akses publikasi lowongan masih dibatasi."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
