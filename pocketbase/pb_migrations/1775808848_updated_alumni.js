/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3393523030")

  // remove field
  collection.fields.removeById("file_foto_alumni")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3393523030")

  // add field
  collection.fields.addAt(23, new Field({
    "hidden": false,
    "id": "file_foto_alumni",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": null,
    "name": "foto",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(collection)
})
