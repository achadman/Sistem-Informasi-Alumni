const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function check() {
  try {
    const list = await pb.collection('alumni').getFullList();
    console.log(`Total alumni: ${list.length}`);
    console.log('Sample data (first 3):');
    console.log(JSON.stringify(list.slice(0, 3), null, 2));

    const doList = list.filter(a => a.keterangan === 'Drop Out (DO)');
    console.log(`\nTotal DO alumni: ${doList.length}`);
    doList.forEach(a => {
        console.log(`- ${a.nama}: Semester ${a.semester_dropout} (Type: ${typeof a.semester_dropout})`);
    });

  } catch (err) {
    console.error('Error connecting to PB:', err.message);
  }
}

check();
