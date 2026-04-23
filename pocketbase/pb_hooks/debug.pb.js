routerAdd("GET", "/debug-fetch", (c) => {
    try {
        const records = $app.dao().findRecordsByFilter("companies", "1=1", "-created", 100, 0);
        return c.json(200, { success: true, count: records.length });
    } catch (err) {
        return c.json(400, { success: false, error: err.message });
    }
});
