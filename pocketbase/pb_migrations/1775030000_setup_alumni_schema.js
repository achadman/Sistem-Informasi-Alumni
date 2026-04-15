/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const alumni = new Collection({
    "name": "alumni",
    "type": "base",
    "fields": [
      { "name": "nim", "type": "text", "required": true, "unique": true },
      { "name": "nama", "type": "text", "required": true },
      { "name": "gender", "type": "select", "values": ["L", "P"] },
      { "name": "agama", "type": "text" },
      { "name": "tahun_lulus", "type": "number" },
      { "name": "golongan_darah", "type": "select", "values": ["A", "B", "AB", "O"] },
      { "name": "email", "type": "email" },
      { "name": "no_hp", "type": "text" },
      { "name": "alamat", "type": "text" },
      { "name": "negara", "type": "text" },
      { "name": "provinsi", "type": "text" },
      { "name": "kota_kabupaten", "type": "text" },
      { "name": "kelurahan", "type": "text" },
      { "name": "rw", "type": "text" },
      { "name": "rt", "type": "text" },
      { "name": "status_kerja", "type": "select", "values": ["Bekerja", "Wiraswasta", "Belum Bekerja", "Melanjutkan Studi"] },
      { "name": "instansi", "type": "text" },
      { "name": "jabatan", "type": "text" }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  });

  const tracer = new Collection({
    "name": "tracer_studies",
    "type": "base",
    "fields": [
      { "name": "user", "type": "relation", "collectionId": "_pb_users_auth_", "cascadeDelete": true },
      { "name": "work_status", "type": "text" },
      { "name": "company", "type": "text" },
      { "name": "job_title", "type": "text" },
      { "name": "city", "type": "text" },
      { "name": "lat", "type": "text" },
      { "name": "lng", "type": "text" },
      { "name": "salary_range", "type": "text" },
      { "name": "graduation_year", "type": "text" }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "@request.auth.id = user.id",
    "deleteRule": "@request.auth.id = user.id"
  });

  app.save(alumni);
  app.save(tracer);
}, (app) => {
  const alumni = app.findCollectionByNameOrId("alumni");
  const tracer = app.findCollectionByNameOrId("tracer_studies");
  
  if (alumni) app.delete(alumni);
  if (tracer) app.delete(tracer);
})
