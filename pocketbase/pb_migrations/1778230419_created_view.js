/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
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
      },
      {
        "hidden": false,
        "id": "number494360628",
        "max": null,
        "min": null,
        "name": "value",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      }
    ],
    "id": "pbc_3712063724",
    "indexes": [],
    "listRule": null,
    "name": "view",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT \n    (ROW_NUMBER() OVER()) as id,\n    status_kerja as name, \n    COUNT(id) as value\nFROM alumni\nGROUP BY status_kerja;\n",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3712063724");

  return app.delete(collection);
})
