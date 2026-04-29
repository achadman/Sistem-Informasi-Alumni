import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BarChart2, MessageSquare, Download, Loader2 } from 'lucide-react';
import { pb } from '../lib/pb';

export default function AdminKuesionerResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const qData = await pb.collection('questionnaires').getOne(id, { requestKey: null });
      setQuestionnaire(qData);

      const qsData = await pb.collection('questions').getFullList({
        filter: `questionnaire_id = '${id}'`,
        sort: 'order',
        requestKey: null,
      });
      setQuestions(qsData);

      // Fetch all responses with user relation
      const respData = await pb.collection('questionnaire_responses').getFullList({
        filter: `questionnaire_id = '${id}'`,
        expand: 'user_id',
        requestKey: null,
      });
      
      // Fetch answers
      const answersData = await pb.collection('answers').getFullList({
        filter: `question_id.questionnaire_id = '${id}'`,
        requestKey: null,
      });

      // Group answers by response
      const formattedResponses = respData.map(r => {
        const userAnswers = answersData.filter(a => a.response_id === r.id);
        const ansMap = {};
        userAnswers.forEach(a => {
           ansMap[a.question_id] = a.value;
        });
        return {
          id: r.id,
          user: r.expand?.user_id,
          answers: ansMap,
          created: r.created
        };
      });

      setResponses(formattedResponses);

    } catch (err) {
      console.error(err);
      alert("Gagal memuat hasil.");
      navigate('/admin/kuesioner');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Basic CSV Export
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    const headers = ["Nama Lengkap", "NIM", "Email", "Tanggal Isi", ...questions.map(q => `"${q.title}"`)];
    csvContent += headers.join(",") + "\n";

    // Data rows
    responses.forEach(r => {
      const user = r.user || {};
      const row = [
        `"${user.name || '-'}"`,
        `"${user.nim || '-'}"`,
        `"${user.email || '-'}"`,
        `"${new Date(r.created).toLocaleDateString('id-ID')}"`
      ];
      questions.forEach(q => {
        let val = r.answers[q.id];
        if (Array.isArray(val)) val = val.join('; ');
        row.push(`"${val || ''}"`);
      });
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${questionnaire?.title || 'kuesioner'}_results.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <button onClick={() => navigate('/admin/kuesioner')} className="flex items-center gap-2 text-brand-primary hover:text-blue-800 font-bold mb-2 text-sm transition-colors">
            <ArrowLeft size={16} /> Kembali ke Daftar Kuesioner
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
             Hasil: {questionnaire?.title}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">{responses.length} alumni telah mengisi kuesioner ini.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <Download size={20} /> Ekspor CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-14 h-14 bg-blue-50 text-brand-primary rounded-2xl flex items-center justify-center"><Users size={28}/></div>
           <div>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Responden</p>
             <h3 className="text-3xl font-black text-slate-800">{responses.length}</h3>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><BarChart2 className="text-brand-primary" /> Detail Jawaban</h3>
         </div>
         <div className="p-6 space-y-12">
            {questions.map((q, i) => {
               // Calculate aggregate stats for radio/checkbox
               let stats = {};
               let essayAnswers = [];

               if (q.type === 'radio' || q.type === 'checkbox') {
                 q.options.forEach(opt => stats[opt] = 0);
                 responses.forEach(r => {
                   const val = r.answers[q.id];
                   if (val) {
                     if (Array.isArray(val)) {
                       val.forEach(v => { if (stats[v] !== undefined) stats[v]++; });
                     } else {
                       if (stats[val] !== undefined) stats[val]++;
                     }
                   }
                 });
               } else {
                 responses.forEach(r => {
                   if (r.answers[q.id]) {
                     essayAnswers.push({ name: r.user?.name, val: r.answers[q.id] });
                   }
                 });
               }

               return (
                 <div key={q.id} className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-800 flex gap-3">
                      <span className="text-slate-300">{i + 1}.</span> {q.title}
                    </h4>
                    
                    {q.type === 'essay' ? (
                       <div className="bg-slate-50 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-3 custom-scrollbar border border-slate-100">
                          {essayAnswers.length === 0 ? <p className="text-sm text-slate-400 italic">Belum ada jawaban teks.</p> : null}
                          {essayAnswers.map((ea, idx) => (
                             <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                               <p className="text-xs font-bold text-brand-primary mb-1">{ea.name}</p>
                               <p className="text-sm text-slate-700">{ea.val}</p>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="space-y-3 pl-8">
                          {q.options.map((opt, oIdx) => {
                             const count = stats[opt] || 0;
                             const percentage = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
                             return (
                               <div key={oIdx} className="flex items-center gap-4">
                                  <div className="w-1/3 text-sm font-medium text-slate-600 truncate" title={opt}>{opt}</div>
                                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                     <div className="h-full bg-brand-primary rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                  </div>
                                  <div className="w-16 text-right text-sm font-bold text-slate-700">{count} <span className="text-xs text-slate-400">({percentage}%)</span></div>
                               </div>
                             );
                          })}
                       </div>
                    )}
                 </div>
               );
            })}
            
            {questions.length === 0 && (
              <div className="text-center py-10 text-slate-400 font-medium">
                Belum ada pertanyaan di kuesioner ini.
              </div>
            )}
         </div>
      </div>

    </div>
  );
}
