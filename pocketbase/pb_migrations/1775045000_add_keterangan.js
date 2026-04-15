/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni");

  collection.fields.add(new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_keterangan",
    "max": 0,
    "min": 0,
    "name": "keterangan",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni")
  collection.fields.removeById("text_keterangan")
  return app.save(collection)
})
