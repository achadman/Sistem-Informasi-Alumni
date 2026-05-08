import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, BarChart2, MessageSquare, Download, Loader2,
  CircleDot, CheckSquare, AlignLeft, ChevronDown,
  Calendar, Clock, TrendingUp, FileText, Search, X
} from 'lucide-react';
import { pb } from '../lib/pb';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateExcel } from '../lib/excelExport';

const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

// ─── Donut Chart per question ───────────────────────────────────────────
function DonutChart({ options, stats, totalResponses }) {
  const data = options.map((opt, i) => ({
    name: opt,
    value: stats[opt] || 0,
    itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] }
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      extraCssText: 'border-radius:10px;border:1px solid rgba(0,0,0,0.07);box-shadow:0 4px 20px rgba(0,0,0,0.08);font-size:12px;'
    },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
      label: { show: false },
      data: data.filter(d => d.value > 0).length > 0 ? data : [{ name: 'Belum ada', value: 1, itemStyle: { color: '#e2e8f0' } }]
    }]
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="w-48 h-48 shrink-0">
        <ReactECharts option={option} style={{ width: 192, height: 192 }} />
      </div>
      <div className="flex-1 w-full space-y-2">
        {options.map((opt, i) => {
          const count = stats[opt] || 0;
          const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-2 truncate max-w-[70%]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {opt}
                </span>
                <span className="font-black text-slate-700">{count} <span className="text-slate-400 font-medium">({pct}%)</span></span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bar Chart for checkbox (multi-select) ──────────────────────────────
function HBarChart({ options, stats, totalResponses }) {
  const sortedOptions = [...options].sort((a, b) => (stats[b] || 0) - (stats[a] || 0));
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      extraCssText: 'border-radius:10px;border:1px solid rgba(0,0,0,0.07);box-shadow:0 4px 20px rgba(0,0,0,0.08);font-size:12px;'
    },
    grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { fontSize: 11, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: {
      type: 'category',
      data: sortedOptions,
      axisLabel: { fontSize: 11, color: '#64748b', width: 130, overflow: 'truncate' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: sortedOptions.map((opt, i) => ({
        value: stats[opt] || 0,
        itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length], borderRadius: [0, 6, 6, 0] }
      })),
      label: { show: true, position: 'right', formatter: (p) => `${p.value}`, fontSize: 11, fontWeight: 'bold', color: '#475569' },
      barMaxWidth: 28
    }]
  };
  const chartH = Math.max(180, sortedOptions.length * 44);
  return <ReactECharts option={option} style={{ height: chartH, width: '100%' }} />;
}

