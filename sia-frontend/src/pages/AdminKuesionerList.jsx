import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit2, BarChart2, Calendar, FileQuestion, Clock, Trash2, ShieldCheck, Loader2, X, AlertTriangle } from 'lucide-react';
import { pb } from '../lib/pb';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminKuesionerList() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await pb.collection('questionnaires').delete(deleteConfirmId);
      setQuestionnaires(questionnaires.filter(q => q.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch(err) {
      alert("Gagal menghapus kuesioner.");
    } finally {
      setIsDeleting(false);
    }
  };

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
                <Link 
                  to={`/admin/kuesioner/${q.id}/edit`}
                  className="flex flex-col items-center gap-1.5 p-2 text-slate-400 hover:text-blue-600 transition-colors flex-1"
                >
                  <Edit2 size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Builder</span>
                </Link>
                <div className="w-px h-8 bg-slate-100 mx-2"></div>
                <Link 
                  to={`/admin/kuesioner/${q.id}/results`}
                  className="flex flex-col items-center gap-1.5 p-2 text-slate-400 hover:text-emerald-500 transition-colors flex-1"
                >
                  <BarChart2 size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Hasil</span>
                </Link>
              </div>
            </motion.div>
          ))}

          {/* Add New Questionnaire Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={!creating ? handleCreateNew : undefined}
            className={`rounded-[2rem] border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center min-h-[250px] transition-all cursor-pointer ${creating ? 'opacity-50' : 'hover:border-blue-400 hover:bg-blue-50/50 group'}`}
          >
            <div className="w-16 h-16 bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-full flex items-center justify-center mb-4 transition-colors">
              {creating ? <Loader2 size={32} className="animate-spin" /> : <Plus size={32} />}
            </div>
            <h3 className="text-xl font-bold text-slate-400 group-hover:text-blue-600 text-center transition-colors">
              {creating ? 'Membuat...' : 'Tambah Kuesioner'}
            </h3>
          </motion.div>
        </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => { if (!isDeleting) setDeleteConfirmId(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">Hapus Kuesioner</h3>
                    <p className="text-xs text-slate-400 font-medium">Tindakan ini tidak dapat dibatalkan</p>
                  </div>
                </div>
                {!isDeleting && (
                  <button onClick={() => setDeleteConfirmId(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5"><AlertTriangle size={16} className="text-red-600" /></div>
                  <p className="text-sm font-semibold text-red-800 leading-relaxed">
                    Apakah Anda yakin ingin menghapus kuesioner ini? Semua pertanyaan dan jawaban dari alumni akan ikut terhapus selamanya.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isDeleting ? (
                    <><Loader2 size={15} className="animate-spin" /> Menghapus...</>
                  ) : (
                    <><Trash2 size={15} /> Ya, Hapus</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
