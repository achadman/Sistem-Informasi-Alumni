const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function resetCollections() {
  await pb.admins.authWithPassword('admin@alumni.ac.id', 'password123');
  console.log('Authenticated. Cleaning up old collections...');

  try {
    const prod = await pb.collections.getOne('program_studi');
    await pb.collections.delete(prod.id);
    console.log('Deleted bad program_studi');
  } catch(e) {}
  
  try {
    const fak = await pb.collections.getOne('fakultas');
    await pb.collections.delete(fak.id);
    console.log('Deleted bad fakultas');
  } catch(e) {}

  console.log('Creating fakultas...');
  const fak = await pb.collections.create({
    name: 'fakultas',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'nama',
        type: 'text',
        required: true,
        presentable: true
      }
    ],
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'"
  });

  fak.indexes = ['CREATE UNIQUE INDEX `idx_fakultas_nama` ON `fakultas` (`nama`)'];
  await pb.collections.update(fak.id, fak);
  console.log('fakultas created correctly.');

  console.log('Creating program_studi...');
  const prod = await pb.collections.create({
    name: 'program_studi',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'nama',
        type: 'text',
        required: true,
        presentable: true
      },
      {
        name: 'fakultas_id',
        type: 'relation',
        required: true,
        collectionId: fak.id,
        maxSelect: 1,
        cascadeDelete: false
      }
    ],
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'"
  });

  prod.indexes = ['CREATE UNIQUE INDEX `idx_program_studi_nama` ON `program_studi` (`nama`)'];
  await pb.collections.update(prod.id, prod);
  console.log('program_studi created correctly.');
}

resetCollections().catch(e => {
  if(e.response) console.error(JSON.stringify(e.response, null, 2));
  else console.error(e);
});
