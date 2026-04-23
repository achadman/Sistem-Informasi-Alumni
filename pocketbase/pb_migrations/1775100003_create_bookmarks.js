/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const companiesCol = app.findCollectionByNameOrId("companies");
  const alumniCol = app.findCollectionByNameOrId("alumni");

  const collection = new Collection({
    "name": "bookmarks",
    "type": "base",
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != '' && @request.auth.role = 'industri'",
    "updateRule": "@request.auth.id != '' && @request.auth.role = 'industri'",
    "deleteRule": "@request.auth.id != '' && @request.auth.role = 'industri'"
  });

  collection.fields.add(new Field({
    "name": "company",
    "type": "relation",
    "required": true,
    "collectionId": companiesCol.id,
    "cascadeDelete": true,
    "maxSelect": 1
  }));
  collection.fields.add(new Field({
    "name": "alumni",
    "type": "relation",
    "required": true,
    "collectionId": alumniCol.id,
    "cascadeDelete": true,
    "maxSelect": 1
  }));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("bookmarks");
  if (collection) app.delete(collection);
})
