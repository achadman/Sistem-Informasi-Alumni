/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const alumniCol = app.findCollectionByNameOrId("alumni");
  if (alumniCol) {
    alumniCol.fields.add(new Field({ "name": "social_media", "type": "json" }));
    app.save(alumniCol);
  }
  
  const companyCol = app.findCollectionByNameOrId("companies");
  if (companyCol) {
    companyCol.fields.add(new Field({ "name": "social_media", "type": "json" }));
    app.save(companyCol);
  }
}, (app) => {
  const alumniCol = app.findCollectionByNameOrId("alumni");
  if (alumniCol) {
    const field = alumniCol.fields.getByName("social_media");
    if (field) alumniCol.fields.removeById(field.id);
    app.save(alumniCol);
  }
  
  const companyCol = app.findCollectionByNameOrId("companies");
  if (companyCol) {
    const field = companyCol.fields.getByName("social_media");
    if (field) companyCol.fields.removeById(field.id);
    app.save(companyCol);
  }
})
