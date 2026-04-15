import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
    const list = await pb.collection('alumni').getFullList();
    const doRecords = list.filter(a => a.keterangan === 'Drop Out (DO)');
    console.log(`Total DO: ${doRecords.length}`);
    if (doRecords.length > 0) {
        console.log("Sample DO Data:", doRecords[0]);
    }
}
test();
