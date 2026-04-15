import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

const provinces = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 
  'Banten', 'DI Yogyakarta', 'Sumatera Utara', 'Sulawesi Selatan'
];

const statuses = ['Bekerja', 'Wiraswasta', 'Belum Bekerja', 'Melanjutkan Studi'];
const academicStatuses = ['Lulus', 'Lulus', 'Lulus', 'Lulus', 'Drop Out (DO)', 'Drop Out (DO)'];

async function seed() {
  try {
    console.log('Starting seed process...');
    
    // Clear old dummy data if needed, or just append
    // To avoid unique NIM errors, I'll use a very random string
    
    for (let i = 0; i < 50; i++) {
        const year = 2020 + Math.floor(Math.random() * 7);
        const prov = provinces[Math.floor(Math.random() * provinces.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const academic = academicStatuses[Math.floor(Math.random() * academicStatuses.length)];
        const sem = academic === 'Drop Out (DO)' ? Math.floor(Math.random() * 8) + 1 : 0;
        
        const data = {
            nim: `SEED${Date.now()}${i}`,
            nama: `Alumni Dummy ${i + 1}`,
            gender: Math.random() > 0.5 ? 'L' : 'P',
            tahun_lulus: year,
            provinsi: prov,
            status_kerja: status,
            keterangan: academic,
            semester_dropout: sem,
            agama: 'Islam',
            golongan_darah: 'O',
            email: `dummy${i}@example.com`,
            no_hp: '08123456789',
            negara: 'Indonesia'
        };

        try {
            await pb.collection('alumni').create(data);
            if (i % 10 === 0) console.log(`Inserted ${i} records...`);
        } catch (e) {
            console.error(`Failed to insert record ${i}:`, e.data);
        }
    }
    
    console.log('Seed process finished!');
  } catch (err) {
    console.error('Seed critical failure:', err.message);
  }
}

seed();
