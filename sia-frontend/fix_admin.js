import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function fixUser() {
  try {
    const user = await pb.collection('users').getFirstListItem('email="admin@alumni.ac.id"');
    console.log(`Menemukan user: ${user.id}`);
    await pb.collection('users').update(user.id, { role: 'admin' });
    console.log("User admin@alumni.ac.id telah di-set sebagai 'admin'!");
  } catch (err) {
    console.error("Gagal update user:", err.message);
  }
}
fixUser();
