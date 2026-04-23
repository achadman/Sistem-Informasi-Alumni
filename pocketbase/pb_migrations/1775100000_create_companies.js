/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Find the actual users collection ID
  const usersCol = app.findCollectionByNameOrId("_pb_users_auth_");

  const collection = new Collection({
    "name": "companies",
    "type": "base",
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')",
    "deleteRule": "@request.auth.role = 'admin'"
  });

  collection.fields.add(new Field({ "name": "nama", "type": "text", "required": true }));
  collection.fields.add(new Field({
    "name": "industri",
    "type": "select",
    "maxSelect": 1,
    "values": ["Teknologi Informasi", "Manufaktur", "Keuangan & Perbankan", "Kesehatan", "Pendidikan", "Konstruksi", "Perdagangan", "Transportasi & Logistik", "Media & Komunikasi", "Pertanian", "Energi", "Pariwisata & Hospitality", "Pemerintahan", "Lainnya"]
  }));
  collection.fields.add(new Field({ "name": "deskripsi", "type": "text" }));
  collection.fields.add(new Field({ "name": "alamat", "type": "text" }));
  collection.fields.add(new Field({ "name": "kota", "type": "text" }));
  collection.fields.add(new Field({ "name": "provinsi", "type": "text" }));
  collection.fields.add(new Field({ "name": "email", "type": "email" }));
  collection.fields.add(new Field({ "name": "no_hp", "type": "text" }));
  collection.fields.add(new Field({ "name": "website", "type": "url" }));
  collection.fields.add(new Field({
    "name": "logo",
    "type": "file",
    "maxSelect": 1,
    "maxSize": 5242880,
    "mimeTypes": ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
  }));
  collection.fields.add(new Field({
    "name": "user",
    "type": "relation",
    "required": true,
    "collectionId": usersCol.id,
    "cascadeDelete": false,
    "maxSelect": 1
  }));
  collection.fields.add(new Field({ "name": "verified", "type": "bool" }));
  collection.fields.add(new Field({ "name": "verified_at", "type": "date" }));
  collection.fields.add(new Field({ "name": "reject_reason", "type": "text" }));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("companies");
  if (collection) app.delete(collection);
})
