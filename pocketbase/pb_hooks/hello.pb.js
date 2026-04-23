routerAdd("GET", "/hello", (c) => {
    return c.json(200, { message: "Hello from PocketBase" });
});
