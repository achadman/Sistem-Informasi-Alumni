/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("companies");

  // Allow anyone authenticated to list/view (needed so admin can see all)
  // listRule "" means "authenticated users only" but admin still can't see other's records
  // We fix this using @request.auth.role conditions
  collection.listRule  = "@request.auth.id != ''";
  collection.viewRule  = "@request.auth.id != ''";
  collection.createRule = "@request.auth.id != ''";
  // Allow owner or admin to update
  collection.updateRule = "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')";
  // Only admin can delete
  collection.deleteRule = "@request.auth.role = 'admin'";

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("companies");
  if (!collection) return;

  // revert to old empty rules
  collection.listRule  = "";
  collection.viewRule  = "";
  app.save(collection);
});
