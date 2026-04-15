import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function debugRequest() {
    try {
        console.log("Testing getList with simple sort 'created'...");
        const res = await pb.collection('alumni').getList(1, 20, {
            sort: 'created'
        });
        console.log("Success! Count:", res.items.length);

        console.log("\nTesting with empty filter...");
        const res2 = await pb.collection('alumni').getList(1, 20, {
            filter: "",
            sort: 'created'
        });
        console.log("Success with empty filter!");
    } catch (err) {
        console.error("FAILED with error:", err.message);
        console.error("Full error data:", JSON.stringify(err.data, null, 2));
    }
}
debugRequest();
