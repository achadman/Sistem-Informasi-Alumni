/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni");

  // Tambah IPK
  collection.fields.add(new Field({
    "system": false,
    "id": "number_ipk",
    "name": "ipk",
    "type": "number",
    "required": false,
    "options": { "min": 0, "max": 4 }
  }));

  // Tambah Prodi
  collection.fields.add(new Field({
    "system": false,
    "id": "text_prodi",
    "name": "prodi",
    "type": "text",
    "required": false
  }));

  // Tambah CV/Resume (file)
  collection.fields.add(new Field({
    "system": false,
    "id": "file_cv_alumni",
    "name": "cv",
    "type": "file",
    "required": false,
    "options": {
      "mimeTypes": ["application/pdf"],
      "maxSelect": 1,
      "maxSize": 10485760,
      "protected": false
    }
  }));

  // Tambah Keahlian/Skills
  collection.fields.add(new Field({
    "system": false,
    "id": "text_keahlian",
    "name": "keahlian",
    "type": "text",
    "required": false
  }));

  // Tambah Open to Work flag
  collection.fields.add(new Field({
    "system": false,
    "id": "bool_open_to_work",
    "name": "is_open_to_work",
    "type": "bool",
    "required": false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni");
  collection.fields.removeById("number_ipk");
  collection.fields.removeById("text_prodi");
  collection.fields.removeById("file_cv_alumni");
  collection.fields.removeById("text_keahlian");
  collection.fields.removeById("bool_open_to_work");
  return app.save(collection);
})
