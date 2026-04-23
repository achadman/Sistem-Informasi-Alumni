/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collections = ["companies", "job_postings", "applications", "bookmarks"];
  
  collections.forEach(name => {
    try {
      const collection = app.findCollectionByNameOrId(name);
      if (!collection) return;

      // Opening List and View for everyone (Public)
      // This allows job seekers and admins to see data without complex filters
      collection.listRule = "";
      collection.viewRule = "";

      // Ensuring companies is fully open to isolate the 400 error
      if (name === "companies") {
        collection.listRule = "";
        collection.viewRule = "";
        collection.createRule = "";
        collection.updateRule = "";
        collection.deleteRule = "";
      } else if (name === "job_postings") {
        // Industry owners can manage their own jobs, Admin can manage all
        collection.createRule = "@request.auth.id != '' && @request.auth.role = 'industri'";
        collection.updateRule = "@request.auth.id != '' && (@request.auth.role = 'admin' || company.user = @request.auth.id)";
        collection.deleteRule = "@request.auth.id != '' && (@request.auth.role = 'admin' || company.user = @request.auth.id)";
      } else if (name === "applications") {
        // Alumni can create, Industry can view/update status, Admin full access
        collection.createRule = "@request.auth.id != '' && @request.auth.role = 'alumni'";
        collection.updateRule = "@request.auth.id != '' && (@request.auth.role = 'admin' || company.user = @request.auth.id)";
      }

      app.save(collection);
      console.log(`Successfully updated rules for collection: ${name}`);
    } catch (err) {
      console.log(`Error updating rules for ${name}:`, err);
    }
  });
}, (app) => {
  // Irreversible change logic would go here if needed
})
