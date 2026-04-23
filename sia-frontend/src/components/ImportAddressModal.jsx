import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, PlayCircle, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import { pb } from '../lib/pb';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 'prov', name: 'Provinsi', coll: 'provinces', desc: 'File: prov.csv', level: 1 },
  { id: 'reg', name: 'Kota/Kab', coll: 'regencies', desc: 'File: kotakab.csv', level: 2 },
  { id: 'dist', name: 'Kecamatan', coll: 'districts', desc: 'File: kec.csv', level: 3 },
  { id: 'vill', name: 'Kel/Desa', coll: 'villages', desc: 'File: kel.csv', level: 4 },
];

const CHUNK_SIZE = 100; // Process 100 records per batch

export default function ImportAddressModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  
  // Progress state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0, success: 0, errors: 0 });
  const [logs, setLogs] = useState([]);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setProgress({ total: 0, current: 0, success: 0, errors: 0 });
    setLogs([]);
    setIsProcessing(false);
  };

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    
    setFile(selected);
    addLog(`File dipilih: ${selected.name}`, 'info');
    
    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          addLog(`Peringatan parsing: ${results.errors[0].message}`, 'error');
        }
        
        // Auto-map Indonesian headers to our schema if needed
        const mappedData = results.data.map(row => {
          // Normalize keys to lowercase for matching, strip BOM if present
          const keys = Object.keys(row);
          const getVal = (possibleKeys) => {
            const key = keys.find(k => possibleKeys.includes(k.replace(/^\uFEFF/, '').toLowerCase().trim()));
            return key ? row[key] : null;
          };

          const rawId = getVal(['id', 'kode', 'id_wilayah', 'code']);
          const name = getVal(['name', 'nama', 'wilayah']);

          
          const payload = { 
            id_wilayah: rawId ? String(rawId).trim() : '', 
            name: name ? String(name).trim() : ''
          };

          if (STEPS[currentStep].level > 1) {
            let parent_id = '';
            if (rawId) {
              const parts = String(rawId).split('.');
              parent_id = parts.slice(0, -1).join('.');
            }
            payload.parent_id = parent_id;
          }

          return payload;
        }).filter(item => item.id_wilayah && item.name); // basic validation

        setParsedData(mappedData);
        setProgress(prev => ({ ...prev, total: mappedData.length }));
        addLog(`Ditemukan ${mappedData.length} baris valid.`, 'success');
      },
      error: (err) => {
        addLog(`Gagal membaca CSV: ${err.message}`, 'error');
      }
    });
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const startImport = async () => {
    if (parsedData.length === 0) return;
    
    setIsProcessing(true);
    addLog(`Memulai proses import ke koleksi ${STEPS[currentStep].coll}...`, 'info');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process in chunks
    for (let i = 0; i < parsedData.length; i += CHUNK_SIZE) {
      const chunk = parsedData.slice(i, i + CHUNK_SIZE);
      
      const promises = chunk.map(async (item) => {
        try {
          await pb.collection(STEPS[currentStep].coll).create(item, { $autoCancel: false });
          return { success: true };
        } catch (err) {
          let errorDetail = err.message;
          if (err.response?.data) {
             // Extract specific validation errors from PB
             const fields = Object.values(err.response.data)
                .map(field => field.message)
                .join(', ');
             if (fields) errorDetail += `: ${fields}`;
          }
          return { success: false, id: item.id_wilayah, msg: err.status === 400 ? `Validasi/Duplikat (${errorDetail})` : err.message };
        }
      });

      const results = await Promise.all(promises);
      
      const chunkSuccess = results.filter(r => r.success).length;
      results.filter(r => !r.success).forEach(r => {
         addLog(`Gagal pada ID ${r.id}: ${r.msg}`, 'error');
      });
      const chunkErrors = results.filter(r => !r.success).length;
      
      successCount += chunkSuccess;
      errorCount += chunkErrors;
      
      setProgress(prev => ({ 
        ...prev, 
        current: i + chunk.length,
        success: successCount,
        errors: errorCount
      }));

      // Small delay to prevent network stack overwhelm
      await delay(50);
    }

    addLog(`Selesai! Berhasil: ${successCount}. Lewati/Gagal: ${errorCount}.`, 'success');
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  const currentDef = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isProcessing && onClose()} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Import CSV Wilayah Hierarkis</h2>
            <p className="text-sm text-slate-500 font-medium">Lakukan secara berurutan sesuai level administratif.</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="p-2 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Steps */}
          <div className="w-1/3 bg-slate-50 p-6 border-r border-slate-100 flex flex-col gap-2 overflow-y-auto hidden sm:flex">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <button
                  key={step.id}
                  disabled={isProcessing}
                  onClick={() => { setCurrentStep(idx); resetState(); }}
                  className={`flex flex-col p-4 rounded-2xl text-left transition-all border ${
                    isActive ? 'bg-white border-blue-200 shadow-md shadow-blue-100/50 relative z-10' : 
                    isPast ? 'bg-emerald-50 border-emerald-100/50 opacity-70 hover:opacity-100' : 
                    'bg-transparent border-transparent hover:bg-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isActive ? 'bg-brand-primary text-white' : 
                      isPast ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isPast ? <CheckCircle2 size={12} /> : idx + 1}
                    </span>
                    <span className={`font-black tracking-wide uppercase text-xs ${
                      isActive ? 'text-brand-primary' : isPast ? 'text-emerald-700' : 'text-slate-500'
                    }`}>
                      Level {step.level}
                    </span>
                  </div>
                  <strong className={`block text-lg mt-1 ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{step.name}</strong>
                  <span className="text-xs font-medium text-slate-400 mt-0.5">{step.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 flex flex-col overflow-y-auto">
            {/* Upload Area */}
            <div className="mb-6">
               <h3 className="text-lg font-black text-slate-800 mb-1">Tahap {currentDef.level}: {currentDef.name}</h3>
               <p className="text-sm text-slate-500 mb-4">Pastikan file memiliki header (misal: "id", "name"). Induk wilayah dihitung otomatis dari titik (.).</p>
               
               <div 
                 onClick={() => !isProcessing && fileInputRef.current?.click()}
                 className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                   file ? 'border-brand-primary bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50 cursor-pointer'
                 }`}
               >
                 <input 
                   type="file" 
                   accept=".csv" 
                   className="hidden" 
                   ref={fileInputRef} 
                   onChange={handleFileSelect}
                   disabled={isProcessing}
                 />
                 
                 {file ? (
                   <div className="flex items-center justify-center gap-3 text-brand-primary">
                     <FileText size={32} />
                     <div className="text-left">
                       <p className="font-bold">{file.name}</p>
                       <p className="text-sm opacity-80">{parsedData.length} baris CSV dibaca</p>
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-3 text-slate-400">
                     <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                       <Upload size={24} className="text-slate-300" />
                     </div>
                     <div>
                       <p className="font-bold text-slate-600">Pilih File {currentDef.desc}</p>
                       <p className="text-xs mt-1">Hanya mendukung format .csv</p>
                     </div>
                   </div>
                 )}
               </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-4 py-4 border-y border-slate-100 mb-6 bg-white sticky top-0 z-10">
              <div className="flex-1">
                 {parsedData.length > 0 && !isProcessing && progress.total > 0 && progress.current === 0 && (
                   <button 
                     onClick={startImport}
                     className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                   >
                     <PlayCircle size={18} /> Mulai Proses Import
                   </button>
                 )}
                 {isProcessing && (
                   <div className="flex items-center gap-3 text-brand-primary font-bold">
                     <Loader2 className="animate-spin" size={20} />
                     <span>Memproses Batch... ({progress.current}/{progress.total})</span>
                   </div>
                 )}
                 {progress.current === progress.total && progress.total > 0 && !isProcessing && (
                   <div className="flex items-center gap-3">
                     <div className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
                       <CheckCircle2 size={18} /> Selesai!
                     </div>
                     {currentStep < 3 && (
                       <button onClick={() => { setCurrentStep(p => p + 1); resetState(); }} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all">
                         Lanjut Level Berikutnya <ArrowRight size={16} />
                       </button>
                     )}
                   </div>
                 )}
              </div>
              
              {/* Progress Stats */}
              {(progress.current > 0 || isProcessing) && (
                 <div className="flex items-center gap-4 text-sm font-bold">
                   <div className="flex flex-col items-end">
                     <span className="text-slate-400 text-[10px] uppercase tracking-widest">Sukses</span>
                     <span className="text-emerald-600">{progress.success}</span>
                   </div>
                   <div className="w-px h-8 bg-slate-100"></div>
                   <div className="flex flex-col items-start">
                     <span className="text-slate-400 text-[10px] uppercase tracking-widest">Gagal/Lewati</span>
                     <span className="text-amber-500">{progress.errors}</span>
                   </div>
                 </div>
              )}
            </div>

            {/* Progress Bar Visual */}
            {(progress.total > 0) && (
              <div className="mb-6">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-primary transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Logs Window */}
            <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden flex flex-col shadow-inner">
              <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center text-xs font-mono text-slate-400 pointer-events-none sticky top-0">
                <span>Terminal Output</span>
                {parsedData.length > 0 && <span>Total: {parsedData.length} records</span>}
              </div>
              <div className="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-1">
                {logs.length === 0 ? (
                  <span className="text-slate-600 italic">Menunggu file dipilih...</span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 opacity-90 animate-in fade-in slide-in-from-bottom-1">
                      <span className="text-slate-500 flex-shrink-0">[{log.time}]</span>
                      <span className={`${
                        log.type === 'error' ? 'text-red-400' : 
                        log.type === 'success' ? 'text-emerald-400' : 
                        'text-blue-300'
                      } break-words flex-1`}>
                        {log.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
