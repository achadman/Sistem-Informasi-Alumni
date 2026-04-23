/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const alumniCol = app.findCollectionByNameOrId("alumni");
  const jobPostingsCol = app.findCollectionByNameOrId("job_postings");
  const companiesCol = app.findCollectionByNameOrId("companies");

  const collection = new Collection({
    "name": "applications",
    "type": "base",
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'industri' || @request.auth.role = 'admin')",
    "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'"
  });

  collection.fields.add(new Field({
    "name": "alumni",
    "type": "relation",
    "required": true,
    "collectionId": alumniCol.id,
    "cascadeDelete": false,
    "maxSelect": 1
  }));
  collection.fields.add(new Field({
    "name": "job",
    "type": "relation",
    "required": true,
    "collectionId": jobPostingsCol.id,
    "cascadeDelete": true,
    "maxSelect": 1
  }));
  collection.fields.add(new Field({
    "name": "company",
    "type": "relation",
    "required": true,
    "collectionId": companiesCol.id,
    "cascadeDelete": false,
    "maxSelect": 1
  }));
  collection.fields.add(new Field({
    "name": "status",
    "type": "select",
    "required": true,
    "maxSelect": 1,
    "values": ["Pending", "Dilihat", "Dihubungi", "Ditolak"]
  }));
  collection.fields.add(new Field({
    "name": "surat_lamaran",
    "type": "file",
    "maxSelect": 1,
    "maxSize": 10485760,
    "mimeTypes": ["application/pdf", "image/jpeg", "image/png"]
  }));
  collection.fields.add(new Field({ "name": "catatan", "type": "text" }));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("applications");
  if (collection) app.delete(collection);
})
