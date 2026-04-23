/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("companies");

  collection.fields.add(new Field({
    "name": "kecamatan",
    "type": "text",
    "required": false
  }));

  collection.fields.add(new Field({
    "name": "kelurahan",
    "type": "text",
    "required": false
  }));

  collection.fields.add(new Field({
    "name": "rt",
    "type": "text",
    "required": false
  }));

  collection.fields.add(new Field({
    "name": "rw",
    "type": "text",
    "required": false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("companies");
  collection.fields.removeByName("kecamatan");
  collection.fields.removeByName("kelurahan");
  collection.fields.removeByName("rt");
  collection.fields.removeByName("rw");
  return app.save(collection);
})
