import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function checkUser() {
    try {
        console.log("Authenticating as admin to fetch users...");
        // Fast test without auth first
        const records = await pb.collection('users').getList(1, 1);
        console.log("User record:", JSON.stringify(records.items[0], null, 2));
    } catch (err) {
        console.log(err.message);
    }
}
checkUser();
