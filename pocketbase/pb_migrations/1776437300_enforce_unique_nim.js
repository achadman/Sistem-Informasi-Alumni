migrate((app) => {
  // 1. Search for duplicates and cleanup
  const records = app.findRecordsByFilter("alumni", "1=1", "", 1000, 0);
  const nimGroups = {};

  records.forEach((record) => {
    const nim = (record.get("nim") || "").toString().trim();
    if (!nim) return;
    if (!nimGroups[nim]) {
      nimGroups[nim] = [];
    }
    nimGroups[nim].push(record);
  });

  for (const nim in nimGroups) {
    const group = nimGroups[nim];
    if (group.length > 1) {
      // Find the "best" record based on completeness
      let bestRecord = group[0];
      let bestScore = -1;

      group.forEach((record) => {
        let score = 0;
        // Fields to check for completeness
        const fieldsToCheck = ["email", "no_hp", "alamat", "kota", "provinsi", "status_kerja", "instansi"];
        fieldsToCheck.forEach((field) => {
          if (record.get(field)) score++;
        });

        if (score > bestScore) {
          bestScore = score;
          bestRecord = record;
        }
      });

      // Delete all records in the group except the best one
      group.forEach((record) => {
        if (record.id !== bestRecord.id) {
          console.log(`Deleting duplicate NIM ${nim} (ID: ${record.id}), keeping ID: ${bestRecord.id}`);
          app.deleteRecord(record);
        }
      });
    }
  }

  // 2. Update collection schema to make NIM unique
  const collection = app.findCollectionByNameOrId("alumni");
  const nimField = collection.fields.getByName("nim");
  
  if (nimField) {
    nimField.unique = true;
    app.save(collection);
  }

  return;
}, (app) => {
  const collection = app.findCollectionByNameOrId("alumni");
  const nimField = collection.fields.getByName("nim");
  
  if (nimField) {
    nimField.unique = false;
    app.save(collection);
  }
  
  return;
})
