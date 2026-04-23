/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("companies");
  if (!collection) return;

  // Set listRule and viewRule to "" = public (anyone can read)
  // This ensures admin dashboard can always see all companies
  // Create/Update/Delete remain protected
  collection.listRule  = "";
  collection.viewRule  = "";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')";
  collection.deleteRule = "@request.auth.role = 'admin'";

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("companies");
  if (!collection) return;

  // revert: back to authenticated-only list 
  collection.listRule = "@request.auth.id != ''";
  collection.viewRule = "@request.auth.id != ''";
  app.save(collection);
});
