/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni");
  collection.fields.add(new Field({
    "name": "moto",
    "type": "text",
    "required": false
  }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni");
  collection.fields.removeByName("moto");
  return app.save(collection);
})
