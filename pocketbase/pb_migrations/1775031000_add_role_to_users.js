/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");
  
  // Add role field if it doesn't exist
  try {
    collection.fields.add(new SchemaField({
      "name": "role",
      "type": "select",
      "values": ["admin", "alumni"],
      "required": true
    }));
    app.save(collection);
  } catch (err) {
    // Already exists or other error
  }
}, (app) => {
  // Irreversible for now or just remove if needed
})
