
const express = require("express");
const path = require("path");
const { pool, initDatabase } = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json());

// Frontend
app.use(express.static(
    path.join(__dirname, "../frontend")
));

// GET: получить все задачи
app.get("/api/tasks", async (req, res) => {
    try {
        const result = await pool.query(`
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

// POST: создать задачу
app.post("/api/tasks", async (req, res) => {
    try {
        const { title } = req.body;

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                error: "Название задачи обязательно"
            });
        }

        const result = await pool.query(
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

// PUT: изменить статус задачи
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

        const result = await pool.query(
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

// DELETE: удалить задачу
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Некорректный ID"
            });
        }

        const result = await pool.query(
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

// Запуск приложения
async function startServer() {
    try {
        await initDatabase();

        app.listen(PORT, () => {
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

startServer();

