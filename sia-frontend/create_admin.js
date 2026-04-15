import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function createAdmin() {
  const email = 'admin@alumni.ac.id';
  const pass = '1234567890';
  
  try {
    const existing = await pb.collection('users').getFirstListItem(`email="${email}"`);
    console.log(`User ${email} sudah ada. Updating role...`);
    await pb.collection('users').update(existing.id, { role: 'admin' });
    console.log("Update BERHASIL!");
  } catch (err) {
    console.log(`User ${email} tidak ada. Creating new...`);
    try {
      await pb.collection('users').create({
        email,
        password: pass,
        passwordConfirm: pass,
        role: 'admin',
        name: 'Administrator',
        emailVisibility: true
      });
      console.log("Buat user BERHASIL!");
    } catch (e) {
      console.error("Gagal create user:", e.message);
    }
  }
}
createAdmin();
