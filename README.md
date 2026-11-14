An AI-generated Node.js test project for experimenting with Docker

## Run

Make sure Docker with Docker Compose is installed. Create a `.env` file in the project root:

```env
POSTGRES_USER=todo-app-user
POSTGRES_PASSWORD=supersecretpassword
POSTGRES_DB=todo-app-db
```

Start the app:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Stop the app with `Ctrl+C` or run `docker compose down`.
