/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("alumni")

  // Enable View and List access to anyone so the Alumni dashboard can fetch its own biodata
  collection.listRule = ""
  collection.viewRule = ""

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni")

  collection.listRule = null
  collection.viewRule = null

  return app.save(collection)
})
