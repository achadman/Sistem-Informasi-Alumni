const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function testDelete() {
  try {
    await pb.collection('users').authWithPassword('admin@alumni.ac.id', 'password123'); // Regular users col auth
    console.log("Logged in as admin via users collection.");

    const dummyUser = await pb.collection('users').create({
      username: 'dummy_test',
      email: 'dummy_test@test.local',
      password: 'Password_123!!',
      passwordConfirm: 'Password_123!!',
      name: 'Dummy Test',
      role: 'alumni'
    });
    console.log("Created dummy user:", dummyUser.id);

    await pb.collection('users').delete(dummyUser.id);
    console.log("Deleted dummy user successfully. Admin delete functionality works!");

  } catch (err) {
    if (err.response) {
      console.error(JSON.stringify(err.response, null, 2));
    } else {
      console.error(err);
    }
  }
}
testDelete();
