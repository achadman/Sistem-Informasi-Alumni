import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  BarChart as BarChartIcon,
  Info,
  ChevronDown,
  Check,
  Download,
  X,
  FileText
} from 'lucide-react';
import { pb } from '../lib/pb';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Reusable Custom Dropdown ─────────────────────────────────────────────────
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full sm:w-64" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-sm font-bold text-primary hover:bg-main transition-colors shadow-sm"
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown size={15} className={`text-secondary shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-1.5 bg-elevated border border-border-subtle rounded-xl shadow-xl overflow-hidden py-1"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-left transition-colors
                  ${ opt.value === value ? 'text-blue-600 bg-blue-50/60' : 'text-secondary hover:bg-surface hover:text-primary' }`}
              >
                {opt.value === value && <Check size={13} className="text-blue-600 shrink-0" />}
                <span className={opt.value !== value ? 'ml-4' : ''}>{opt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
        churnRate: '0.0%',
        fakultasStats: [],
        prodiStats: []
      }
    });

  // New States for Chart Filters
  const [activePieChart, setActivePieChart] = useState('karir'); // 'karir' | 'fakultas'
  const [activeBarChart, setActiveBarChart] = useState('geografis'); // 'geografis' | 'prodi' | 'dropout' | 'gender'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('navbar-actions-portal'));
    const controller = new AbortController();
    fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchDashboardData = async (signal) => {
    setLoading(true);
    try {
      // SESUAIKAN DENGAN NAMA DI POCKETBASE ANDA
      const [workRes, regionRes, prodiRes, genderRes, doRes, tracerRes, prodiList, totalRes] = await Promise.all([
        pb.collection('view_statistik_kerja').getFullList(), 
        pb.collection('view_statistik_wilayah').getFullList(),
        pb.collection('view_statistik_prodi').getFullList(),
        pb.collection('view_statistik_gender').getFullList(),
        pb.collection('view_statistik_dropout').getFullList(),
        pb.collection('tracer_studies').getList(1, 1),
        pb.collection('program_studi').getFullList({ expand: 'fakultas_id', sort: 'nama' }),
        pb.collection('alumni').getList(1, 1)
      ]);

      // 1. Work Status
      const workStatusData = workRes.map(item => ({
        name: item.name || 'Lainnya',
        value: item.value || 0,
        itemStyle: { 
          color: item.name === 'Bekerja' ? '#3b82f6' : 
                 item.name?.includes('Wira') ? '#10b981' : 
                 item.name?.includes('Studi') ? '#8b5cf6' : '#f59e0b' 
        }
      }));

      // 2. Region Stats
      const topRegions = regionRes.slice(0, 5).map(r => ({ name: r.name, value: r.value || 0 }));
      const otherCount = regionRes.slice(5).reduce((sum, r) => sum + (r.value || 0), 0);
      if (otherCount > 0) topRegions.push({ name: 'Lainnya', value: otherCount });

      // 3. Prodi & Fakultas
      const fakultasCounts = {};
      const prodiStatsData = prodiRes.map(p => {
        const matched = prodiList.find(pl => pl.nama.toLowerCase() === p.name?.toLowerCase());
        if (matched?.expand?.fakultas_id) {
          const fName = matched.expand.fakultas_id.nama;
          fakultasCounts[fName] = (fakultasCounts[fName] || 0) + (p.value || 0);
        }
        return { name: p.name, value: p.value || 0 };
      }).sort((a, b) => a.value - b.value);

      const fakultasStatsData = Object.entries(fakultasCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // 4. Gender Stats (Data dari View Baru)
      const sortedGenderRes = [...genderRes].sort((a, b) => a.tahun_lulus - b.tahun_lulus).slice(-2);
      const genderBatchData = {
        batches: sortedGenderRes.map(g => g.tahun_lulus),
        male: sortedGenderRes.map(g => g.male || 0),
        female: sortedGenderRes.map(g => g.female || 0)
      };

      // 5. DO Stats (Data dari View Baru)
      const dropoutCounts = Array(8).fill(0);
      doRes.forEach(d => {
        const sem = parseInt(d.semester_dropout) || 0;
        if (sem >= 1 && sem <= 8) dropoutCounts[sem - 1] = d.total || 0;
      });
      const totalDO = doRes.reduce((sum, d) => sum + (d.total || 0), 0);
      const churnRateCalculated = ((totalDO / (totalRes.totalItems || 1)) * 100).toFixed(1) + '%';

      setData({
        alumni: { length: totalRes.totalItems },
        tracer: { length: tracerRes.totalItems },
        stats: {
          workStatus: workStatusData,
          genderBatch: genderBatchData,
          regionStats: topRegions,
          dropoutStats: dropoutCounts,
          churnRate: churnRateCalculated,
          graduationRate: [82, 85, 81, 88, 92, 90],
          prodiStats: prodiStatsData,
          fakultasStats: fakultasStatsData
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

  // --- Insight Generation Functions ---
  const getPieInsight = () => {
    if (loading) return "Memuat data insight...";
    
    if (activePieChart === 'karir') {
      const stats = data.stats.workStatus;
      if (!stats || stats.length === 0) return "Belum ada data status karir yang cukup untuk dianalisis.";
      const sorted = [...stats].sort((a, b) => b.value - a.value);
      const total = sorted.reduce((sum, item) => sum + item.value, 0);
      const top = sorted[0];
      const percentage = Math.round((top.value / total) * 100);
      return `Mayoritas alumni saat ini berstatus "${top.name}" dengan total ${top.value} orang (${percentage}% dari total responden tracer).`;
    } 
    
    if (activePieChart === 'fakultas') {
      const stats = data.stats.fakultasStats;
      if (!stats || stats.length === 0) return "Belum ada data distribusi fakultas yang cukup untuk dianalisis.";
      const sorted = [...stats].sort((a, b) => b.value - a.value);
      const top = sorted[0];
      return `Fakultas "${top.name}" mendominasi jumlah alumni terbanyak dengan total ${top.value} lulusan.`;
    }
    return "";
  };

  const getBarInsight = () => {
    if (loading) return "Memuat data insight...";
    
    if (activeBarChart === 'geografis') {
      const stats = data.stats.regionStats;
      if (!stats || stats.length === 0) return "Belum ada sebaran wilayah yang tercatat.";
      const top = stats[0];
      return `Persebaran alumni paling terpusat di wilayah ${top.name} (${top.value} orang), menjadikannya basis jaringan terbesar saat ini.`;
    }
    
    if (activeBarChart === 'prodi') {
      const stats = data.stats.prodiStats;
      if (!stats || stats.length === 0) return "Belum ada data program studi.";
      // prodiStats is sorted ascending for horizontal bar chart, so the highest is at the end
      const top = stats[stats.length - 1];
      return `Program Studi ${top.name} mencetak lulusan terbanyak (${top.value} alumni) dibanding program studi lainnya.`;
    }

    if (activeBarChart === 'dropout') {
       const stats = data.stats.dropoutStats;
       const totalDO = stats.reduce((sum, val) => sum + val, 0);
       if (totalDO === 0) return "Sangat baik! Tidak ditemukan catatan mahasiswa Drop Out pada database saat ini.";
       const maxIndex = stats.indexOf(Math.max(...stats));
       return `Tercatat total ${totalDO} kasus Drop Out, dengan insiden terbanyak terjadi pada Semester ${maxIndex + 1} (${stats[maxIndex]} mahasiswa).`;
    }

    if (activeBarChart === 'gender') {
       const { batches, male, female } = data.stats.genderBatch;
       if (!batches || batches.length === 0) return "Belum ada tren angkatan yang tercatat.";
       const latestBatchIndex = batches.length - 1;
       const maleCount = male[latestBatchIndex] || 0;
       const femaleCount = female[latestBatchIndex] || 0;
       const dominant = maleCount > femaleCount ? 'Laki-laki' : (femaleCount > maleCount ? 'Perempuan' : 'seimbang laki-laki dan perempuan');
       return `Pada angkatan terbaru (${batches[latestBatchIndex]}), komposisi lulusan didominasi oleh ${dominant} (${Math.max(maleCount, femaleCount)} orang).`;
    }
    return "";
  };

  const renderPieStats = () => {
    if (activePieChart === 'karir') {
      const getVal = (name) => data.stats.workStatus.find(s => s.name?.toLowerCase().includes(name.toLowerCase()))?.value || 0;
      return (
        <div className="flex flex-col gap-3">
           <StatRow label="Alumni Bekerja" value={getVal('Bekerja')} color="blue" icon={<Briefcase size={16}/>} />
           <StatRow label="Wiraswasta" value={getVal('Wira')} color="emerald" icon={<TrendingUp size={16}/>} />
           <StatRow label="Studi Lanjut" value={getVal('Studi')} color="purple" icon={<GraduationCap size={16}/>} />
           <StatRow label="Belum Bekerja" value={getVal('Belum')} color="amber" icon={<UserX size={16}/>} />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {data.stats.fakultasStats.map((f, i) => (
             <StatRow key={i} label={f.name} value={f.value} color="indigo" icon={<Layers size={16}/>} />
          ))}
        </div>
      );
    }
  };

  const renderBarStats = () => {
    if (activeBarChart === 'geografis') {
       return (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {data.stats.regionStats.map((r, i) => (
             <StatRow key={i} label={r.name} value={r.value} color="blue" icon={<MapIcon size={16}/>} />
          ))}
        </div>
       )
    } else if (activeBarChart === 'prodi') {
       const sorted = [...data.stats.prodiStats].reverse();
       return (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {sorted.map((p, i) => (
             <StatRow key={i} label={p.name} value={p.value} color="indigo" icon={<GraduationCap size={16}/>} />
          ))}
        </div>
       )
    } else if (activeBarChart === 'dropout') {
       const totalDO = data.stats.dropoutStats.reduce((a,b)=>a+b,0);
       return (
         <div className="flex flex-col gap-3">
           <StatRow label="Total Drop Out" value={totalDO} color="red" icon={<TrendingDown size={16}/>} />
           <StatRow label="Tingkat Retensi DO" value={data.stats.churnRate} color="amber" icon={<PieChartIcon size={16}/>} />
         </div>
       )
    } else if (activeBarChart === 'gender') {
       return (
         <div className="flex flex-col gap-3">
           <StatRow label="Total Laki-laki" value="-" color="blue" icon={<Users size={16}/>} />
           <StatRow label="Total Perempuan" value="-" color="purple" icon={<Users size={16}/>} />
           <StatRow label="Total Alumni" value={data.alumni.length} color="emerald" icon={<GraduationCap size={16}/>} />
         </div>
       )
    }
  };

  // ── Warm Soft Neutral chart palette ──
  const SOFT_TOOLTIP = 'z-index:1000;border-radius:10px;border:1px solid rgba(0,0,0,0.07);box-shadow:0 2px 12px rgba(0,0,0,0.07);background:#FDFCFB;color:#1C1917;font-size:12px;';
  const CHART_COLORS = ['#6B9FD4', '#5BAD8F', '#9B8EC4', '#E8A87C', '#D97474', '#7BBCB0'];

  // --- ECharts Options ---
  const tracerStatusOption = {
    tooltip: { trigger: 'item', extraCssText: SOFT_TOOLTIP },
    legend: { bottom: '0', left: 'center', textStyle: { color: '#64748b', fontSize: 12 }, padding: [10, 0, 0, 0] },
    color: CHART_COLORS,
    series: [{
      name: 'Status Alumni',
      type: 'pie',
      radius: ['45%', '65%'],
      center: ['50%', '40%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 10, borderColor: '#F0F4FF', borderWidth: 3 },
      label: { show: false },
      labelLine: { show: false },
      data: data.stats.workStatus.length > 0 ? data.stats.workStatus.map((d, i) => ({...d, itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] }})) : [{ value: 0, name: 'Belum ada data' }]
    }]
  };

  const fakultasChartOption = {
    tooltip: { trigger: 'item', extraCssText: SOFT_TOOLTIP },
    legend: { bottom: '0', left: 'center', textStyle: { color: '#64748b', fontSize: 12 }, padding: [10, 0, 0, 0] },
    color: CHART_COLORS,
    series: [{
      name: 'Jumlah Alumni',
      type: 'pie',
      radius: ['45%', '65%'],
      center: ['50%', '40%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 10, borderColor: '#F0F4FF', borderWidth: 3 },
      label: { show: false },
      labelLine: { show: false },
      data: data.stats.fakultasStats.length > 0 ? data.stats.fakultasStats.map((d, i) => ({...d, itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] }})) : [{ value: 0, name: 'Belum ada data' }]
    }]
  };

  const regionHeatmapOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.03)' } }, extraCssText: SOFT_TOOLTIP },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.stats.regionStats.map(r => r.name),
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
      axisLabel: { color: '#7A7672', interval: 0, rotate: 45, fontSize: 11 }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)', type: 'dashed' } }, axisLabel: { color: '#7A7672', fontSize: 11 } },
    series: [{
      name: 'Jumlah Alumni',
      type: 'bar',
      data: data.stats.regionStats.map((r, idx) => ({
        value: r.value,
        itemStyle: { color: ['#6B9FD4','#7BBCB0','#9B8EC4','#E8A87C','#5BAD8F','#D4B896'][idx] || '#C9C0B8' }
      })),
      itemStyle: { borderRadius: [5, 5, 0, 0] },
      barWidth: '55%'
    }]
  };

  const prodiChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.03)' } }, extraCssText: SOFT_TOOLTIP },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)', type: 'dashed' } }, axisLabel: { color: '#7A7672', fontSize: 11 } },
    yAxis: {
      type: 'category',
      data: data.stats.prodiStats.map(p => p.name),
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
      axisLabel: { color: '#7A7672', fontSize: 11, width: 120, overflow: 'truncate' }
    },
    series: [{
      name: 'Jumlah Alumni',
      type: 'bar',
      data: data.stats.prodiStats.map(p => p.value),
      itemStyle: { color: '#9B8EC4', borderRadius: [0, 5, 5, 0] },
      barWidth: '60%',
      label: { show: true, position: 'right', color: '#7B6BAA', fontWeight: '600', fontSize: 12 }
    }]
  };

  const churnRateOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.03)' } }, extraCssText: SOFT_TOOLTIP },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Smt 1', 'Smt 2', 'Smt 3', 'Smt 4', 'Smt 5', 'Smt 6', 'Smt 7', 'Smt 8'],
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
      axisLabel: { color: '#7A7672', fontSize: 11 }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)', type: 'dashed' } }, axisLabel: { color: '#7A7672', fontSize: 11 } },
    series: [{
      name: 'Jumlah DO',
      type: 'bar',
      data: data.stats.dropoutStats,
      itemStyle: { color: '#D97474', borderRadius: [5, 5, 0, 0] },
      barWidth: '60%',
      label: { show: true, position: 'top', color: '#B85C5C', fontWeight: '600', fontSize: 11 }
    }]
  };

  const genderOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.03)' } }, extraCssText: SOFT_TOOLTIP },
    legend: { bottom: '0', textStyle: { color: '#7A7672', fontSize: 12 } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: data.stats.genderBatch.batches?.map(b => `Angkatan ${b}`) || [],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#7A7672', fontSize: 11 }
    },
    series: [
      { name: 'Laki-laki', type: 'bar', stack: 'total', label: { show: true, fontSize: 11 }, data: data.stats.genderBatch.male || [], itemStyle: { color: '#6B9FD4', borderRadius: [4, 0, 0, 4] } },
      { name: 'Perempuan', type: 'bar', stack: 'total', label: { show: true, fontSize: 11 }, data: data.stats.genderBatch.female || [], itemStyle: { color: '#9B8EC4', borderRadius: [0, 4, 4, 0] } }
    ]
  };

  const exportAllStatsToCSV = () => {
    if (loading) return;
    
    const rows = [
      ["Kategori", "Sub Kategori", "Nilai"]
    ];

    // Status Karir
    if (data.stats.workStatus) {
      data.stats.workStatus.forEach(item => {
        rows.push(["Distribusi Karir", `"${item.name}"`, item.value]);
      });
    }

    // Fakultas
    if (data.stats.fakultasStats) {
      data.stats.fakultasStats.forEach(item => {
        rows.push(["Distribusi Fakultas", `"${item.name}"`, item.value]);
      });
    }

    // Prodi
    if (data.stats.prodiStats) {
      data.stats.prodiStats.forEach(item => {
        rows.push(["Distribusi Program Studi", `"${item.name}"`, item.value]);
      });
    }

    // Geografis
    if (data.stats.regionStats) {
      data.stats.regionStats.forEach(item => {
        rows.push(["Sebaran Wilayah", `"${item.name}"`, item.value]);
      });
    }

    // Drop Out
    if (data.stats.dropoutStats) {
      data.stats.dropoutStats.forEach((val, idx) => {
        rows.push(["Drop Out", `"Semester ${idx + 1}"`, val]);
      });
      const totalDO = data.stats.dropoutStats.reduce((a,b)=>a+b,0);
      rows.push(["Drop Out", `"Total DO"`, totalDO]);
      rows.push(["Drop Out", `"Churn Rate"`, `"${data.stats.churnRate}"`]);
    }

    // Gender
    if (data.stats.genderBatch) {
      const { batches, male, female } = data.stats.genderBatch;
      if (batches && batches.length > 0) {
        batches.forEach((b, i) => {
          rows.push(["Demografi Gender", `"Angkatan ${b} - Laki-laki"`, male[i] || 0]);
          rows.push(["Demografi Gender", `"Angkatan ${b} - Perempuan"`, female[i] || 0]);
        });
      }
    }

    // Total Alumni & Tracer
    rows.push(["Ringkasan", '"Total Alumni Database"', data.alumni?.length || 0]);
    rows.push(["Ringkasan", '"Total Responden Tracer"', data.tracer?.length || 0]);

    const csvContent = "\uFEFF" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Statistik_Dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {portalTarget && createPortal(
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={() => setIsExportModalOpen(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all active:scale-95 text-sm uppercase tracking-wider"
          >
            <Download size={16} />
            <span className="hidden md:inline">Ekspor CSV</span>
          </button>
        </div>,
        portalTarget
      )}

      {/* SECTION 1: PIE CHART (Komposisi Data) */}
      <section className="premium-card flex flex-col lg:flex-row gap-6 lg:gap-8">
         {/* Left Side: Chart & Insight */}
         <div className="w-full lg:w-2/3 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="font-black text-primary flex items-center gap-2">
                 <PieChartIcon size={18} className="text-blue-500" /> Komposisi Data
              </h3>
              <CustomSelect
                  value={activePieChart}
                  onChange={setActivePieChart}
                  options={[
                    { value: 'karir', label: 'Distribusi Karir (Tracer)' },
                    { value: 'fakultas', label: 'Rasio Fakultas' },
                  ]}
               />
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[320px]">
               {!loading ? (
                  <ReactECharts 
                    option={activePieChart === 'karir' ? tracerStatusOption : fakultasChartOption} 
                    style={{ height: 320, width: '100%' }} 
                  />
               ) : (
                  <div className="text-sm font-bold text-slate-400 animate-pulse">Memuat chart...</div>
               )}
            </div>

            {/* Insight Text */}
            <div className="mt-4 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
               <div className="mt-0.5"><Info size={16} className="text-blue-500" /></div>
               <p className="text-xs font-semibold text-secondary leading-relaxed">
                 {getPieInsight()}
               </p>
            </div>
         </div>

         {/* Right Side: Attributes */}
         <div className="w-full lg:w-1/3 flex flex-col border-t lg:border-t-0 lg:border-l border-border-subtle pt-6 lg:pt-0 lg:pl-8">
            <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
               <Layers size={14} className="text-secondary" /> 
               {activePieChart === 'karir' ? 'Detail Status Karir' : 'Distribusi per Fakultas'}
            </h4>
            {!loading ? renderPieStats() : <div className="text-sm font-bold text-slate-400 animate-pulse">Memuat data...</div>}
         </div>
      </section>

      {/* SECTION 2: BAR CHART (Distribusi & Tren) */}
      <section className="premium-card flex flex-col lg:flex-row gap-6 lg:gap-8">
         {/* Left Side: Chart & Insight */}
         <div className="w-full lg:w-2/3 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="font-black text-primary flex items-center gap-2">
                 <BarChartIcon size={18} className="text-indigo-500" /> Distribusi & Tren
              </h3>
              <CustomSelect
                  value={activeBarChart}
                  onChange={setActiveBarChart}
                  options={[
                    { value: 'geografis', label: 'Sebaran Geografis Alumni' },
                    { value: 'prodi', label: 'Rekapitulasi Program Studi' },
                    { value: 'dropout', label: 'Analisis Drop Out (DO)' },
                    { value: 'gender', label: 'Demografi Gender per Angkatan' },
                  ]}
               />
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[320px] w-full relative overflow-hidden">
               {!loading ? (
                  <ReactECharts 
                    option={
                      activeBarChart === 'geografis' ? regionHeatmapOption :
                      activeBarChart === 'prodi' ? prodiChartOption :
                      activeBarChart === 'dropout' ? churnRateOption :
                      genderOption
                    } 
                    style={{ height: 350, width: '100%' }} 
                  />
               ) : (
                  <div className="text-sm font-bold text-slate-400 animate-pulse">Memuat chart...</div>
               )}
            </div>

            {/* Insight Text */}
            <div className="mt-4 p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-3">
               <div className="mt-0.5"><Info size={16} className="text-indigo-500" /></div>
               <p className="text-xs font-semibold text-secondary leading-relaxed">
                 {getBarInsight()}
               </p>
            </div>
         </div>

         {/* Right Side: Attributes */}
         <div className="w-full lg:w-1/3 flex flex-col border-t lg:border-t-0 lg:border-l border-border-subtle pt-6 lg:pt-0 lg:pl-8">
            <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
               <Layers size={14} className="text-secondary" /> 
               {
                 activeBarChart === 'geografis' ? 'Top Wilayah' :
                 activeBarChart === 'prodi' ? 'Peringkat Prodi' :
                 activeBarChart === 'dropout' ? 'Statistik Retensi' :
                 'Rasio Keseluruhan'
               }
            </h4>
            {!loading ? renderBarStats() : <div className="text-sm font-bold text-slate-400 animate-pulse">Memuat data...</div>}
         </div>
      </section>

      <AnimatePresence>
        {isExportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setIsExportModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Download size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">Ekspor Data Dashboard</h3>
                    <p className="text-xs text-slate-400 font-medium">Unduh rekap statistik ke CSV</p>
                  </div>
                </div>
                <button onClick={() => setIsExportModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5"><Info size={16} className="text-blue-600" /></div>
                  <p className="text-sm font-semibold text-blue-800 leading-relaxed">
                    Anda akan mengunduh seluruh data agregat statistik yang ada di dashboard ini.
                  </p>
                </div>

                <div className="space-y-2 text-sm text-slate-500">
                  <p className="font-medium">File CSV akan berisi rekapitulasi:</p>
                  <ul className="text-xs text-slate-400 leading-relaxed list-disc pl-4 space-y-1">
                    <li>Distribusi Status Karir & Tracer Study</li>
                    <li>Sebaran Geografis Wilayah</li>
                    <li>Rasio Lulusan per Fakultas & Program Studi</li>
                    <li>Demografi Gender per Angkatan</li>
                    <li>Analisis Tingkat Drop Out (DO)</li>
                  </ul>
                  <p className="text-xs text-slate-400 mt-2 italic">Format data akan disatukan dalam satu file berbentuk baris kategori.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={exportAllStatsToCSV}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download size={15} /> Ya, Download CSV
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ label, value, color, icon }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    purple: 'bg-purple-500/10 text-purple-500',
    amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle hover:border-brand-primary/30 transition-colors">
       <div className="flex items-center gap-3 w-3/4">
          <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}>
             {icon}
          </div>
          <span className="text-xs font-bold text-secondary line-clamp-1 flex-1 truncate">{label}</span>
       </div>
       <span className="text-sm font-black text-primary ml-2">{value}</span>
    </div>
  )
}
