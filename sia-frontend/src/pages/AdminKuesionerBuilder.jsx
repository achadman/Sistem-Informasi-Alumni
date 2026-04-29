import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash2, GripVertical, 
  CheckSquare, CircleDot, AlignLeft, Settings2, Loader2, X 
} from 'lucide-react';
import { pb } from '../lib/pb';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminKuesionerBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
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
    } catch (err) {
      console.error(err);
      navigate('/admin/kuesioner');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestionnaire = async () => {
    try {
      setSaving(true);
      await pb.collection('questionnaires').update(id, {
        title: questionnaire.title,
        description: questionnaire.description,
        is_active: questionnaire.is_active
      });

      // Save all questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const data = {
          questionnaire_id: id,
          title: q.title,
          type: q.type,
          options: q.options || [],
          is_required: q.is_required,
          order: i
        };

        if (q.id && !q.id.startsWith('new_')) {
          await pb.collection('questions').update(q.id, data);
        } else {
          const res = await pb.collection('questions').create(data);
          q.id = res.id;
        }
      }
      
      navigate('/admin/kuesioner');
    } catch(err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan kuesioner.");
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const newQ = {
      id: `new_${Date.now()}`,
      title: 'Pertanyaan Baru',
      type: 'radio',
      options: ['Opsi 1'],
      is_required: true,
      order: questions.length
    };
    setQuestions([...questions, newQ]);
  };

  const deleteQuestion = async (qId) => {
    if(!window.confirm("Hapus pertanyaan ini?")) return;
    
    if(!qId.startsWith('new_')) {
      try {
        await pb.collection('questions').delete(qId);
      } catch(e) {
        console.error(e);
      }
    }
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestion = (qId, field, value) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId, optIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIndex] = value;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const addOption = (qId) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: [...q.options, `Opsi ${q.options.length + 1}`] };
      }
      return q;
    }));
  };

  const removeOption = (qId, optIndex) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = q.options.filter((_, i) => i !== optIndex);
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-40">
        <button onClick={() => navigate('/admin/kuesioner')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors text-sm">
          <ArrowLeft size={18} /> Kembali
        </button>
        <button 
          onClick={handleSaveQuestionnaire}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-50 text-sm shadow-md"
        >
          {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} 
          SIMPAN KUESIONER
        </button>
      </div>

      {/* Header Config */}
      <div className="bg-white rounded-xl p-8 border-l-4 border-l-blue-600 shadow-sm border border-slate-200">
        <input 
          type="text" 
          value={questionnaire.title} 
          onChange={(e) => setQuestionnaire({...questionnaire, title: e.target.value})}
          className="w-full text-3xl font-bold text-slate-900 border-none outline-none placeholder:text-slate-300 mb-3 bg-transparent focus:ring-0 p-0"
          placeholder="Judul Kuesioner"
        />
        <textarea 
          value={questionnaire.description}
          onChange={(e) => setQuestionnaire({...questionnaire, description: e.target.value})}
          className="w-full text-slate-500 border-none outline-none placeholder:text-slate-300 bg-transparent focus:ring-0 p-0 resize-none h-16 text-sm"
          placeholder="Tuliskan deskripsi singkat atau instruksi kuesioner..."
        />
        
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Status Kuesioner</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={questionnaire.is_active} 
              onChange={(e) => setQuestionnaire({...questionnaire, is_active: e.target.checked})}
              className="sr-only peer" 
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
            <span className="ml-3 text-xs font-bold text-slate-600 tracking-wide uppercase">{questionnaire.is_active ? 'Aktif' : 'Draft'}</span>
          </label>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <AnimatePresence>
          {questions.map((q, index) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm relative group focus-within:border-blue-300 transition-all"
            >
              <div className="absolute top-2 left-0 w-full flex justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-slate-300">
                <GripVertical size={16} />
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start mt-2">
                <div className="flex-1 w-full">
                  <input 
                    type="text" 
                    value={q.title} 
                    onChange={(e) => updateQuestion(q.id, 'title', e.target.value)}
                    placeholder="Tuliskan pertanyaan di sini..."
                    className="w-full text-base font-bold text-slate-800 border-b border-slate-100 focus:border-blue-500 outline-none py-2 px-0 bg-transparent transition-colors"
                  />
                </div>
                
                <div className="w-full md:w-48 shrink-0">
                  <select 
                    value={q.type} 
                    onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
                  >
                    <option value="radio">Pilihan Ganda</option>
                    <option value="checkbox">Kotak Centang</option>
                    <option value="essay">Jawaban Esai</option>
                  </select>
                </div>
              </div>

              {/* Options Area */}
              <div className="mt-6 space-y-3">
                {q.type === 'essay' ? (
                  <div className="border-b border-dashed border-slate-200 py-3 w-1/2 text-slate-400 text-sm italic">
                    Teks jawaban panjang oleh alumni...
                  </div>
                ) : (
                  <>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3 group/opt">
                        {q.type === 'radio' ? <CircleDot size={18} className="text-slate-300"/> : <CheckSquare size={18} className="text-slate-300"/>}
                        <input 
                          type="text" 
                          value={opt} 
                          onChange={(e) => updateOption(q.id, oIdx, e.target.value)}
                          className="flex-1 outline-none border-b border-transparent focus:border-blue-400 hover:border-slate-100 py-1 transition-colors text-sm text-slate-700"
                        />
                        <button 
                          onClick={() => removeOption(q.id, oIdx)}
                          className="opacity-0 group-hover/opt:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 pt-2">
                       {q.type === 'radio' ? <CircleDot size={18} className="text-slate-200"/> : <CheckSquare size={18} className="text-slate-200"/>}
                       <button onClick={() => addOption(q.id)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wide">
                         + Tambahkan opsi
                       </button>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-8 pt-4 border-t border-slate-50 flex justify-end items-center gap-6">
                <button 
                  onClick={() => deleteQuestion(q.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus Pertanyaan"
                >
                  <Trash2 size={18} />
                </button>
                <div className="w-px h-5 bg-slate-200"></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wajib diisi</span>
                  <input 
                    type="checkbox" 
                    checked={q.is_required} 
                    onChange={(e) => updateQuestion(q.id, 'is_required', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-100 cursor-pointer"
                  />
                </label>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={addQuestion}
          className="flex items-center gap-2 px-10 py-4 bg-white text-slate-500 border-2 border-dashed border-slate-200 rounded-xl font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm text-sm"
        >
          <Plus size={20} /> TAMBAH PERTANYAAN BARU
        </button>
      </div>

    </div>
  );
}
