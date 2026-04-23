/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3321051417")

  // update collection data
  unmarshal({
    "name": "master_alamat"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3321051417")

  // update collection data
  unmarshal({
    "name": "master_nim"
  }, collection)

  return app.save(collection)
})
