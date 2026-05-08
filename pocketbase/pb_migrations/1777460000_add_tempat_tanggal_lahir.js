/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni")

  // add tempat_lahir
  collection.fields.addAt(collection.fields.length, new Field({
    "name": "tempat_lahir",
    "type": "text",
    "required": false,
    "presentable": false,
    "system": false
  }))

  // add tanggal_lahir
  collection.fields.addAt(collection.fields.length, new Field({
    "name": "tanggal_lahir",
    "type": "date",
    "required": false,
    "presentable": false,
    "system": false
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni")

  collection.fields.removeByName("tempat_lahir")
  collection.fields.removeByName("tanggal_lahir")

  return app.save(collection)
})
