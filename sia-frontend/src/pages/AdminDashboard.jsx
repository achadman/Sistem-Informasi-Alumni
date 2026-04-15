import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Briefcase, 
  GraduationCap, 
  Users, 
  TrendingUp, 
  Clock, 
  UserX, 
  Map as MapIcon,
  ChevronRight,
  TrendingDown,
  Layers,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from 'lucide-react';
import { pb } from '../lib/pb';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    alumni: [],
    tracer: [],
      stats: {
        workStatus: [],
        graduationRate: [],
        genderBatch: { batches: [], male: [], female: [] },
        regionStats: [],
        dropoutStats: [],
        churnRate: '0.0%'
      }
    });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [alumniRecords, tracerRecords] = await Promise.all([
        pb.collection('alumni').getFullList(),
        pb.collection('tracer_studies').getFullList() // Fixed collection name
      ]);

      console.log("DEBUG: Records fetched:", alumniRecords.length);
      console.log("DEBUG: Sample Record:", alumniRecords[0]);
      console.log("DEBUG: DO Records Count:", alumniRecords.filter(a => a.keterangan === 'Drop Out (DO)').length);
      const workCounts = alumniRecords.reduce((acc, curr) => {
        if (!curr.status_kerja) return acc;
        const status = curr.status_kerja.charAt(0).toUpperCase() + curr.status_kerja.slice(1);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const workStatusData = Object.entries(workCounts).map(([name, value]) => ({ 
        name, 
        value,
        itemStyle: { color: name === 'Bekerja' ? '#3b82f6' : name.includes('Wira') ? '#10b981' : name.includes('Studi') ? '#8b5cf6' : '#f59e0b' }
      }));

      // AGGREGATE GENDER (Stacked Bar)
      let genderBatchData = { batches: [], male: [], female: [] };
      try {
         const batches = Array.from(new Set(alumniRecords.map(a => a.tahun_lulus))).sort().slice(-2);
         genderBatchData = {
           batches,
           male: batches.map(year => alumniRecords.filter(a => a.tahun_lulus === year && a.gender === 'L').length),
           female: batches.map(year => alumniRecords.filter(a => a.tahun_lulus === year && a.gender === 'P').length),
         };
      } catch (e) { console.error("Failing to aggregate gender", e); }

      // AGGREGATE REGIONS (Top 5 + Others)
      const regionCounts = alumniRecords.reduce((acc, curr) => {
        const prov = curr.provinsi || 'Tidak Diketahui';
        acc[prov] = (acc[prov] || 0) + 1;
        return acc;
      }, {});
      const sortedRegions = Object.entries(regionCounts)
        .sort((a, b) => b[1] - a[1]);
      const topRegions = sortedRegions.slice(0, 5).map(([name, value]) => ({ name, value }));
      const otherCount = sortedRegions.slice(5).reduce((sum, [_, val]) => sum + val, 0);
      if (otherCount > 0) topRegions.push({ name: 'Lainnya', value: otherCount });

      // AGGREGATE DROPOUTS (By Semester)
      const dropoutCounts = Array(8).fill(0);
      alumniRecords.forEach(a => {
        // Robust check for keterangan
        const keterangan = a.keterangan ? String(a.keterangan).trim().toLowerCase() : '';
        const isDO = keterangan === 'drop out (do)';
        const sem = parseInt(a.semester_dropout) || 0;
        
        if (isDO && sem >= 1 && sem <= 8) {
          dropoutCounts[sem - 1]++;
        }
      });
      console.log("DEBUG: Dropout Counts by Smt:", dropoutCounts);

      // AGGREGATE CHURN RATE OVERALL
      const totalDO = alumniRecords.filter(a => a.keterangan === 'Drop Out (DO)').length;
      const totalAlumniRecords = alumniRecords.length || 1;
      const churnRateCalculated = ((totalDO / totalAlumniRecords) * 100).toFixed(1) + '%';
      
      console.log("DEBUG: Total DO found:", totalDO);

      setData({
        alumni: alumniRecords,
        tracer: tracerRecords,
        stats: {
          workStatus: workStatusData,
          genderBatch: genderBatchData,
          regionStats: topRegions,
          dropoutStats: dropoutCounts,
          churnRate: churnRateCalculated,
          graduationRate: [82, 85, 81, 88, 92, 90] 
        }
      });
    } catch (err) {
      if (err.status !== 0) {
        console.error("Gagal memuat dashboard:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- ECharts Options ---

  const tracerStatusOption = {
    tooltip: { 
      trigger: 'item',
      extraCssText: 'z-index: 1000; border-radius: 8px; border: none; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);' 
    },
    legend: { 
      bottom: '0', 
      left: 'center', 
      textStyle: { color: '#64748b' },
      padding: [10, 0, 0, 0]
    },
    series: [
      {
        name: 'Status Alumni',
        type: 'pie',
        radius: ['45%', '65%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 12, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: data.stats.workStatus.length > 0 ? data.stats.workStatus : [{ value: 0, name: 'Belum ada data' }]
      }
    ]
  };

  const graduationRateOption = {
    tooltip: { 
      trigger: 'axis',
      extraCssText: 'z-index: 1000; border-radius: 8px; border: none; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: ['2019', '2020', '2021', '2022', '2023', '2024'],
      axisLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: { 
      type: 'value',
      splitLine: { lineStyle: { color: '#f8fafc' } },
      axisLabel: { color: '#94a3b8' }
    },
    series: [{
      name: 'Persentase Tepat Waktu',
      type: 'line',
      smooth: true,
      data: data.stats.graduationRate,
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.2)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }]
        }
      }
    }]
  };

  const genderOption = {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      extraCssText: 'z-index: 1000; border-radius: 8px; border: none; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);'
    },
    legend: { bottom: '0', textStyle: { color: '#64748b' } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: { 
      type: 'category', 
      data: data.stats.genderBatch.batches?.map(b => `Angkatan ${b}`) || [],
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Laki-laki',
        type: 'bar',
        stack: 'total',
        label: { show: true },
        data: data.stats.genderBatch.male || [],
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: 'Perempuan',
        type: 'bar',
        stack: 'total',
        label: { show: true },
        data: data.stats.genderBatch.female || [],
        itemStyle: { color: '#ec4899' }
      }
    ]
  };

  const churnRateOption = {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      extraCssText: 'z-index: 1000; border-radius: 8px; border: none; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: ['Smt 1', 'Smt 2', 'Smt 3', 'Smt 4', 'Smt 5', 'Smt 6', 'Smt 7', 'Smt 8'],
      axisLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f8fafc' } } },
    series: [{
      name: 'Jumlah DO',
      type: 'bar',
      data: data.stats.dropoutStats,
      itemStyle: {
        color: '#ef4444',
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '60%',
      label: {
        show: true,
        position: 'top',
        color: '#ef4444',
        fontWeight: 'bold'
      }
    }]
  };

  const regionHeatmapOption = {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      extraCssText: 'z-index: 1000; border-radius: 8px; border: none; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: data.stats.regionStats.map(r => r.name),
      axisLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', interval: 0, rotate: 45 }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f8fafc' } } },
    series: [{
      name: 'Jumlah Alumni',
      type: 'bar',
      data: data.stats.regionStats.map((r, idx) => ({
        value: r.value,
        itemStyle: { 
          color: idx === 0 ? '#1e3a8a' : idx === 1 ? '#1d4ed8' : idx === 2 ? '#2563eb' : idx === 3 ? '#3b82f6' : idx === 4 ? '#60a5fa' : '#cbd5e1' 
        }
      })),
      itemStyle: { borderRadius: [6, 6, 0, 0] },
      barWidth: '60%'
    }]
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau performa institusi secara mendalam.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
             <Layers size={16} /> Filter Data
           </button>
           <button className="px-4 py-2 bg-blue-600 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2">
             Ekspor Laporan
           </button>
        </div>
      </header>

      {/* SECTION 1: ALUMNI TRACER (EXTERNAL) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
           <h2 className="text-xl font-bold text-slate-800">Alumni Tracer (Data Eksternal)</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
           <KpiCard 
              title="Alumni Bekerja" 
              value={data.alumni.filter(a => a.status_kerja?.toLowerCase() === 'bekerja').length} 
              trend="+5.2%" 
              icon={<Briefcase size={20} />} 
              color="blue" 
              subtitle="Terserap Industri" 
           />
           <KpiCard 
              title="Wiraswasta" 
              value={data.alumni.filter(a => a.status_kerja?.toLowerCase() === 'wiraswasta').length} 
              trend="+1.8%" 
              icon={<TrendingUp size={20} />} 
              color="emerald" 
              subtitle="Kemandirian Lulusan" 
           />
           <KpiCard 
              title="Studi Lanjut" 
              value={data.alumni.filter(a => a.status_kerja?.toLowerCase().includes('studi')).length} 
              trend="-0.5%" 
              icon={<GraduationCap size={20} />} 
              color="purple" 
              subtitle="S2 / S3" 
           />
           <KpiCard 
              title="Belum Bekerja" 
              color="amber" 
              value={data.alumni.filter(a => a.status_kerja?.toLowerCase().includes('belum')).length} 
              trend="-12%" 
              icon={<UserX size={20} />} 
              subtitle="Gap Year / Cari Kerja" 
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
           <div className="lg:col-span-1 bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-soft">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <PieChartIcon size={18} className="text-blue-500" /> Status Kebekerjaan
                </h3>
              </div>
              {!loading && <ReactECharts option={tracerStatusOption} style={{ height: window.innerWidth < 768 ? 300 : 350 }} />}
           </div>
           
           <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-soft relative overflow-hidden group">
               <div className="flex items-center justify-between mb-6 md:mb-8">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <BarChartIcon size={18} className="text-blue-500" /> Sebaran wilayah alumni (heatmap bar)
                 </h3>
                 <span className="hidden md:inline text-slate-400 text-xs font-medium">Klik provinsi untuk detail daerah</span>
               </div>
               {!loading && <ReactECharts option={regionHeatmapOption} style={{ height: window.innerWidth < 768 ? 300 : 350 }} />}
            </div>
        </div>
      </section>

      {/* SECTION 2: STATISTIK MAHASISWA (INTERNAL) */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
           <h2 className="text-xl font-bold text-slate-800">Statistik Kemahasiswaan (Internal)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
           <KpiCard title="Lama Studi Rata-rata" value="4.2 Thn" trend="Optimal" icon={<Clock size={20} />} color="blue" subtitle="Target Akreditasi: < 4.5" />
           <KpiCard title="Jumlah Alumni" value={data.alumni.length} trend={`+${data.alumni.filter(a => a.tahun_lulus === 2024).length}`} icon={<GraduationCap size={20} />} color="emerald" subtitle="Total database berjalan" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-soft">
               <div className="flex justify-between items-start mb-6 md:mb-8">
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <BarChartIcon size={18} className="text-red-500" /> Churn rate / DO per semester
                    </h3>
                    {data.stats.dropoutStats.some(v => v > 0) ? (
                      <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-2xl md:text-3xl font-black text-slate-900">{data.stats.churnRate}</p>
                        <span className="text-[10px] md:text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">-0.6%</span>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-col">
                        <p className="text-lg md:text-xl font-bold text-slate-400">Belum Ada Data</p>
                        <p className="text-[9px] md:text-[10px] text-slate-400 italic">Pastikan field "keterangan" & "semester" aktif</p>
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jumlah DO (Jiwa)</span>
                  </div>
               </div>
               {!loading && data.stats.dropoutStats.some(v => v > 0) ? (
                 <ReactECharts option={churnRateOption} style={{ height: window.innerWidth < 768 ? 300 : 350 }} />
               ) : (
                 <div className="h-[250px] md:h-[350px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <BarChartIcon size={48} className="opacity-10" />
                    <p className="text-xs font-medium">Data Drop Out tidak ditemukan</p>
                 </div>
               )}
            </div>

            <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-soft">
               <h3 className="font-bold text-slate-800 mb-6 md:mb-8 flex items-center gap-2">
                  <BarChartIcon size={18} className="text-blue-500" /> Demografi Gender per Angkatan
               </h3>
               {!loading && <ReactECharts option={genderOption} style={{ height: window.innerWidth < 768 ? 300 : 350 }} />}
            </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ title, value, icon, color, trend, subtitle }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white p-5 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-soft flex flex-col relative group transition-all hover:translate-y-[-4px]">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${colors[color]}`}>
          {icon}
        </div>
        <span className={`text-[10px] md:text-xs font-black px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : (trend.startsWith('-') ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400')}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1">{value}</p>
        <p className="text-[10px] md:text-[11px] text-slate-500 mt-1.5 md:mt-2 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}
