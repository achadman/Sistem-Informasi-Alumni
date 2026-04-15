import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function setup() {
  try {
    console.log("Authenticating as admin...");
    await pb.admins.authWithPassword("admin@alumni.ac.id", "password123");

    console.log("Creating master_nim collection...");
    try {
      await pb.collections.create({
        name: "master_nim",
        type: "base",
        schema: [
          { name: "nim", type: "text", required: true },
          { name: "name", type: "text", required: true },
          { name: "is_active", type: "bool" },
          { name: "user_id", type: "relation", collectionId: "users", maxSelect: 1 } // Note: "users" might be system id, usually it's "users" if native
        ],
        listRule: "", // Needs to be accessible by public for validation: wait, we can just use `""` admin only? No, we need public access to check NIM. Pocketbase listRule: "" means admin only. We will set it to "" for now and update it if needed. Actually we MUST set it to `""` and I'll update the frontend to use a secure way, or just set it to `true` for development. Let's set it to `true` for easy development.
      });
      console.log("master_nim created.");
    } catch (e) {
      console.log("master_nim might already exist: ", e.message);
    }
    
    // update list rule to true
    try {
        const masterNimColl = await pb.collections.getFirstListItem(`name="master_nim"`);
        await pb.collections.update(masterNimColl.id, {
             listRule: "true",
             updateRule: "true", // for activation update
        });
    } catch (e) {
        let cols = await pb.collections.getFullList();
        let target = cols.find(c => c.name === "master_nim");
        if(target){
           await pb.collections.update(target.id, {
               listRule: "true",
               updateRule: "true",
           });
        }
    }

    console.log("Updating users collection...");
    try {
      const usersCol = await pb.collections.getFirstListItem(`name="users"`);
      // It's an auth collection. Let's add nim and role
      const currentSchema = usersCol.schema;
      const hasNim = currentSchema.find(f => f.name === 'nim');
      if (!hasNim) {
        currentSchema.push({ name: "nim", type: "text", required: false });
        currentSchema.push({ name: "role", type: "text", required: false });
        await pb.collections.update(usersCol.id, {
          schema: currentSchema,
        });
        console.log("users collection updated.");
      }
    } catch (e) {
        let cols = await pb.collections.getFullList();
        let target = cols.find(c => c.name === "users");
        if(target){
            const currentSchema = target.schema;
            const hasNim = currentSchema.find(f => f.name === 'nim');
            if (!hasNim) {
              currentSchema.push({ name: "nim", type: "text", required: false });
              currentSchema.push({ name: "role", type: "text", required: false });
              await pb.collections.update(target.id, {
                schema: currentSchema,
              });
              console.log("users collection updated.");
            }
        } else {
             console.log("users collection update failed: ", e.message);
        }
    }

    console.log("Seeding dummy master_nim data...");
    try {
        await pb.collection('master_nim').create({
            nim: "12345678",
            name: "John Alumni",
            is_active: false
        });
        await pb.collection('master_nim').create({
            nim: "87654321",
            name: "Jane Doe",
            is_active: false
        });
        console.log("Seed complete.");
    } catch (e) {
        console.log("Seed skipped or failed.");
    }
    
    console.log("Setup completed!");

  } catch (error) {
    console.error("Setup failed:", error);
  }
}

setup();
