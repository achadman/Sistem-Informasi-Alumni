import React, { useState, useRef } from 'react';
import { X, UploadCloud, Download, AlertCircle, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { pb } from '../lib/pb';

export default function ImportAlumniModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  
  // Progress state
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = [
      "nim", "nama", "tempat_lahir", "tanggal_lahir", "gender", "agama", "tahun_lulus", "golongan_darah", 
      "email", "no_hp", "alamat", "negara", "provinsi", "kota", 
      "kecamatan", "kelurahan", "rw", "rt", "status_kerja", "instansi", 
      "jabatan", "keterangan", "semester_dropout", "prodi", "fakultas", "ipk"
    ];
    
    const exampleData = [
      "201011400", "Budi Santoso", "Jakarta", "2002-05-20", "L", "Islam", "2024", "O", 
      "budi@email.com", "081234567890", "Jl. Mawar No 1", "Indonesia", "Jawa Barat", "Bandung", 
      "Coblong", "Dago", "001", "002", "Bekerja", "PT Teknologi Inovasi", 
      "Software Engineer", "Lulus", "0", "Teknik Informatika", "Fakultas Teknik", "3.85"
    ];

    const csvContent = [headers.join(","), exampleData.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Template_Import_Alumni.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setErrors(["Mohon unggah file dengan format .csv"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setParsedData(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrors(results.errors.map(e => `Baris ${e.row}: ${e.message}`));
          return;
        }

        const validData = [];
        const validationErrors = [];

        results.data.forEach((row, index) => {
          if (!row.nim || !row.nama) {
            validationErrors.push(`Baris ${index + 2}: NIM dan Nama tidak boleh kosong.`);
          } else {
            // Mapping for database
            validData.push({
              nim: row.nim.trim(),
              nama: row.nama.trim(),
              tempat_lahir: row.tempat_lahir || '',
              tanggal_lahir: row.tanggal_lahir || '',
              gender: row.gender === 'P' ? 'P' : 'L', // default L
              agama: row.agama || '',
              tahun_lulus: parseInt(row.tahun_lulus) || new Date().getFullYear(),
              golongan_darah: row.golongan_darah || 'A',
              email: row.email || '',
              no_hp: row.no_hp || '',
              alamat: row.alamat || '',
              negara: row.negara || 'Indonesia',
              provinsi: row.provinsi || '',
              kota: row.kota || '',
              kecamatan: row.kecamatan || '',
              kelurahan: row.kelurahan || '',
              rw: row.rw ? row.rw.padStart(3, '0') : '',
              rt: row.rt ? row.rt.padStart(3, '0') : '',
              status_kerja: row.status_kerja || 'Belum Bekerja',
              np: row.instansi || '', // 'np' is mapped to instansi/nama perusahaan
              jabatan: row.jabatan || '',
              keterangan: row.keterangan || 'Lulus',
              semester_dropout: parseInt(row.semester_dropout) || 0,
              prodi: row.prodi || '',
              fakultas: row.fakultas || '',
              ipk: row.ipk ? parseFloat(row.ipk) : 0
            });
          }
        });

        setParsedData(validData);
        setTotalRows(validData.length);
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
        }
      },
      error: (error) => {
        setErrors([`Gagal membaca file: ${error.message}`]);
      }
    });
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setIsUploading(true);
    setProgress(0);
    setSuccessCount(0);
    setFailedCount(0);
    
    let success = 0;
    let failed = 0;

    try {
      // OPTIMIZATION 1: Fetch all existing NIMs at once to avoid thousands of individual check requests
      // This is safe for ~100k records as we only fetch the 'nim' field (very small size)
      const existingRecords = await pb.collection('alumni').getFullList({ 
        fields: 'nim',
        requestKey: null 
      });
      const existingNims = new Set(existingRecords.map(r => r.nim));

      // OPTIMIZATION 2: Filter duplicates locally
      const toImport = parsedData.filter(item => {
        if (existingNims.has(item.nim)) {
          failed++;
          return false;
        }
        return true;
      });

      setFailedCount(failed);
      
      if (toImport.length === 0) {
        setProgress(100);
        setIsUploading(false);
        return;
      }

      // OPTIMIZATION 3: Chunked Parallel Processing
      // We process 50 records at a time in parallel to maximize throughput without crashing the browser/server
      const chunkSize = 50;
      for (let i = 0; i < toImport.length; i += chunkSize) {
        const chunk = toImport.slice(i, i + chunkSize);
        
        // Execute chunk in parallel
        const results = await Promise.allSettled(
          chunk.map(record => pb.collection('alumni').create(record, { requestKey: null }))
        );

        results.forEach(res => {
          if (res.status === 'fulfilled') {
            success++;
          } else {
            console.error("Gagal import record:", res.reason);
            failed++;
          }
        });

        setSuccessCount(success);
        setFailedCount(failed);
        setProgress(Math.round(((success + failed) / parsedData.length) * 100));
      }

    } catch (err) {
      console.error("Fatal Import Error:", err);
    } finally {
      setIsUploading(false);
      if (success > 0) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setFile(null);
    setParsedData(null);
    setErrors([]);
    setProgress(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Import Data Massal</h2>
            <p className="text-slate-500 text-sm mt-1">Unggah file CSV untuk mengimpor banyak alumni sekaligus.</p>
          </div>
          <button onClick={handleClose} disabled={isUploading} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col gap-6">
          
          {/* Step 1: Download Template */}
          <div className="flex items-center justify-between p-4 bg-brand-light/30 rounded-2xl border border-brand-primary/20">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Langkah 1: Siapkan Data</h3>
              <p className="text-xs text-slate-500 mt-1">Gunakan template yang disediakan agar kolom sesuai.</p>
            </div>
            <button 
              onClick={handleDownloadTemplate}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-primary/30 text-brand-primary rounded-xl font-bold text-sm hover:bg-brand-light transition-all shadow-sm disabled:opacity-50"
            >
              <Download size={16} />
              Unduh Template
            </button>
          </div>

          {/* Step 2: Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragging ? 'border-brand-primary bg-brand-light/30' : 'border-slate-200 hover:border-brand-primary/50 bg-slate-50'
            } ${file ? 'border-emerald-400 bg-emerald-50/30' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              disabled={isUploading}
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <FileText size={32} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                {!isUploading && (
                  <button 
                    onClick={() => { setFile(null); setParsedData(null); setErrors([]); }}
                    className="text-xs text-red-500 font-bold hover:underline mt-2"
                  >
                    Hapus / Ganti File
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm text-slate-400 rounded-full flex items-center justify-center">
                  <UploadCloud size={32} />
                </div>
                <div>
                  <p className="font-bold text-slate-700">Tarik & Lepas file CSV di sini</p>
                  <p className="text-xs text-slate-500 mt-1">atau klik untuk menelusuri file (Maks. 5MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Validation Messages */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-2">
                <AlertCircle size={16} />
                Ditemukan {errors.length} Peringatan:
              </div>
              <ul className="list-disc pl-5 text-xs text-red-600 space-y-1 max-h-24 overflow-y-auto">
                {errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                {errors.length > 5 && <li>...dan {errors.length - 5} peringatan lainnya.</li>}
              </ul>
            </div>
          )}

          {/* Upload Progress UI */}
          {isUploading && (
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Memproses Impor Data...</span>
                <span className="font-bold text-brand-primary">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-primary h-full rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> {successCount} Sukses</span>
                <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {failedCount} Gagal/Duplikat</span>
                <span className="text-slate-500">{totalRows} Total</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <div className="text-sm">
            {parsedData && !isUploading && (
              <span className="font-bold text-slate-700">
                ✅ {parsedData.length} data siap diimpor
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleClose} 
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              onClick={handleImport}
              disabled={!parsedData || parsedData.length === 0 || isUploading}
              className="px-8 py-2.5 rounded-xl bg-brand-primary text-white font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Mulai Impor
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
