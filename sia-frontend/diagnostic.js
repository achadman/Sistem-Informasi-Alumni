import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function diagnostic() {
    try {
        console.log("1. Checking collection 'alumni' exists...");
        const collection = await pb.collections.getOne('alumni');
        console.log("Collection Found! List Rule:", collection.listRule);
        
        console.log("\n2. Trying simple getList(1, 1)...");
        const res1 = await pb.collection('alumni').getList(1, 1);
        console.log("Success! Items count:", res1.items.length);

        console.log("\n3. Trying getList(1, 1) with sort '+created'...");
        const res2 = await pb.collection('alumni').getList(1, 1, { sort: '+created' });
        console.log("Success with sort!");

        console.log("\n4. Trying getList(1, 1) with sort 'created'...");
        const res3 = await pb.collection('alumni').getList(1, 1, { sort: 'created' });
        console.log("Success with simple sort!");

    } catch (err) {
        console.log("--- ERROR DETECTED ---");
        console.log("Status Code:", err.status);
        console.log("Message:", err.message);
        console.log("Data Detail:", JSON.stringify(err.data, null, 2));
    }
}
diagnostic();
