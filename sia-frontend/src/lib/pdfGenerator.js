import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { pb } from '../lib/pb';

export const exportAlumniToPDF = async (alumni) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  
  // 1. Fetch Institution Data
  let institution = null;
  try {
    institution = await pb.collection('institution_profile').getFirstListItem('');
  } catch (err) {
    console.error("Gagal mengambil profil institusi untuk PDF:", err);
  }

  // --- HEADER SECTION (Modern Colored Banner) ---
  const headerHeight = 35;
  // Brand Primary Color (Tailwind blue-600 #2563eb)
  doc.setFillColor(37, 99, 235); 
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  
  // Institution Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const instName = institution?.nama ? institution.nama.toUpperCase() : 'SISTEM INFORMASI ALUMNI';
  
  let fontSize = 22;
  doc.setFontSize(fontSize);
  let textWidth = doc.getTextWidth(instName);
  // Scale down font size until it fits within the page margins (15mm left + 15mm right)
  while (textWidth > (pageWidth - 30) && fontSize > 10) {
    fontSize -= 1;
    doc.setFontSize(fontSize);
    textWidth = doc.getTextWidth(instName);
  }
  doc.text(instName, 15, 18);
  
  // Institution Address/Contact
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const instContact = institution ? `Email: ${institution.email || '-'} | Telp: ${institution.no_hp || '-'}` : 'Data Institusi Tidak Tersedia';
  doc.text(instContact, 15, 26);
  
  // --- DOCUMENT TITLE ---
  let yPos = headerHeight + 15;
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFIL BIODATA ALUMNI', 15, yPos);
  
  // Subtitle
  yPos += 6;
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 15, yPos);
  
  // --- PROFILE PICTURE ---
  if (alumni.gambar) {
    try {
      const imgUrl = pb.files.getURL(alumni, alumni.gambar, { thumb: '300x300' });
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = 'Anonymous';
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = imgUrl;
      });
      // Draw image on top right corner (x: pageWidth - 15 padding - 25 width)
      doc.addImage(img, 'JPEG', pageWidth - 40, headerHeight + 8, 25, 25);
    } catch (err) {
      console.warn("Gagal memuat foto profil untuk PDF", err);
    }
  }

  yPos += 12;

  // --- HELPER FUNCTION FOR TABLES ---
  const createSectionTable = (title, dataArray) => {
    // Section Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title, 15, yPos);
    
    // Draw a subtle line under the title
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(15, yPos + 2, pageWidth - 15, yPos + 2);
    yPos += 6;

    const tableBody = dataArray.map(item => [item.label, item.value || '-']);

    autoTable(doc, {
      startY: yPos,
      body: tableBody,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] }, // Label col (slate-500 text, slate-50 bg)
        1: { textColor: [15, 23, 42] } // Value col (slate-900 text)
      },
      margin: { left: 15, right: 15 },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0,
      didParseCell: function (data) {
        // Subtle bottom border for rows
        data.cell.styles.lineWidth = { bottom: 0.2 };
        data.cell.styles.lineColor = [241, 245, 249]; // slate-100
      }
    });

    yPos = doc.lastAutoTable.finalY + 12;
  };

  // --- DATA MAPPING ---
  
  // 1. Informasi Pribadi
  createSectionTable('Informasi Pribadi', [
    { label: 'Nama Lengkap', value: alumni.nama },
    { label: 'NIM', value: alumni.nim },
    { label: 'Jenis Kelamin', value: alumni.gender === 'L' ? 'Laki-laki' : (alumni.gender === 'P' ? 'Perempuan' : alumni.gender) },
    { label: 'Agama', value: alumni.agama },
    { label: 'Golongan Darah', value: alumni.golongan_darah },
    { label: 'Email', value: alumni.email },
    { label: 'No. HP / WhatsApp', value: alumni.no_hp },
  ]);

  // 2. Alamat Lengkap
  const rwrt = (alumni.rt || alumni.rw) ? `RT ${alumni.rt || '-'} / RW ${alumni.rw || '-'}` : '';
  let fullAddress = [alumni.alamat, rwrt, alumni.kelurahan, alumni.kecamatan, alumni.kota, alumni.provinsi, alumni.negara]
    .filter(Boolean)
    .join(', ');

  createSectionTable('Kontak & Domisili', [
    { label: 'Alamat Lengkap', value: fullAddress },
    { label: 'Domisili (Kota/Prov)', value: [alumni.kota, alumni.provinsi].filter(Boolean).join(', ') }
  ]);

  // 3. Riwayat Akademik
  createSectionTable('Riwayat Akademik', [
    { label: 'Fakultas', value: alumni.fakultas },
    { label: 'Program Studi', value: alumni.prodi },
    { label: 'Tahun Masuk', value: alumni.tahun_masuk },
    { label: 'Tahun Lulus', value: alumni.tahun_lulus },
    { label: 'IPK', value: alumni.ipk },
    { label: 'Status Keberadaan', value: alumni.keterangan || 'Lulus' },
    ...(alumni.keterangan === 'Drop Out (DO)' ? [{ label: 'Semester DO', value: alumni.semester_dropout }] : [])
  ]);

  // 4. Status Karir & Pekerjaan
  let karirData = [
    { label: 'Status Pekerjaan', value: alumni.status_kerja || 'Belum Bekerja' }
  ];

  if (alumni.status_kerja === 'Melanjutkan Studi') {
    karirData.push({ label: 'Universitas Tujuan', value: alumni.np });
    karirData.push({ label: 'Program Studi', value: alumni.jabatan });
  } else if (alumni.status_kerja === 'Wiraswasta') {
    karirData.push({ label: 'Nama Usaha', value: alumni.np });
    karirData.push({ label: 'Bidang Usaha', value: alumni.jabatan });
    karirData.push({ label: 'Pendapatan', value: alumni.pendapatan });
  } else if (alumni.status_kerja === 'Bekerja') {
    karirData.push({ label: 'Instansi / Perusahaan', value: alumni.np });
    karirData.push({ label: 'Bidang Pekerjaan', value: alumni.bidang_pekerjaan });
    karirData.push({ label: 'Posisi / Jabatan', value: alumni.jabatan });
    karirData.push({ label: 'Pendapatan', value: alumni.pendapatan });
  } else if (alumni.status_kerja && alumni.status_kerja !== 'Belum Bekerja') {
    karirData.push({ label: 'Keterangan Instansi', value: alumni.np });
    karirData.push({ label: 'Keterangan Jabatan', value: alumni.jabatan });
  }

  if (alumni.keahlian) karirData.push({ label: 'Keahlian Kompetensi', value: alumni.keahlian });
  if (alumni.sertifikasi) karirData.push({ label: 'Sertifikasi', value: alumni.sertifikasi });

  createSectionTable('Riwayat Karir & Kompetensi', karirData);

  // --- FOOTER ---
  const pageHeight = doc.internal.pageSize.height;
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Dokumen ini dicetak otomatis oleh Sistem Informasi Alumni pada ${new Date().toLocaleString('id-ID')}.`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`Validitas data di atas sesuai dengan pembaharuan terakhir oleh alumni terkait.`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save PDF
  doc.save(`Profil_Alumni_${alumni.nim || alumni.nama.replace(/\s+/g, '_')}.pdf`);
};