export default function AdminKuesionerResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'individual'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState({});
  const [error, setError] = useState(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchResults(controller.signal);
    return () => controller.abort();
  }, [id]);

  const fetchResults = async (signal) => {
    try {
      setLoading(true);
      const [qData, qsData, respData, answersData] = await Promise.all([
        pb.collection('questionnaires').getOne(id, { requestKey: null }),
        pb.collection('questions').getFullList({ filter: `questionnaire_id = '${id}'`, sort: 'order', requestKey: null }),
        pb.collection('questionnaire_responses').getFullList({ filter: `questionnaire_id = '${id}'`, expand: 'user_id', requestKey: null }),
        pb.collection('answers').getFullList({ filter: `question_id.questionnaire_id = '${id}'`, requestKey: null })
      ]);
      setQuestionnaire(qData);
      setQuestions(qsData);
      const formattedResponses = respData.map(r => {
        const userAnswers = answersData.filter(a => a.response_id === r.id);
        const ansMap = {};
        userAnswers.forEach(a => { ansMap[a.question_id] = a.value; });
        return { id: r.id, user: r.expand?.user_id, answers: ansMap, created: r.created };
      });
      setResponses(formattedResponses);
    } catch (err) {
      const isAbort = err.name === 'AbortError' || err.isAbort || err.message?.toLowerCase().includes('abort') || err.message?.toLowerCase().includes('autocancel');
      if (!isAbort) {
        console.error(err);
        setError(err.message || "Gagal mengambil data hasil kuesioner.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nama Lengkap', 'NIM', 'Email', 'Tanggal Isi', ...questions.map(q => `"${q.title}"`)];
    const rows = responses.map(r => {
      const user = r.user || {};
      const row = [`"${user.name || '-'}"`, `"${user.nim || '-'}"`, `"${user.email || '-'}"`, `"${new Date(r.created).toLocaleDateString('id-ID')}"`];
      questions.forEach(q => {
        let val = r.answers[q.id];
        if (Array.isArray(val)) val = val.join('; ');
        row.push(`"${val || ''}"`);
      });
      return row.join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `${questionnaire?.title || 'kuesioner'}_results.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = async () => {
    // Siapkan Data Sheet 1 (Statistik Ringkasan)
    const questionsData = questions.map((q, idx) => {
        const { stats } = getStats(q);
        let jawabanStat = '-';
        if (q.type === 'essay') {
            jawabanStat = 'Jawaban berupa teks esai';
        } else {
            jawabanStat = Object.entries(stats).map(([k, v]) => `${k} (${v} orang)`).join(' | ');
        }
        return {
            no: idx + 1,
            pertanyaan: q.title,
            tipe: q.type === 'radio' ? 'Pilihan Ganda' : q.type === 'checkbox' ? 'Kotak Centang' : 'Esai',
            jawaban: jawabanStat
        }
    });
    
    const sheet1 = {
      sheetName: 'Statistik Kuesioner',
      columns: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Pertanyaan', key: 'pertanyaan', width: 50 },
        { header: 'Tipe Jawaban', key: 'tipe', width: 15 },
        { header: 'Distribusi Jawaban', key: 'jawaban', width: 60 },
      ],
      data: questionsData
    };

    // Siapkan Data Sheet 2 (Detail Jawaban per Orang)
    const respondentColumns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Lengkap', key: 'nama', width: 25 },
      { header: 'NIM', key: 'nim', width: 15 },
      { header: 'Tanggal Isi', key: 'tanggal', width: 15 },
      ...questions.map((q, idx) => ({ header: `Q${idx+1}: ${q.title}`, key: `q_${q.id}`, width: 30 }))
    ];

    const respondentData = responses.map((r, idx) => {
      const user = r.user || {};
      const rowData = {
        no: idx + 1,
        nama: user.name || '-',
        nim: user.nim || '-',
        tanggal: new Date(r.created).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
      };
      questions.forEach(q => {
        let val = r.answers[q.id];
        if (Array.isArray(val)) val = val.join('; ');
        rowData[`q_${q.id}`] = val || '-';
      });
      return rowData;
    });

    const sheet2 = {
      sheetName: 'Data Responden Detail',
      columns: respondentColumns,
      data: respondentData
    };

    await generateExcel(`${questionnaire?.title || 'kuesioner'}_results_laporan`, [sheet1, sheet2]);
    setIsExportMenuOpen(false);
  };

  // Aggregate stats per question
  const getStats = (q) => {
    const stats = {};
    const essayAnswers = [];
    if (q.type === 'radio' || q.type === 'checkbox') {
      q.options.forEach(opt => stats[opt] = 0);
      responses.forEach(r => {
        const val = r.answers[q.id];
        if (val) {
          if (Array.isArray(val)) val.forEach(v => { if (stats[v] !== undefined) stats[v]++; });
          else if (stats[val] !== undefined) stats[val]++;
        }
      });
    } else {
      responses.forEach(r => {
        if (r.answers[q.id]) essayAnswers.push({ name: r.user?.name || 'Anonim', nim: r.user?.nim, val: r.answers[q.id] });
      });
    }
    return { stats, essayAnswers };
  };

  const answeredCount = (q) => responses.filter(r => {
    const val = r.answers[q.id];
    return val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0);
  }).length;

  const filteredResponses = responses.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (r.user?.name || '').toLowerCase().includes(q) || (r.user?.nim || '').toLowerCase().includes(q);
  });

  const toggleExpand = (respId) => {
    setExpandedIds(prev => ({ ...prev, [respId]: !prev[respId] }));
  };

  const expandAll = () => {
    const all = {};
    filteredResponses.forEach(r => { all[r.id] = true; });
    setExpandedIds(all);
  };

  const collapseAll = () => setExpandedIds({});

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center shadow-inner">
          <X size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">Oops! Gagal Memuat Data</h2>
          <p className="text-slate-500 max-w-sm mx-auto text-sm">{error}</p>
        </div>
        <button 
          onClick={() => { setError(null); fetchResults(); }}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
        >
          Coba Lagi
        </button>
        <button onClick={() => navigate('/admin/kuesioner')} className="text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors">
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-indigo-500" size={36} />
          <p className="text-sm font-semibold">Memuat hasil kuesioner...</p>
        </div>
      </div>
    );
  }

  const completionRate = questions.length > 0 && responses.length > 0
    ? Math.round((responses.filter(r => questions.every(q => r.answers[q.id])).length / responses.length) * 100)
    : 0;

  const tabs = [
    { id: 'summary', label: 'Ringkasan', icon: <BarChart2 size={15} /> },
    { id: 'individual', label: 'Responden Individual', icon: <Users size={15} /> },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-500 pb-16 px-4 lg:px-[2.5%]">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <button
            onClick={() => navigate('/admin/kuesioner')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
        </div>
        <div className="relative">
          {isExportMenuOpen && (
            <div className="fixed inset-0 z-10" onClick={() => setIsExportMenuOpen(false)}></div>
          )}
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all shrink-0 z-20 relative"
          >
            <Download size={15} /> Unduh Laporan <ChevronDown size={14} className={`ml-1 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown Menu */}
          <div className={`absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 transition-all origin-top-right overflow-hidden ${isExportMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={handleExportExcel}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-xl transition-colors hover:bg-slate-50 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Excel Lanjutan (.xlsx)</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-snug mt-0.5">Format rapi, berwarna & multi-sheet</p>
                </div>
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2"></div>
              <button
                onClick={handleExportCSV}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-xl transition-colors hover:bg-slate-50 group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                  <AlignLeft size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600">Data Mentah (.csv)</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-snug mt-0.5">Polos tanpa styling format</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Users size={18} />, label: 'Total Responden', value: responses.length, color: 'indigo' },
          { icon: <FileText size={18} />, label: 'Total Pertanyaan', value: questions.length, color: 'cyan' },
          { icon: <TrendingUp size={18} />, label: 'Tingkat Selesai', value: `${completionRate}%`, color: 'emerald' },
          { icon: <Clock size={18} />, label: 'Status', value: questionnaire?.is_active ? 'Aktif' : 'Nonaktif', color: questionnaire?.is_active ? 'emerald' : 'amber' },
        ].map((card, i) => {
          const colorMap = {
            indigo: 'bg-indigo-50 text-indigo-600',
            cyan: 'bg-cyan-50 text-cyan-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            amber: 'bg-amber-50 text-amber-600',
          };
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[card.color]}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{card.label}</p>
                <p className="text-lg font-black text-slate-800 leading-tight">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-2 pt-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSearchQuery(''); setExpandedIds({}); }}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 outline-none
                ${activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── SUMMARY TAB ── */}
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6"
            >
              {responses.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <MessageSquare size={40} className="opacity-30" />
                  <p className="font-semibold text-sm">Belum ada responden yang mengisi kuesioner ini.</p>
                </div>
              ) : (
                questions.map((q, i) => {
                  const { stats, essayAnswers } = getStats(q);
                  const answered = answeredCount(q);
                  const typeIcon = q.type === 'radio' ? <CircleDot size={14} /> : q.type === 'checkbox' ? <CheckSquare size={14} /> : <AlignLeft size={14} />;
                  const typeLabel = q.type === 'radio' ? 'Pilihan Ganda' : q.type === 'checkbox' ? 'Kotak Centang' : 'Esai';
                  const typeColor = q.type === 'radio' ? 'bg-indigo-50 text-indigo-500' : q.type === 'checkbox' ? 'bg-cyan-50 text-cyan-500' : 'bg-amber-50 text-amber-500';

                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow space-y-6"
                    >
                      {/* Question Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <div>
                            <h4 className="font-bold text-slate-800 leading-snug">{q.title || <em className="text-slate-400">Pertanyaan tanpa judul</em>}</h4>
                            <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${typeColor}`}>
                              {typeIcon} {typeLabel}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-black text-slate-800">{answered}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">dari {responses.length} responden</p>
                        </div>
                      </div>

                      {/* Chart / Answers */}
                      {q.type === 'essay' ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                          {essayAnswers.length === 0
                            ? <p className="text-sm text-slate-400 italic text-center py-6">Belum ada jawaban teks.</p>
                            : essayAnswers.map((ea, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1.5">{ea.name}{ea.nim ? ` · ${ea.nim}` : ''}</p>
                                <p className="text-sm text-slate-700 leading-relaxed">"{ea.val}"</p>
                              </div>
                            ))
                          }
                        </div>
                      ) : q.type === 'checkbox' ? (
                        <HBarChart options={q.options} stats={stats} totalResponses={responses.length} />
                      ) : (
                        <DonutChart options={q.options} stats={stats} totalResponses={responses.length} />
                      )}
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ── INDIVIDUAL TAB ── */}
          {activeTab === 'individual' && (
            <motion.div
              key="individual"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            >
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center bg-slate-50/50">
                <div className="relative flex-1 w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau NIM..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-400">{filteredResponses.length} responden</span>
                  <button onClick={expandAll} className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">Buka Semua</button>
                  <button onClick={collapseAll} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Tutup Semua</button>
                </div>
              </div>

              {/* Scrollable list */}
              {filteredResponses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <Users size={40} className="opacity-30" />
                  <p className="font-semibold text-sm">{searchQuery ? 'Tidak ada responden yang cocok.' : 'Belum ada responden.'}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredResponses.map((resp, idx) => {
                    const isOpen = !!expandedIds[resp.id];
                    const answeredQs = questions.filter(q => {
                      const v = resp.answers[q.id];
                      return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
                    }).length;
                    return (
                      <div key={resp.id} className="transition-colors">
                        {/* Row header — always visible */}
                        <button
                          onClick={() => toggleExpand(resp.id)}
                          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors group"
                        >
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {(resp.user?.name || '?')[0].toUpperCase()}
                          </div>
                          {/* Identity */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{resp.user?.name || 'Anonim'}</p>
                            <p className="text-xs text-slate-400 font-medium">
                              {resp.user?.nim ? `NIM: ${resp.user.nim} · ` : ''}
                              {new Date(resp.created).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          {/* Completion badge */}
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                            answeredQs === questions.length ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {answeredQs}/{questions.length} dijawab
                          </span>
                          {/* Chevron */}
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {/* Expanded answers */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/60 border-t border-slate-100">
                                {questions.map((q, i) => {
                                  let val = resp.answers[q.id];
                                  const hasAnswer = val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0);
                                  if (Array.isArray(val)) val = val.join(', ');
                                  return (
                                    <div key={q.id} className="pt-3 space-y-1">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider line-clamp-1" title={q.title}>
                                        <span className="mr-1 text-indigo-400">{i + 1}.</span>{q.title}
                                      </p>
                                      <div className={`px-3 py-2.5 rounded-xl text-sm font-medium leading-snug ${
                                        hasAnswer
                                          ? 'bg-white border border-slate-200 text-slate-800'
                                          : 'bg-white border border-dashed border-slate-200 text-slate-400 italic'
                                      }`}>
                                        {hasAnswer ? val : 'Tidak dijawab'}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
