/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3393523030")

  // add field
  collection.fields.addAt(32, new Field({
    "hidden": false,
    "id": "date2990389176",
    "max": "",
    "min": "2026-04-29 01:00:00.000Z",
    "name": "created",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3393523030")

  // remove field
  collection.fields.removeById("date2990389176")

  return app.save(collection)
})
