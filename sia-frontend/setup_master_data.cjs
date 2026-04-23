const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function setup() {
  try {
    await pb.admins.authWithPassword('admin@alumni.ac.id', 'password123');
    
    console.log('Admin authenticated. Creating/Updating master data collections...');

    // 1. Koleksi "fakultas"
    let fakultasCollection;
    try {
      fakultasCollection = await pb.collections.getOne('fakultas');
      console.log('Fakultas collection already exists.');
    } catch (e) {
      console.log('Creating fakultas collection...');
      fakultasCollection = await pb.collections.create({
        name: 'fakultas',
        type: 'base',
        system: false,
        schema: [
          {
            system: false,
            id: 'fakultas_nama',
            name: 'nama',
            type: 'text',
            required: true,
            presentable: true,
            options: { min: 2, max: 100, pattern: '' }
          }
        ],
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
      });
      console.log('Fakultas collection created successfully.');
    }

    // 2. Koleksi "program_studi"
    let prodiCollection;
    try {
      prodiCollection = await pb.collections.getOne('program_studi');
      console.log('Program Studi collection already exists.');
    } catch (e) {
      console.log('Creating program_studi collection...');
      prodiCollection = await pb.collections.create({
        name: 'program_studi',
        type: 'base',
        system: false,
        schema: [
          {
            system: false,
            id: 'prodi_nama',
            name: 'nama',
            type: 'text',
            required: true,
            presentable: true,
            options: { min: 2, max: 100, pattern: '' }
          },
          {
            system: false,
            id: 'prodi_fakultas_id',
            name: 'fakultas_id',
            type: 'relation',
            required: true, // Prevents deleting Fakultas if used!
            presentable: false,
            unique: false,
            options: {
              collectionId: fakultasCollection.id,
              cascadeDelete: false, // Aman: Tidak menghapus otomatis
              minSelect: null,
              maxSelect: 1,
              displayFields: ['nama']
            }
          }
        ],
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
      });
      console.log('Program Studi collection created successfully.');
    }

  } catch (err) {
    if (err.response) {
      console.error('API Error:', JSON.stringify(err.response, null, 2));
    } else {
      console.error(err);
    }
  }
}

setup();
