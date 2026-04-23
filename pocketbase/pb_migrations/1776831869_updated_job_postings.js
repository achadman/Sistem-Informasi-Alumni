/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3797952941")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "listRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3797952941")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != '' && @request.auth.role = 'industri'",
    "deleteRule": "@request.auth.id != \"\" && company.user = @request.auth.id",
    "listRule": null,
    "updateRule": "@request.auth.id != \"\" && company.user = @request.auth.id",
    "viewRule": null
  }, collection)

  return app.save(collection)
})
