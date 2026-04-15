/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni");

  collection.fields.add(new Field({
    "hidden": false,
    "id": "num_semester_dropout",
    "max": 8,
    "min": 0,
    "name": "semester_dropout",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni")
  collection.fields.removeById("num_semester_dropout")
  return app.save(collection)
})
