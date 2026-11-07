# mingle.

A warm, real-time one-to-one chat app built with React, Express, MongoDB, and Socket.IO. Mingle brings live conversations, presence, typing indicators, read receipts, and image sharing into a responsive inbox.

## What’s included

- Email and password signup and login with hashed passwords and an HTTP-only JWT cookie
- Persistent direct messages with instant delivery over Socket.IO
- Online presence, typing indicators, read receipts, and unread counts
- Searchable people list, recent conversations, and unread filtering
- Image sharing with client-side resizing and Cloudinary storage
- Emoji picker, message timestamps, and responsive desktop and mobile layouts
- Welcome emails through Resend and API protection through Arcjet

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Zustand |
| API | Node.js, Express, Axios |
| Realtime | Socket.IO |
| Database | MongoDB, Mongoose |
| Authentication | JWT cookies, bcrypt |
| Media | Cloudinary |
| Email and API protection | Resend, Arcjet |

## Run locally

You’ll need Node.js 18+, npm, a MongoDB database, and credentials for Cloudinary and Arcjet. Resend is used for welcome emails.

1. Install dependencies from the project root:

   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. Create `backend/.env`:

   ```env
   PORT=3000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=use_a_long_random_secret

   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   ARCJET_KEY=your_arcjet_key
   ARCJET_ENV=development

   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM=hello@your-domain.com
   EMAIL_FROM_NAME=mingle.
   ```

3. Start the backend in one terminal:

   ```bash
   npm run dev --prefix backend
   ```

4. Start the frontend in another terminal:

   ```bash
   npm run dev --prefix frontend
   ```

   Open [http://localhost:5173](http://localhost:5173).

Keep `.env` and all provider credentials private. The frontend uses `/api` and the same host for Socket.IO in production. For a separately hosted frontend, set `CLIENT_URL` to its exact origin and configure the deployment to forward API and Socket.IO traffic to the backend.

### MongoDB connection errors

- `ENOTFOUND` means the Atlas SRV hostname could not be resolved. Copy the current hostname from Atlas **Connect → Drivers** and confirm the cluster is active and DNS SRV lookups are available.
- Atlas error `8000` with `bad auth` means the database rejected the credentials. Use a MongoDB **database user** from Atlas Database Access, check its password, and percent-encode reserved characters in the password portion of the URI. Do not use your Atlas website password.

## Production build

Run `npm run build` from the project root to install both workspaces and build the frontend. Set `NODE_ENV=production` and the environment variables above on the backend before starting it with `npm start`.

## Project layout

```text
backend/src/
  controllers/    Authentication and messaging endpoints
  middleware/     Session and Arcjet protection
  models/         MongoDB user and message models
  routes/         REST API routes
  server.js       Express and authenticated Socket.IO server

frontend/src/
  pages/          Authentication and chat screens
  store/          Authentication and chat state
  lib/            Axios API client
```
