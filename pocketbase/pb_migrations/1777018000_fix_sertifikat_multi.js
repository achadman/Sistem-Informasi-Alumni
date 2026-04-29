/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni");

  // Update sertifikat field to allow multiple files (maxSelect: 10)
  const field = collection.fields.getByName("sertifikat");
  if (field) {
    field.options = {
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
    };
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni");
  const field = collection.fields.getByName("sertifikat");
  if (field) {
    field.options = {
      "mimeTypes": [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
      ],
      "thumbs": ["200x200"],
      "maxSelect": 1,
      "maxSize": 10485760,
      "protected": false
    };
  }
  return app.save(collection);
})
