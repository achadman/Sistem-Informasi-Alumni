/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("companies");
  collection.fields.add(new Field({ "name": "kecamatan", "type": "text" }));
  collection.fields.add(new Field({ "name": "kelurahan", "type": "text" }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("companies");
  const field1 = collection.fields.getByName("kecamatan");
  if (field1) collection.fields.removeById(field1.id);
  const field2 = collection.fields.getByName("kelurahan");
  if (field2) collection.fields.removeById(field2.id);
  return app.save(collection);
})
