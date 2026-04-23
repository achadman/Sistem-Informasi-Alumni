/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const commonRules = "@request.auth.id != ''";
  const adminRules = "@request.auth.role = 'admin'";

  // 1. Provinces
  const provinces = new Collection({
    "name": "provinces",
    "type": "base",
    "listRule": commonRules,
    "viewRule": commonRules,
    "createRule": adminRules,
    "updateRule": adminRules,
    "deleteRule": adminRules
  });
  provinces.fields.add(new Field({ "name": "id_wilayah", "type": "text", "required": true, "unique": true }));
  provinces.fields.add(new Field({ "name": "name", "type": "text", "required": true }));
  app.save(provinces);

  // 2. Regencies
  const regencies = new Collection({
    "name": "regencies",
    "type": "base",
    "listRule": commonRules,
    "viewRule": commonRules,
    "createRule": adminRules,
    "updateRule": adminRules,
    "deleteRule": adminRules
  });
  regencies.fields.add(new Field({ "name": "id_wilayah", "type": "text", "required": true, "unique": true }));
  regencies.fields.add(new Field({ "name": "parent_id", "type": "text", "required": true }));
  regencies.fields.add(new Field({ "name": "name", "type": "text", "required": true }));
  app.save(regencies);

  // 3. Districts
  const districts = new Collection({
    "name": "districts",
    "type": "base",
    "listRule": commonRules,
    "viewRule": commonRules,
    "createRule": adminRules,
    "updateRule": adminRules,
    "deleteRule": adminRules
  });
  districts.fields.add(new Field({ "name": "id_wilayah", "type": "text", "required": true, "unique": true }));
  districts.fields.add(new Field({ "name": "parent_id", "type": "text", "required": true }));
  districts.fields.add(new Field({ "name": "name", "type": "text", "required": true }));
  app.save(districts);

  // 4. Villages
  const villages = new Collection({
    "name": "villages",
    "type": "base",
    "listRule": commonRules,
    "viewRule": commonRules,
    "createRule": adminRules,
    "updateRule": adminRules,
    "deleteRule": adminRules
  });
  villages.fields.add(new Field({ "name": "id_wilayah", "type": "text", "required": true, "unique": true }));
  villages.fields.add(new Field({ "name": "parent_id", "type": "text", "required": true }));
  villages.fields.add(new Field({ "name": "name", "type": "text", "required": true }));
  app.save(villages);

}, (app) => {
  const colls = ["villages", "districts", "regencies", "provinces"];
  colls.forEach(name => {
    const collection = app.findCollectionByNameOrId(name);
    if (collection) app.delete(collection);
  });
})
