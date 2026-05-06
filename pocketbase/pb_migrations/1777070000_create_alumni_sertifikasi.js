/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const alumniCol = app.findCollectionByNameOrId("alumni");
  
  const collection = new Collection({
    "name": "alumni_sertifikasi",
    "type": "base",
    "fields": [
      {
        "name": "alumni",
        "type": "relation",
        "required": true,
        "collectionId": alumniCol.id,
        "cascadeDelete": true,
        "maxSelect": 1
      },
      {
        "name": "nama_keahlian",
        "type": "text",
        "required": true
      },
      {
        "name": "tanggal_mulai",
        "type": "date"
      },
      {
        "name": "tanggal_selesai",
        "type": "date"
      },
      {
        "name": "file_sertifikat",
        "type": "file",
        "maxSelect": 1,
        "maxSize": 10485760,
        "mimeTypes": ["application/pdf", "image/jpeg", "image/png"]
      },
      {
        "name": "file_dokumentasi",
        "type": "file",
        "maxSelect": 1,
        "maxSize": 10485760,
        "mimeTypes": ["image/jpeg", "image/png"]
      }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni_sertifikasi");
  if (collection) {
    return app.delete(collection);
  }
})
