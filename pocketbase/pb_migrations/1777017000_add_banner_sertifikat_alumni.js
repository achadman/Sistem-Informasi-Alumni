/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni");

  // Field banner: single image for profile cover/background
  collection.fields.add(new Field({
    "system": false,
    "id": "file_banner_alumni",
    "name": "banner",
    "type": "file",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "mimeTypes": [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
      ],
      "thumbs": [],
      "maxSelect": 1,
      "maxSize": 10485760,
      "protected": false
    }
  }));

  // Field sertifikat: multiple files (images or PDF) for certificates
  collection.fields.add(new Field({
    "system": false,
    "id": "file_sertifikat_alumni",
    "name": "sertifikat",
    "type": "file",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "mimeTypes": [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
      ],
      "thumbs": ["200x200"],
      "maxSelect": 10,
      "maxSize": 10485760,
      "protected": false
    }
  }));

  return app.save(collection);
}, (app) => {
  // Rollback: remove both fields
  const collection = app.findCollectionByNameOrId("alumni");
  collection.fields.removeById("file_banner_alumni");
  collection.fields.removeById("file_sertifikat_alumni");
  return app.save(collection);
})
