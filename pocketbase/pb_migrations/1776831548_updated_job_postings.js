/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3797952941")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id != \"\" && company.user = @request.auth.id",
    "listRule": "@request.auth.id != \"\" && (status = \"Aktif\" || company.user = @request.auth.id)",
    "updateRule": "@request.auth.id != \"\" && company.user = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && (status = \"Aktif\" || company.user = @request.auth.id)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3797952941")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || company.user = @request.auth.id)",
    "listRule": "",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || company.user = @request.auth.id)",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
