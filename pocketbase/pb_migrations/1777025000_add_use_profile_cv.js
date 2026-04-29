/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni");
  
  collection.fields.add(new Field({
    "system": false,
    "id": "bool_use_profile_cv",
    "name": "use_profile_as_cv",
    "type": "bool",
    "required": false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni");
  collection.fields.removeById("bool_use_profile_cv");
  return app.save(collection);
});
