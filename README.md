# 💬 Real-Time Chat App

A full-stack real-time chat application built with **React, Node.js, Express, MongoDB and Socket.io**.

The project includes custom JWT authentication, real-time messaging, online/offline presence, image sharing, typing indicators, notifications, email integration and API security.

---

## ✨ Features

- 🔐 **Custom JWT Authentication**
  - Signup & Login
  - Protected routes
  - Secure authentication with HTTP-only cookies

- ⚡ **Real-Time Messaging**
  - Instant messaging using Socket.io
  - Real-time message updates

- 🟢 **Online / Offline Presence**
  - See when users are online
  - Real-time presence updates

- ⌨️ **Typing Indicators**
  - Real-time typing status
  - Typing notification sounds

- 🔔 **Notification Sounds**
  - Message notification sounds
  - Sound toggle option

- 📨 **Welcome Emails**
  - Welcome email sent after signup
  - Powered by Resend

- 🖼️ **Image Sharing**
  - Upload images in chats
  - Cloudinary integration

- 🧰 **REST API**
  - Built with Node.js & Express
  - Clean controller and route structure

- 🧱 **MongoDB**
  - User persistence
  - Message persistence
  - Mongoose ODM

- 🚦 **API Rate Limiting & Security**
  - Powered by Arcjet

- 🎨 **Modern UI**
  - React
  - Tailwind CSS
  - DaisyUI
  - Responsive chat interface

- 🧠 **State Management**
  - Zustand for global application state

- 🧪 **Environment Variables**
  - Separate configuration for development and production

- 🚀 **Deployment Ready**
  - Easy deployment
  - Free-tier friendly architecture

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- DaisyUI
- Zustand
- Axios
- Socket.io Client

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Socket.io
- Cloudinary
- Resend
- Arcjet

### Tools

- Git
- GitHub
- Postman
- VS Code

---

## 📁 Project Structure

```text
real-time-chat-app/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── lib/
│   │   └── server.js
│   │
│   ├── .env
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── ...
│
├── .gitignore
├── package.json
└── README.md
