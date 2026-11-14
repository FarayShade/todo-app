
const API_URL = "/api/tasks";

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");

// HTTP-запросы
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Ошибка сервера");
    }

    return data;
}

// Получить задачи
async function loadTasks() {
    try {
        const tasks = await apiRequest(API_URL);
        renderTasks(tasks);
    } catch (error) {
        taskList.textContent = error.message;
    }
}

// Отобразить задачи
function renderTasks(tasks) {
    taskList.innerHTML = "";

    const completed = tasks.filter(task => Boolean(task.completed)).length;

    totalCount.textContent = `Всего: ${tasks.length}`;
    completedCount.textContent = `Выполнено: ${completed}`;

    if (tasks.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "Пока нет задач. Добавьте первую!";
        taskList.appendChild(empty);
        return;
    }

    tasks.forEach(task => {
        const element = document.createElement("div");
        element.className = "task";

        if (task.completed) {
            element.classList.add("completed");
        }

        const title = document.createElement("span");
        title.className = "task-title";
        title.textContent = task.title;

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const completeButton = document.createElement("button");
        completeButton.className = "complete-button";
        completeButton.textContent = task.completed
            ? "Отменить"
            : "Готово";

        completeButton.addEventListener("click", () => {
            toggleTask(task.id, !Boolean(task.completed));
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Удалить";

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.append(completeButton, deleteButton);
        element.append(title, actions);

        taskList.appendChild(element);
    });
}

// Добавить задачу
taskForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) return;

    try {
        await apiRequest(API_URL, {
            method: "POST",
            body: JSON.stringify({ title })
        });

        taskInput.value = "";
        await loadTasks();
    } catch (error) {
        alert(error.message);
    }
});

// Изменить статус
async function toggleTask(id, completed) {
    try {
        await apiRequest(`${API_URL}/${id}`, {
            method: "PUT",
            body: JSON.stringify({ completed })
        });

        await loadTasks();
    } catch (error) {
        alert(error.message);
    }
}

// Удалить задачу
async function deleteTask(id) {
    try {
        await apiRequest(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        await loadTasks();
    } catch (error) {
        alert(error.message);
    }
}

// Первоначальная загрузка
loadTasks();

