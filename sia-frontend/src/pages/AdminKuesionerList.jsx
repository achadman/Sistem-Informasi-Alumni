import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, BarChart2, Calendar, FileQuestion, Clock, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { pb } from '../lib/pb';
import { motion } from 'framer-motion';

export default function AdminKuesionerList() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const fetchQuestionnaires = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('questionnaires').getFullList({
        sort: '-id',
        requestKey: null,
      });
      setQuestionnaires(records);
    } catch (error) {
      console.error("Failed to fetch questionnaires:", error);
      alert("Error fetching list: " + error.message + " | " + JSON.stringify(error?.response || {}));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const record = await pb.collection('questionnaires').create({
        title: 'Kuesioner Baru',
        description: 'Deskripsi kuesioner...',
        is_active: false
      });
      navigate(`/admin/kuesioner/${record.id}/edit`);
    } catch (error) {
      console.error("Error creating questionnaire", error);
      alert("Gagal membuat kuesioner. Pastikan migrasi database sudah berjalan.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Apakah Anda yakin ingin menghapus kuesioner ini? Semua pertanyaan dan jawaban akan ikut terhapus.")) return;
    try {
      await pb.collection('questionnaires').delete(id);
      setQuestionnaires(questionnaires.filter(q => q.id !== id));
    } catch(err) {
      alert("Gagal menghapus kuesioner.");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold">Memuat daftar kuesioner...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileQuestion className="text-brand-primary" size={32} /> Manajemen Kuesioner
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Buat dan kelola kuesioner/tracer study dinamis untuk alumni.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          disabled={creating}
          className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {creating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />} 
          Buat Kuesioner Baru
        </button>
      </div>

      {questionnaires.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <FileQuestion size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Belum ada Kuesioner</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Anda belum membuat kuesioner apapun. Buat kuesioner baru untuk mulai mengumpulkan data dari alumni.</p>
          <button onClick={handleCreateNew} className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
            Mulai Buat Kuesioner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionnaires.map((q) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-soft hover:shadow-xl transition-all group flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`px-3 py-1 text-xs font-bold rounded-full border ${q.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {q.is_active ? 'Aktif' : 'Draft / Tidak Aktif'}
                </div>
                <button onClick={() => handleDelete(q.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2 line-clamp-2">{q.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">{q.description}</p>

              <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
                <button 
                  onClick={() => navigate(`/admin/kuesioner/${q.id}/edit`)}
                  className="flex flex-col items-center gap-1.5 p-2 text-slate-400 hover:text-brand-primary transition-colors flex-1"
                >
                  <Edit2 size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Builder</span>
                </button>
                <div className="w-px h-8 bg-slate-100 mx-2"></div>
                <button 
                  onClick={() => navigate(`/admin/kuesioner/${q.id}/results`)}
                  className="flex flex-col items-center gap-1.5 p-2 text-slate-400 hover:text-emerald-500 transition-colors flex-1"
                >
                  <BarChart2 size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Hasil</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
