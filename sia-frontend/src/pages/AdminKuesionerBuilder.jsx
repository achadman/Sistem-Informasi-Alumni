import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash2, GripVertical, 
  CheckSquare, CircleDot, AlignLeft, Settings2, Loader2, X, Copy, ChevronDown
} from 'lucide-react';
import { pb } from '../lib/pb';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { notify } from '../lib/notifications';

const QUESTION_TYPES = [
  { id: 'radio', label: 'Pilihan Ganda', icon: CircleDot },
  { id: 'checkbox', label: 'Kotak Centang', icon: CheckSquare },
  { id: 'essay', label: 'Jawaban Singkat / Paragraf', icon: AlignLeft }
];

const CustomTypeSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = QUESTION_TYPES.find(o => o.id === value) || QUESTION_TYPES[0];
  const Icon = selectedOpt.icon;

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-slate-400" />
          {selectedOpt.label}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1"
          >
            {QUESTION_TYPES.map(o => {
              const ItemIcon = o.icon;
              return (
                <div 
                  key={o.id}
                  onClick={() => { onChange(o.id); setIsOpen(false); }}
                  className={`px-4 py-3 text-sm font-bold flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${o.id === value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                >
                  <ItemIcon size={16} className={o.id === value ? 'text-blue-600' : 'text-slate-400'} />
                  {o.label}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminKuesionerBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeQId, setActiveQId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [id]);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      const qData = await pb.collection('questionnaires').getOne(id, { requestKey: null });
      setQuestionnaire(qData);

      const qsData = await pb.collection('questions').getFullList({
        filter: `questionnaire_id = '${id}'`,
        sort: 'order',
        requestKey: null
      });
      setQuestions(qsData);
      if (qsData.length > 0) setActiveQId(qsData[0].id);
    } catch (err) {
      const isAbort = err.name === 'AbortError' || err.isAbort || err.message?.toLowerCase().includes('abort') || err.message?.toLowerCase().includes('autocancel');
      if (!isAbort) {
        console.error(err);
        navigate('/admin/kuesioner');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestionnaire = async () => {
    try {
      setSaving(true);
      
      // 1. Update main questionnaire
      await pb.collection('questionnaires').update(id, {
        title: questionnaire.title,
        description: questionnaire.description,
        is_active: questionnaire.is_active
      });

      // 2. Save all questions
      const savePromises = questions.map(async (q, i) => {
        const data = {
          questionnaire_id: id,
          title: q.title || 'Pertanyaan Tanpa Judul',
          type: q.type,
          options: q.options || [],
          is_required: !!q.is_required,
          order: i
        };

        try {
          if (q.id && !q.id.startsWith('new_')) {
            await pb.collection('questions').update(q.id, data);
          } else {
            await pb.collection('questions').create(data);
          }
        } catch (qErr) {
          console.error(`Error saving question ${i}:`, qErr);
          throw new Error(`Gagal menyimpan pertanyaan #${i + 1}: ${qErr.message}`);
        }
      });

      await Promise.all(savePromises);
      
      notify.success("Kuesioner berhasil disimpan!");
      // Re-fetch to get clean IDs for new questions
      fetchData();
    } catch(err) {
      console.error('Save failed:', err);
      const errorMsg = err.data?.message || err.message || "Terjadi kesalahan saat menyimpan.";
      notify.error(`Gagal menyimpan: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const newId = `new_${Date.now()}`;
    const newQ = {
      id: newId,
      title: '',
      type: 'radio',
      options: ['Opsi 1'],
      is_required: false,
      order: questions.length
    };
    setQuestions([...questions, newQ]);
    setActiveQId(newId);
    
    // Auto scroll to bottom
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const duplicateQuestion = (q) => {
    const newId = `new_${Date.now()}`;
    const dupQ = { ...q, id: newId, title: q.title ? `${q.title} (Salinan)` : '' };
    
    // Insert after the duplicated question
    const index = questions.findIndex(item => item.id === q.id);
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, dupQ);
    
    setQuestions(newQuestions);
    setActiveQId(newId);
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
    const filtered = questions.filter(q => q.id !== qId);
    setQuestions(filtered);
    if (activeQId === qId && filtered.length > 0) {
      setActiveQId(filtered[0].id);
    }
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
      <div className="flex h-screen items-center justify-center bg-slate-50/50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EBF8]/30 pb-32 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 sticky top-0 z-50 shadow-sm flex items-center justify-between">
        <button onClick={() => navigate('/admin/kuesioner')} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors uppercase tracking-wider">
          <ArrowLeft size={14} /> Kembali
        </button>
        <button 
          onClick={handleSaveQuestionnaire}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-50 text-xs tracking-widest uppercase shadow-md shadow-blue-200"
        >
          {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} 
          SIMPAN FORM
        </button>
      </div>

      <div className="max-w-[1440px] mx-auto mt-8 space-y-4 px-6 lg:px-[2.5%] relative">
        
        {/* Floating Action Menu (Like Google Forms) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:bottom-auto md:top-32 md:right-[calc(50%-26rem)] z-40 bg-white border border-slate-200 shadow-xl rounded-2xl md:rounded-xl p-2 flex md:flex-col gap-2">
           <button onClick={addQuestion} className="p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative" title="Tambah Pertanyaan">
              <Plus size={20} />
           </button>
        </div>

        {/* Header Config Card */}
        <div 
          onClick={() => setActiveQId('header')}
          className={`bg-white rounded-xl p-8 border-t-8 border-t-blue-600 shadow-sm transition-all cursor-text ${activeQId === 'header' ? 'border-l-4 border-l-blue-600 ring-4 ring-blue-50' : 'border border-slate-200'}`}
        >
          <input 
            type="text" 
            value={questionnaire.title} 
            onChange={(e) => setQuestionnaire({...questionnaire, title: e.target.value})}
            className="w-full text-3xl font-black text-slate-900 border-none outline-none placeholder:text-slate-300 mb-3 bg-transparent focus:ring-0 p-0 focus:border-b-2 focus:border-b-blue-100 transition-all"
            placeholder="Judul Formulir"
          />
          <textarea 
            value={questionnaire.description}
            onChange={(e) => setQuestionnaire({...questionnaire, description: e.target.value})}
            className="w-full text-slate-600 font-medium border-none outline-none placeholder:text-slate-400 bg-transparent focus:ring-0 p-0 resize-none h-16 text-sm focus:border-b focus:border-b-slate-200 transition-all"
            placeholder="Deskripsi formulir..."
          />
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-2"><Settings2 size={14}/> Kuesioner ini {questionnaire.is_active ? 'AKTIF' : 'NONAKTIF'}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={questionnaire.is_active} onChange={(e) => setQuestionnaire({...questionnaire, is_active: e.target.checked})} className="sr-only peer" />
              <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>

        {/* Draggable Questions List */}
        <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-4">
          <AnimatePresence>
            {questions.map((q) => {
              const isActive = activeQId === q.id;
              return (
                <Reorder.Item 
                  key={q.id} 
                  value={q}
                  onClick={() => setActiveQId(q.id)}
                  className={`bg-white rounded-xl bg-clip-padding relative group transition-all duration-200 ease-in-out cursor-default
                    ${isActive ? 'shadow-lg border-l-4 border-l-blue-600 ring-4 ring-blue-50/50 my-6 scale-[1.01] z-10' : 'shadow-sm border border-slate-200 hover:shadow-md'}`}
                >
                  
                  {/* Drag Handle */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-6 flex justify-center items-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'bg-slate-50/50 rounded-t-xl' : ''}`}>
                    <GripVertical size={16} className="text-slate-300 rotate-90" />
                  </div>

                  <div className={`p-6 ${isActive ? 'pt-8' : 'pt-6'}`}>
                    {/* Top Row: Question Title & Type Select */}
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex-1 w-full">
                        <input 
                          type="text" 
                          value={q.title} 
                          onChange={(e) => updateQuestion(q.id, 'title', e.target.value)}
                          placeholder="Pertanyaan"
                          className={`w-full font-medium outline-none bg-transparent transition-all
                            ${isActive ? 'text-lg bg-slate-50 border-b-2 border-b-blue-600 px-4 py-3 rounded-t-lg' : 'text-base text-slate-800 border-b border-transparent py-2'}`}
                        />
                      </div>
                      
                      {isActive && (
                        <div className="w-full md:w-64 shrink-0">
                          <CustomTypeSelect 
                            value={q.type} 
                            onChange={(val) => updateQuestion(q.id, 'type', val)} 
                          />
                        </div>
                      )}
                    </div>

                    {/* Options Area */}
                    <div className={`mt-4 space-y-2 ${isActive ? 'ml-0' : 'ml-1'}`}>
                      {q.type === 'essay' ? (
                        <div className="border-b border-dashed border-slate-300 py-2 w-1/2 text-slate-400 text-sm mt-4">
                          Teks jawaban panjang
                        </div>
                      ) : (
                        <>
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-3 group/opt py-1">
                              {q.type === 'radio' ? <CircleDot size={20} className="text-slate-300 shrink-0"/> : <CheckSquare size={20} className="text-slate-300 shrink-0"/>}
                              
                              <input 
                                type="text" 
                                value={opt} 
                                onChange={(e) => updateOption(q.id, oIdx, e.target.value)}
                                className={`flex-1 outline-none transition-all text-sm font-medium
                                  ${isActive ? 'border-b border-slate-200 focus:border-blue-500 py-1' : 'border-none text-slate-600 bg-transparent cursor-pointer'}`}
                                readOnly={!isActive}
                              />
                              
                              {isActive && q.options.length > 1 && (
                                <button onClick={() => removeOption(q.id, oIdx)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover/opt:opacity-100">
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                          
                          {isActive && (
                            <div className="flex items-center gap-3 pt-2 mt-2">
                               {q.type === 'radio' ? <CircleDot size={20} className="text-slate-200"/> : <CheckSquare size={20} className="text-slate-200"/>}
                               <button onClick={() => addOption(q.id)} className="text-sm font-bold text-slate-500 hover:text-blue-600 border-b border-transparent hover:border-blue-600 transition-all pb-0.5">
                                 Tambahkan opsi
                               </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Bottom Action Bar - Only visible when active */}
                    {isActive && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-8 pt-4 border-t border-slate-100 flex justify-end items-center gap-4"
                      >
                        <button onClick={() => duplicateQuestion(q)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Duplikasi">
                          <Copy size={20} />
                        </button>
                        <button onClick={() => deleteQuestion(q.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Hapus">
                          <Trash2 size={20} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-2"></div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <span className="text-xs font-bold text-slate-600">Wajib diisi</span>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${q.is_required ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${q.is_required ? 'translate-x-[22px]' : 'translate-x-[4px]'}`}></div>
                          </div>
                          <input type="checkbox" className="hidden" checked={q.is_required} onChange={(e) => updateQuestion(q.id, 'is_required', e.target.checked)}/>
                        </label>
                      </motion.div>
                    )}
                  </div>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      </div>
    </div>
  );
}
