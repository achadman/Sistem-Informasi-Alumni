import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function seed() {
  console.log("Memulai proses seeding...");
  
  try {
    // 1. Tambah Data Alumni
    const alumniData = [
      { nim: '2010114001', nama: 'Aditya Pratama', gender: 'L', tahun_lulus: 2023, status_kerja: 'Bekerja', instansi: 'Gojek', jabatan: 'Backend Engineer' },
      { nim: '2010114002', nama: 'Siti Nurhaliza', gender: 'P', tahun_lulus: 2023, status_kerja: 'Bekerja', instansi: 'Shopee', jabatan: 'QA Specialist' },
      { nim: '2010114003', nama: 'Rian Hidayat', gender: 'L', tahun_lulus: 2022, status_kerja: 'Wiraswasta', instansi: 'Kopi Kenangan', jabatan: 'Store Manager' },
      { nim: '2010114004', nama: 'Dewi Lestari', gender: 'P', tahun_lulus: 2022, status_kerja: 'Melanjutkan Studi', instansi: 'UGM', jabatan: 'Mahasiswa S2' },
      { nim: '2010114005', nama: 'Bagus Saputra', gender: 'L', tahun_lulus: 2024, status_kerja: 'Belum Bekerja', instansi: '-', jabatan: '-' },
      { nim: '2010114006', nama: 'Maya Sari', gender: 'P', tahun_lulus: 2023, status_kerja: 'Bekerja', instansi: 'Bank Mandiri', jabatan: 'IT Auditor' },
      { nim: '2010114007', nama: 'Fajar Ramadhan', gender: 'L', tahun_lulus: 2021, status_kerja: 'Wiraswasta', instansi: 'Studio Kreatif', jabatan: 'Creative Director' },
      { nim: '2010114008', nama: 'Lina Marlina', gender: 'P', tahun_lulus: 2024, status_kerja: 'Belum Bekerja', instansi: '-', jabatan: '-' },
      { nim: '2010114009', nama: 'Eko Sulistyo', gender: 'L', tahun_lulus: 2023, status_kerja: 'Bekerja', instansi: 'Traveloka', jabatan: 'Frontend Dev' },
      { nim: '2010114010', nama: 'Rina Nose', gender: 'P', tahun_lulus: 2022, status_kerja: 'Bekerja', instansi: 'Telkomsel', jabatan: 'Account Manager' }
    ];

    console.log("Menyimpan data alumni...");
    for (const data of alumniData) {
      try {
        await pb.collection('alumni').create(data);
      } catch (e) {
        console.log(`Gagal simpan ${data.nama}: ${e.message}`);
      }
    }

    // 2. Tambah Data Tracer Study (Status Kerja untuk Dashboard)
    const tracerData = [
      { work_status: 'bekerja', graduation_year: '2023', company: 'Gojek' },
      { work_status: 'bekerja', graduation_year: '2023', company: 'Shopee' },
      { work_status: 'wiraswasta', graduation_year: '2022', company: 'Self-Employed' },
      { work_status: 'studi', graduation_year: '2022', company: 'UGM' },
      { work_status: 'mencari', graduation_year: '2024', company: '-' },
      { work_status: 'bekerja', graduation_year: '2023', company: 'Bank Mandiri' },
      { work_status: 'wiraswasta', graduation_year: '2021', company: 'Creative Agency' },
      { work_status: 'mencari', graduation_year: '2024', company: '-' },
      { work_status: 'bekerja', graduation_year: '2023', company: 'Traveloka' },
      { work_status: 'bekerja', graduation_year: '2022', company: 'Telkomsel' }
    ];

    console.log("Menyimpan data tracer studies...");
    for (const data of tracerData) {
      try {
        await pb.collection('tracer_studies').create(data);
      } catch (e) {
        console.log(`Gagal simpan tracer: ${e.message}`, JSON.stringify(e.response?.data || {}, null, 2));
      }
    }

    console.log("Seeding SELESAI!");
  } catch (err) {
    console.error("Critical Error during seeding:", err);
  }
}

seed();
