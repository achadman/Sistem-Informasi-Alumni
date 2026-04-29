/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("companies");
  collection.fields.add(new Field({
    "name": "banner",
    "type": "file",
    "maxSelect": 1,
    "maxSize": 5242880,
    "mimeTypes": ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
  }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("companies");
  const field = collection.fields.getByName("banner");
  if (field) {
    collection.fields.removeById(field.id);
  }
  return app.save(collection);
})
