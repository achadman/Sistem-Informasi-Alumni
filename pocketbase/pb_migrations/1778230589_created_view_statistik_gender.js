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
        "id": "_clone_TBkh",
        "max": null,
        "min": null,
        "name": "tahun_lulus",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "json1435361449",
        "maxSize": 1,
        "name": "male",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "json1249151596",
        "maxSize": 1,
        "name": "female",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      }
    ],
    "id": "pbc_1385254031",
    "indexes": [],
    "listRule": null,
    "name": "view_statistik_gender",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT \n    (ROW_NUMBER() OVER()) as id,\n    tahun_lulus,\n    SUM(CASE WHEN gender = 'L' THEN 1 ELSE 0 END) as male,\n    SUM(CASE WHEN gender = 'P' THEN 1 ELSE 0 END) as female\nFROM alumni\nGROUP BY tahun_lulus;\n",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1385254031");

  return app.delete(collection);
})
