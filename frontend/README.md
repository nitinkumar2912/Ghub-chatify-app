# Mingle frontend

React and Vite client for the Mingle chat app. The app uses Zustand for session and conversation state, Axios for the REST API, and Socket.IO for live messages and presence.

## Local development

From the project root:

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

The backend should be running at `http://localhost:3000` with `CLIENT_URL=http://localhost:5173`. See the root [README](../README.md) for backend setup and environment variables.

## Build and lint

```bash
npm run build --prefix frontend
npm run lint --prefix frontend
```

To point the client at a different API base URL, set `VITE_API_URL` to the API root, including `/api` (for example, `https://chat.example.com/api`). Socket.IO connects to the same host.
