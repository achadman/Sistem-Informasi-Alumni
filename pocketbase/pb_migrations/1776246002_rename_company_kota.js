/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("companies");
  collection.fields.removeByName("kota");
  collection.fields.add(new Field({
    "name": "kota_kabupaten",
    "type": "text",
    "required": false
  }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("companies");
  collection.fields.removeByName("kota_kabupaten");
  collection.fields.add(new Field({
    "name": "kota",
    "type": "text",
    "required": false
  }));
  return app.save(collection);
})
