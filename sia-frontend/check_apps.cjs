const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function check() {
  try {
    const apps = await pb.collection('applications').getFullList({
      filter: 'job="9rbji8uy70xwem4"',
      expand: 'alumni'
    });
    console.log('Found:', apps.length);
    if (apps.length > 0) {
      console.log('First App:', JSON.stringify(apps[0], null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

check();
