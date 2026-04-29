/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("applications");

  // update field
  const statusField = collection.fields.getByName("status");
  if (statusField) {
    statusField.values = ["Pending", "Shortlisted", "Interview", "Hired", "Rejected", "Dilihat", "Dihubungi", "Ditolak"];
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("applications");

  // revert field
  const statusField = collection.fields.getByName("status");
  if (statusField) {
    statusField.values = ["Pending", "Dilihat", "Dihubungi", "Ditolak"];
  }

  return app.save(collection);
})
