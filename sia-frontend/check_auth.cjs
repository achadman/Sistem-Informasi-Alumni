const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function check() {
  try {
    await pb.collection('users').authWithPassword('adit@gmail.com', 'Padaram!123');
    console.log('Login success');
    
    const apps = await pb.collection('applications').getFullList({
      filter: 'job="9rbji8uy70xwem4"',
      expand: 'alumni'
    });
    console.log('Found:', apps.length);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) console.log('Response:', JSON.stringify(err.response, null, 2));
  }
}

check();
