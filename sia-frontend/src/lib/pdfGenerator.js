import { jsPDF } from 'jspdf';
import { pb } from '../lib/pb';

export const exportAlumniToPDF = async (alumni) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // 1. Fetch Institution Data
  let institution = null;
  try {
    institution = await pb.collection('institution_profile').getFirstListItem('');
  } catch (err) {
    console.error("Gagal mengambil profil institusi untuk PDF:", err);
  }

  // Colors & Styles
  let yPos = 20;
  
  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const headerTitle = institution?.nama ? institution.nama.toUpperCase() : 'SISTEM INFORMASI ALUMNI';
  doc.text(headerTitle, 105, yPos, { align: 'center' });
  
  if (institution) {
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const instAddress = [institution.alamat, institution.kelurahan, institution.kecamatan, institution.kota, institution.provinsi]
      .filter(Boolean)
      .join(', ');
    doc.text(instAddress, 105, yPos, { align: 'center' });
    
    yPos += 4;
    const instContact = `Email: ${institution.email || '-'} | Telp: ${institution.no_hp || '-'}`;
    doc.text(instContact, 105, yPos, { align: 'center' });
  }

  yPos += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BIODATA RIWAYAT ALUMNI', 105, yPos, { align: 'center' });
  
  yPos += 4;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  
  yPos += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const textLeft = 20;   // X pos for Label
  const textColon = 65;  // X pos for :
  const textRight = 70;  // X pos for Value
  const lineSpacing = 8; // Y distance between lines

  const addRow = (label, value) => {
    doc.text(label, textLeft, yPos);
    doc.text(':', textColon, yPos);
    
    // Auto wrap text for long values
    const splitText = doc.splitTextToSize(value ? value.toString() : '-', 120);
    doc.text(splitText, textRight, yPos);
    
    // Add Y based on how many lines it wrapped
    yPos += (splitText.length * lineSpacing);
  };

  // Content Mapping
  addRow('Nama Lengkap', alumni.nama);
  addRow('NIM', alumni.nim);
  addRow('Tahun Lulus', alumni.tahun_lulus);
  addRow('Jenis Kelamin', alumni.gender === 'L' ? 'Laki-laki' : 'Perempuan');
  addRow('Agama', alumni.agama);
  addRow('Golongan Darah', alumni.golongan_darah);
  addRow('Email', alumni.email);
  addRow('No. HP / WhatsApp', alumni.no_hp);
  
  // Address parsing
  const rwrt = (alumni.rt || alumni.rw) ? `RT ${alumni.rt || '-'} / RW ${alumni.rw || '-'}` : '';
  let fullAddress = [alumni.alamat, rwrt, alumni.kelurahan, alumni.kecamatan, alumni.kota, alumni.provinsi, alumni.negara]
    .filter(Boolean)
    .join(', ');
  
  addRow('Keterangan Keberadaan', alumni.keterangan || 'Lulus');
  addRow('Status Pekerjaan', alumni.status_kerja || '-');

  // Render spesifik field
  if (alumni.status_kerja === 'Melanjutkan Studi') {
    addRow('Universitas Tujuan', alumni.np);
    addRow('Program Studi', alumni.jabatan);
  } else if (alumni.status_kerja === 'Wiraswasta') {
    addRow('Nama Usaha', alumni.np);
    addRow('Bidang Usaha', alumni.jabatan);
  } else if (alumni.status_kerja === 'Bekerja') {
    addRow('Instansi / Perusahaan', alumni.np);
    addRow('Posisi / Jabatan', alumni.jabatan);
  } else if (alumni.status_kerja && alumni.status_kerja !== 'Belum Bekerja') {
    addRow('Nama Tempat / Instansi', alumni.np);
    addRow('Keterangan Jabatan', alumni.jabatan);
  }

  addRow('Alamat Lengkap', fullAddress);

  // Footer formal text
  yPos += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Dokumen ini di-generate secara otomatis oleh ${institution?.nama || 'Sistem Informasi Alumni'}.`, 20, yPos);
  
  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  yPos += 6;
  doc.text(`Dicetak pada: ${today}`, 20, yPos);

  // Save PDF
  doc.save(`Biodata_Alumni_${alumni.nim || alumni.nama.replace(/\s+/g, '_')}.pdf`);
};

