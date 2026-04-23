/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const companiesCol = app.findCollectionByNameOrId("companies");

  const collection = new Collection({
    "name": "job_postings",
    "type": "base",
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != '' && @request.auth.role = 'industri'",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'industri' || @request.auth.role = 'admin')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'industri' || @request.auth.role = 'admin')"
  });

  collection.fields.add(new Field({
    "name": "company",
    "type": "relation",
    "required": true,
    "collectionId": companiesCol.id,
    "cascadeDelete": true,
    "maxSelect": 1
  }));
  collection.fields.add(new Field({ "name": "judul", "type": "text", "required": true }));
  collection.fields.add(new Field({ "name": "deskripsi", "type": "text" }));
  collection.fields.add(new Field({ "name": "persyaratan", "type": "text" }));
  collection.fields.add(new Field({ "name": "lokasi", "type": "text" }));
  collection.fields.add(new Field({
    "name": "tipe_kerja",
    "type": "select",
    "maxSelect": 1,
    "values": ["Full-time", "Part-time", "Kontrak", "Magang", "Remote", "Freelance"]
  }));
  collection.fields.add(new Field({ "name": "gaji_min", "type": "number" }));
  collection.fields.add(new Field({ "name": "gaji_max", "type": "number" }));
  collection.fields.add(new Field({ "name": "prodi_target", "type": "text" }));
  collection.fields.add(new Field({ "name": "min_ipk", "type": "number" }));
  collection.fields.add(new Field({ "name": "deadline", "type": "date" }));
  collection.fields.add(new Field({
    "name": "status",
    "type": "select",
    "required": true,
    "maxSelect": 1,
    "values": ["Aktif", "Tutup", "Draft"]
  }));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("job_postings");
  if (collection) app.delete(collection);
})
