const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function check() {
  try {
    const company = await pb.collection('companies').getFirstListItem('email="adit@gmail.com"');
    console.log('Company ID:', company.id);
    
    const job = await pb.collection('job_postings').getOne('9rbji8uy70xwem4');
    console.log('Job Company:', job.company);
    
    const app = await pb.collection('applications').getFirstListItem('job="9rbji8uy70xwem4"');
    console.log('App Company:', app.company);
  } catch (err) {
    console.error(err);
  }
}

check();
