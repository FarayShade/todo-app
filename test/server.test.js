const assert = require("node:assert/strict");
const { afterEach, beforeEach, test } = require("node:test");
const { createApp } = require("../src/backend/server");

let server;
let baseUrl;
let query;

beforeEach(async () => {
    query = async () => ({ rows: [], rowCount: 0 });
    server = createApp({
        query: (...args) => query(...args)
    }).listen(0);
    await new Promise(resolve => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
    await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
    });
});

test("GET /api/tasks returns tasks from the database", async () => {
    const tasks = [{ id: 2, title: "Second", completed: false }];
    query = async () => ({ rows: tasks });

    const response = await fetch(`${baseUrl}/api/tasks`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), tasks);
});

test("POST /api/tasks trims and stores a non-empty title", async () => {
    let queryArgs;
    query = async (...args) => {
        queryArgs = args;
        return { rows: [{ id: 1, title: "Buy milk", completed: false }] };
    };

    const response = await fetch(`${baseUrl}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "  Buy milk  " })
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
        id: 1,
        title: "Buy milk",
        completed: false
    });
    assert.deepEqual(queryArgs[1], ["Buy milk"]);
});

test("POST /api/tasks rejects missing or blank titles", async () => {
    for (const body of [{}, { title: "  " }, { title: 42 }]) {
        const response = await fetch(`${baseUrl}/api/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
            error: "Название задачи обязательно"
        });
    }
});

test("PUT /api/tasks/:id validates input and reports missing tasks", async () => {
    const invalidResponse = await fetch(`${baseUrl}/api/tasks/0`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true })
    });
    assert.equal(invalidResponse.status, 400);

    const missingResponse = await fetch(`${baseUrl}/api/tasks/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true })
    });
    assert.equal(missingResponse.status, 404);
    assert.deepEqual(await missingResponse.json(), {
        error: "Задача не найдена"
    });
});

test("PUT /api/tasks/:id updates a task completion state", async () => {
    let queryArgs;
    query = async (...args) => {
        queryArgs = args;
        return {
            rows: [{ id: 7, title: "Read", completed: true }],
            rowCount: 1
        };
    };

    const response = await fetch(`${baseUrl}/api/tasks/7`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true })
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        id: 7,
        title: "Read",
        completed: true
    });
    assert.deepEqual(queryArgs[1], [true, 7]);
});

test("DELETE /api/tasks/:id removes an existing task", async () => {
    query = async () => ({ rows: [{ id: 3 }], rowCount: 1 });

    const response = await fetch(`${baseUrl}/api/tasks/3`, {
        method: "DELETE"
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: "Задача удалена" });
});

test("DELETE /api/tasks/:id rejects invalid IDs and reports missing tasks", async () => {
    const invalidResponse = await fetch(`${baseUrl}/api/tasks/-1`, {
        method: "DELETE"
    });
    assert.equal(invalidResponse.status, 400);

    const missingResponse = await fetch(`${baseUrl}/api/tasks/3`, {
        method: "DELETE"
    });
    assert.equal(missingResponse.status, 404);
    assert.deepEqual(await missingResponse.json(), {
        error: "Задача не найдена"
    });
});
