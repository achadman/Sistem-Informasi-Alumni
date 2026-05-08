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
        "id": "_clone_Emb5",
        "max": 8,
        "min": 0,
        "name": "semester_dropout",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number3257917790",
        "max": null,
        "min": null,
        "name": "total",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      }
    ],
    "id": "pbc_2009696130",
    "indexes": [],
    "listRule": null,
    "name": "view_statistik_dropout",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT \n    (ROW_NUMBER() OVER()) as id,\n    semester_dropout,\n    COUNT(id) as total\nFROM alumni\nWHERE keterangan = 'Drop Out (DO)'\nGROUP BY semester_dropout;\n",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2009696130");

  return app.delete(collection);
})
