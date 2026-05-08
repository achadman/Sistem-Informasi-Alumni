/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3712063724")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  // remove field
  collection.fields.removeById("_clone_S2za")

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "_clone_nO7e",
    "maxSelect": 0,
    "name": "name",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Bekerja",
      "Wiraswasta",
      "Belum Bekerja",
      "Melanjutkan Studi"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3712063724")

  // update collection data
  unmarshal({
    "listRule": null,
    "viewRule": null
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "_clone_S2za",
    "maxSelect": 0,
    "name": "name",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Bekerja",
      "Wiraswasta",
      "Belum Bekerja",
      "Melanjutkan Studi"
    ]
  }))

  // remove field
  collection.fields.removeById("_clone_nO7e")

  return app.save(collection)
})
