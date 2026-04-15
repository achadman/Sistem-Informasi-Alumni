/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni");
  
  // Menambahkan field foto
  collection.fields.add(new Field({
    "system": false,
    "id": "file_foto_alumni",
    "name": "foto",
    "type": "file",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "mimeTypes": [
        "image/jpeg",
        "image/png",
        "image/svg+xml",
        "image/gif",
        "image/webp"
      ],
      "thumbs": ["100x100"],
      "maxSelect": 1,
      "maxSize": 5242880,
      "protected": false
    }
  }));

  // Memastikan alumni bisa update data (terutama fotonya)
  collection.updateRule = "";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni");
  collection.fields.removeById("file_foto_alumni");
  
  // Revert back update rule
  collection.updateRule = "@request.auth.id != ''";
  return app.save(collection);
})
