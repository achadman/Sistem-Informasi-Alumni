import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Save, Loader2, Calendar, FileQuestion } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pb } from '../lib/pb';

export default function TracerStudy() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [config, setConfig] = useState({
    loading: true,
    active: false,
    questionnaire: null,
    error: null
  });
  
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchActiveQuestionnaire();
  }, []);

  const fetchActiveQuestionnaire = async () => {
    try {
      const records = await pb.collection('questionnaires').getFullList({
        filter: 'is_active = true',
        sort: '-id',
        limit: 1,
        requestKey: null,
      });

      if (records.length > 0) {
        const q = records[0];
        
        // check if user already submitted this questionnaire
        try {
           const existing = await pb.collection('questionnaire_responses').getFirstListItem(`questionnaire_id='${q.id}' && user_id='${user.id}'`, { requestKey: null });
           if (existing) {
             setSubmitted(true);
             setConfig({ loading: false, active: true, questionnaire: q });
             return;
           }
        } catch(e) {
           // not submitted yet, proceed
        }

        const qsData = await pb.collection('questions').getFullList({
          filter: `questionnaire_id = '${q.id}'`,
          sort: 'order',
          requestKey: null,
        });

        // Initialize answers state
        const initialAnswers = {};
        qsData.forEach(question => {
          initialAnswers[question.id] = question.type === 'checkbox' ? [] : '';
        });

        setQuestions(qsData);
        setAnswers(initialAnswers);
        setConfig({
          loading: false,
          active: true,
          questionnaire: q,
          error: null
        });
      } else {
        setConfig({ loading: false, active: false, questionnaire: null });
      }
    } catch (err) {
      console.error(err);
      setConfig({ loading: false, active: false, questionnaire: null });
    }
  };

  const handleRadioChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleCheckboxChange = (qId, value, checked) => {
    setAnswers(prev => {
      const current = prev[qId] || [];
      if (checked) {
        return { ...prev, [qId]: [...current, value] };
      } else {
        return { ...prev, [qId]: current.filter(v => v !== value) };
      }
    });
  };

  const handleTextChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const submitTracer = async (e) => {
    e.preventDefault();
    
    // Validation
    for (let q of questions) {
      if (q.is_required) {
        const val = answers[q.id];
        if (q.type === 'checkbox' && val.length === 0) {
          alert(`Pertanyaan "${q.title}" wajib diisi.`);
          return;
        }
        if ((q.type === 'radio' || q.type === 'essay') && !val) {
          alert(`Pertanyaan "${q.title}" wajib diisi.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Create Response Record
      const responseRecord = await pb.collection('questionnaire_responses').create({
        questionnaire_id: config.questionnaire.id,
        user_id: user.id
      });

      // 2. Create Answer Records
      for (let q of questions) {
        const val = answers[q.id];
        // Only save if there's an answer (or save empty if required, already validated above)
        if (val !== '' && !(Array.isArray(val) && val.length === 0)) {
          await pb.collection('answers').create({
            response_id: responseRecord.id,
            question_id: q.id,
            value: val
          });
        }
      }
      
      setSubmitted(true);
      window.scrollTo(0,0);
    } catch (error) {
       console.error(error);
       alert('Gagal menyimpan data kuesioner. Silakan coba lagi nanti.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (config.loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold">Menyinkronkan sesi kuesioner...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500 mt-10">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-16 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
           <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-inner">
              <CheckCircle2 size={48} />
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Terima Kasih!</h1>
           <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-10 text-lg">
             Anda telah menyelesaikan pengisian <b>{config.questionnaire?.title}</b>. Data Anda sangat berharga bagi evaluasi dan pengembangan institusi.
           </p>
           <button 
             onClick={() => navigate('/')}
             className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl active:scale-95 transition-all"
           >
             Kembali ke Dashboard
           </button>
        </div>
      </div>
    );
  }

  if (!config.active || !config.questionnaire) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500 mt-10">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-16 text-center">
           <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100">
              <Calendar size={48} />
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Belum Ada Kuesioner Aktif</h1>
           <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-10 text-lg">
             Mohon maaf, saat ini tidak ada sesi pengisian Tracer Study atau Kuesioner yang dibuka. Silakan kembali lagi nanti.
           </p>
           <button 
             onClick={() => navigate('/')}
             className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl active:scale-95 transition-all"
           >
             Kembali ke Dashboard
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="bg-white rounded-3xl p-10 border-t-8 border-brand-primary shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{config.questionnaire.title}</h1>
        <p className="text-slate-600 mt-4 leading-relaxed font-medium whitespace-pre-wrap">
          {config.questionnaire.description}
        </p>
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-sm text-brand-primary font-bold">
          <FileQuestion size={18} /> Terdapat {questions.length} Pertanyaan
        </div>
      </header>
      
      <form onSubmit={submitTracer} className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-start gap-1">
               <span>{q.title}</span>
               {q.is_required && <span className="text-red-500 text-xl leading-none">*</span>}
             </h3>

             <div className="space-y-3 mt-4 pl-2">
               {q.type === 'radio' && q.options.map((opt, oIdx) => (
                 <label key={oIdx} className="flex items-center gap-3 cursor-pointer group">
                   <input 
                     type="radio" 
                     name={`question_${q.id}`} 
                     value={opt}
                     checked={answers[q.id] === opt}
                     onChange={() => handleRadioChange(q.id, opt)}
                     className="w-5 h-5 text-brand-primary focus:ring-brand-primary border-slate-300"
                   />
                   <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{opt}</span>
                 </label>
               ))}

               {q.type === 'checkbox' && q.options.map((opt, oIdx) => (
                 <label key={oIdx} className="flex items-center gap-3 cursor-pointer group">
                   <input 
                     type="checkbox" 
                     value={opt}
                     checked={answers[q.id]?.includes(opt)}
                     onChange={(e) => handleCheckboxChange(q.id, opt, e.target.checked)}
                     className="w-5 h-5 text-brand-primary rounded focus:ring-brand-primary border-slate-300"
                   />
                   <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{opt}</span>
                 </label>
               ))}

               {q.type === 'essay' && (
                 <textarea
                   value={answers[q.id]}
                   onChange={(e) => handleTextChange(q.id, e.target.value)}
                   rows="4"
                   placeholder="Jawaban Anda..."
                   className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none text-slate-700 resize-none bg-slate-50 focus:bg-white transition-colors"
                 ></textarea>
               )}
             </div>
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting || questions.length === 0}
            className="px-10 py-4 rounded-2xl font-black text-white bg-brand-primary shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <><Loader2 size={20} className="animate-spin" /> Menyimpan...</>
            ) : (
              <>Kirim Jawaban <Save size={20} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
