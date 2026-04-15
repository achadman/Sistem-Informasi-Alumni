/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "name": "institution_profile",
    "type": "base",
    "fields": [
      { "name": "nama", "type": "text", "required": true },
      { "name": "logo", "type": "file", "options": { "maxSelect": 1, "maxSize": 5242880, "mimeTypes": ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] } },
      { "name": "alamat", "type": "text" },
      { "name": "provinsi", "type": "text" },
      { "name": "kota", "type": "text" },
      { "name": "kecamatan", "type": "text" },
      { "name": "kelurahan", "type": "text" },
      { "name": "rw", "type": "text" },
      { "name": "rt", "type": "text" },
      { "name": "email", "type": "email" },
      { "name": "no_hp", "type": "text" },
      { "name": "deskripsi", "type": "text" }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
    "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
    "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'"
  });

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("institution_profile");
  if (collection) app.delete(collection);
})
