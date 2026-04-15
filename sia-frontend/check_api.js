import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function checkCollection() {
    try {
        // We can't use pb.collections.getOne without admin auth.
        // But we CAN use a simple list request and check the result.
        console.log("Fetching first record to see columns...");
        const res = await pb.collection('alumni').getList(1, 1);
        if (res.items.length > 0) {
            console.log("Success! Record keys:", Object.keys(res.items[0]));
        } else {
            console.log("Collection is empty or NO permission.");
        }
    } catch (err) {
        console.log("--- ERROR ---");
        console.log("Status:", err.status);
        console.log("Message:", err.message);
        console.log("Data:", JSON.stringify(err.data, null, 2));
    }
}
checkCollection();
