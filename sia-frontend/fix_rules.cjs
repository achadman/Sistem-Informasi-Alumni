const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');
async function fix() {
  try {
    await pb.admins.authWithPassword('admin@alumni.ac.id', 'password123');
    const jp = await pb.collections.getOne('job_postings');
    await pb.collections.update(jp.id, {
      listRule: '@request.auth.id != ""', 
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    });
    const c = await pb.collections.getOne('companies');
    await pb.collections.update(c.id, {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""'
    });
    console.log('Rules fixed to AUTHENTICATED successfully!');
  } catch (e) {
    console.error('Fix failed:', e.message);
  }
}
fix();
