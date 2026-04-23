/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");
  
  // Update role field to include 'industri' option
  try {
    // Remove old role field and re-add with updated values
    collection.fields.add(new Field({
      "name": "role",
      "type": "select",
      "values": ["admin", "alumni", "industri"],
      "required": true
    }));
    app.save(collection);
  } catch (err) {
    console.log("Role field update error:", err);
  }
}, (app) => {
  // Revert: remove industri from role values
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");
  try {
    collection.fields.add(new Field({
      "name": "role",
      "type": "select",
      "values": ["admin", "alumni"],
      "required": true
    }));
    app.save(collection);
  } catch (err) {
    console.log("Role field revert error:", err);
  }
})
