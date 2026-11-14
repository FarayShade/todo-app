
const express = require("express");
const path = require("path");
const { pool, initDatabase } = require("./database");

const PORT = 3000;

function createApp(database = pool) {
    const app = express();

    app.use(express.json());

    app.use(express.static(
        path.join(__dirname, "../frontend")
    ));

    app.get("/api/tasks", async (req, res) => {
        try {
            const result = await database.query(`
                SELECT * FROM tasks
                ORDER BY id DESC
            `);

            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Ошибка получения задач"
            });
        }
    });

    app.post("/api/tasks", async (req, res) => {
        try {
            const { title } = req.body;

            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({
                    error: "Название задачи обязательно"
                });
            }

            const result = await database.query(
                `INSERT INTO tasks (title)
                 VALUES ($1)
                 RETURNING *`,
                [title.trim()]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Ошибка создания задачи"
            });
        }
    });

    app.put("/api/tasks/:id", async (req, res) => {
        try {
            const id = Number(req.params.id);
            const { completed } = req.body;

            if (
                !Number.isSafeInteger(id) ||
                id < 1 ||
                typeof completed !== "boolean"
            ) {
                return res.status(400).json({
                    error: "Некорректные данные"
                });
            }

            const result = await database.query(
                `UPDATE tasks
                 SET completed = $1
                 WHERE id = $2
                 RETURNING *`,
                [completed, id]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({
                    error: "Задача не найдена"
                });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Ошибка обновления задачи"
            });
        }
    });

    app.delete("/api/tasks/:id", async (req, res) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isSafeInteger(id) || id < 1) {
                return res.status(400).json({
                    error: "Некорректный ID"
                });
            }

            const result = await database.query(
                `DELETE FROM tasks
                 WHERE id = $1
                 RETURNING id`,
                [id]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({
                    error: "Задача не найдена"
                });
            }

            res.json({
                message: "Задача удалена"
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Ошибка удаления задачи"
            });
        }
    });

    return app;
}

async function startServer() {
    try {
        await initDatabase();

        createApp().listen(PORT, () => {
            console.log("--------------------------------");
            console.log("TODO application started");
            console.log(`URL: http://localhost:${PORT}`);
            console.log("--------------------------------");
        });
    } catch (error) {
        console.error("Startup error:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = { createApp };

