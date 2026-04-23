const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');
async function fix() {
  try {
    await pb.admins.authWithPassword('admin@alumni.ac.id', 'password123');
    
    let c = await pb.collections.getOne('users');
    
    // Check if username field exists
    const hasUsername = c.fields.some(f => f.name === 'username');
    if (!hasUsername) {
      c.fields.push({
        system: false,
        id: 'text' + Date.now(),
        name: 'username',
        type: 'text',
        required: true,
        presentable: false,
        options: {
          min: 3,
          max: 50,
          pattern: '^[a-zA-Z0-9_.]+$'
        }
      });
      await pb.collections.update(c.id, c);
      c = await pb.collections.getOne('users');
    }

    // 1. Give everyone a unique username first
    const users = await pb.collection('users').getFullList();
    for (const u of users) {
      if (!u.username || u.username === "") {
         await pb.collection('users').update(u.id, { username: 'user_' + u.id.toLowerCase() });
      }
    }
    console.log('Usernames populated for existing users.');
    
    // Add unique index for username
    const hasIdx = c.indexes.some(idx => idx.includes('username'));
    if (!hasIdx) {
      c.indexes.push('CREATE UNIQUE INDEX `idx_username` ON `users` (`username`)');
    }

    // Allow username in identityFields
    if (!c.passwordAuth.identityFields.includes('username')) {
      c.passwordAuth.identityFields.push('username');
    }
    
    // Update rules to allow admin CRUD
    c.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'";
    c.deleteRule = "id = @request.auth.id || @request.auth.role = 'admin'";
    
    await pb.collections.update(c.id, c);
    console.log('Users collection updated successfully');
  } catch (e) {
    if (e.response) {
       console.error('API Error:', JSON.stringify(e.response, null, 2));
    } else {
       console.error(e);
    }
  }
}
fix();
