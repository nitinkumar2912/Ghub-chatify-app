# 💬 Chatify

### A full-stack real-time chat application built with React, Node.js, Express, MongoDB and Socket.io.

Chatify is a modern messaging platform focused on **real-time communication, secure authentication, and a smooth user experience**. It includes JWT authentication, real-time messaging, online presence, typing indicators, image sharing, email notifications, and API security.

---

## 🚀 Live Demo

🌐 **Live App:** Coming soon

📦 **Repository:** https://github.com/nitinkumar2912/Ghub-chatify-app

---

## ✨ Features

- 🔐 **JWT Authentication** — Signup, login, logout and protected routes
- 💬 **Real-Time Messaging** — Instant communication using Socket.io
- 🟢 **Online / Offline Presence** — Real-time user availability
- ⌨️ **Typing Indicators** — See when another user is typing
- 🔔 **Notification Sounds** — Message and typing sounds with toggle
- 🖼️ **Image Sharing** — Upload and share images through Cloudinary
- 📨 **Welcome Emails** — Automated signup emails using Resend
- 🚦 **API Security** — Rate limiting and bot protection with Arcjet
- 🧠 **State Management** — Zustand for global application state
- 🎨 **Modern UI** — React, Tailwind CSS and DaisyUI
- 🧱 **Persistent Data** — MongoDB with Mongoose
- 🔀 **Git Workflow** — Feature branches, commits, merges and pull requests
- 🚀 **Deployment Ready** — Environment-based production configuration

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, Vite, React Router |
| Styling | Tailwind CSS, DaisyUI |
| State | Zustand |
| API | Axios, REST API |
| Real-Time | Socket.io |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Image Storage | Cloudinary |
| Email | Resend |
| Security | Arcjet |
| Version Control | Git, GitHub |

---

## 🏗️ Architecture

```text
                         ┌─────────────────┐
                         │     Chatify     │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
             ┌──────▼──────┐             ┌──────▼──────┐
             │   React     │             │   Express   │
             │  Frontend   │◄───────────►│   Backend   │
             └──────┬──────┘             └──────┬──────┘
                    │                           │
              ┌─────▼─────┐              ┌──────▼──────┐
              │  Zustand  │              │   MongoDB   │
              │   State   │              │  Database   │
              └───────────┘              └─────────────┘
                    │
              ┌─────▼─────┐
              │ Socket.io │
              │ Real-Time │
              └───────────┘

       Cloudinary → Image Storage
       Resend     → Email Service
       Arcjet     → API Security
```

---

## 📁 Project Structure

```text
Chatify/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── store/
│       ├── lib/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
├── backend/
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── lib/
│       ├── Emails/
│       └── server.js
│
├── .gitignore
└── README.md
```

---

# ⚙️ Getting Started

Follow the steps below to run Chatify locally.

## Prerequisites

Make sure you have installed:

- Node.js 18+
- npm
- Git
- MongoDB
- Cloudinary account
- Resend account
- Arcjet account

---

## 1. Clone the Repository

```bash
git clone https://github.com/nitinkumar2912/Ghub-chatify-app.git

cd Ghub-chatify-app
```

---

# 🔧 Backend Setup

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

## 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

NODE_ENV=development

JWT_SECRET=your_jwt_secret

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_email_address
EMAIL_FROM_NAME=your_email_name

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development
```

> ⚠️ **Never commit your `.env` file or expose your API keys and secrets.**

## 4. Start the Backend

```bash
npm run dev
```

Backend:

```text
http://localhost:3000
```

---

# 💻 Frontend Setup

Open a new terminal from the project root.

## 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## 6. Start the Frontend

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

---

# 🔐 Authentication

Chatify uses custom JWT authentication instead of a third-party authentication provider.

```text
User
  │
  ▼
Signup / Login
  │
  ▼
Express API
  │
  ▼
Validate Credentials
  │
  ▼
Generate JWT
  │
  ▼
Secure Cookie
  │
  ▼
Protected API Routes
```

Passwords are hashed using bcrypt before being stored.

---

# 💬 Real-Time Messaging

Socket.io enables instant communication between connected users.

```text
User A
   │
   │ Send Message
   ▼
Socket.io
   │
   ▼
Backend
   ├── Save message → MongoDB
   │
   └── Emit message
            │
            ▼
         User B
            │
            ▼
    Message appears instantly
```

This architecture allows messages and presence updates to be delivered without refreshing the page.

---

# 🖼️ Image Uploads

Images are uploaded to Cloudinary and the resulting URL is stored with the message.

```text
Frontend
   │
   ▼
Image
   │
   ▼
Backend
   │
   ▼
Cloudinary
   │
   ▼
Image URL
   │
   ▼
MongoDB
```

---

# 🧠 State Management

Zustand is used to manage application-wide state.

### Authentication

```text
useAuthStore
├── Current User
├── Login
├── Logout
└── Authentication Status
```

### Chat

```text
useChatStore
├── Contacts
├── Selected User
├── Messages
├── Online Users
└── Real-Time Updates
```

---

# 🚦 Security

Chatify includes multiple layers of protection:

- JWT-based authentication
- Protected API routes
- Password hashing
- Secure authentication cookies
- Arcjet rate limiting
- Bot detection
- Environment-based secrets

---

# 📸 Screenshots

> Add real screenshots here once the UI is finalized.

### Login

![Login](./screenshots/login.png)

### Chat

![Chat](./screenshots/chat.png)

### Signup

![Signup](./screenshots/signup.png)

---

# 🗺️ Roadmap

### Completed

- [x] User signup
- [x] User login
- [x] User logout
- [x] JWT authentication
- [x] Protected routes
- [x] MongoDB integration
- [x] Contacts
- [x] Message persistence
- [x] Image uploads
- [x] Welcome emails
- [x] API security
- [x] Zustand setup

### In Progress

- [ ] Real-time messaging
- [ ] Online / offline presence
- [ ] Typing indicators
- [ ] Notification sounds

### Planned

- [ ] Group chats
- [ ] Message reactions
- [ ] Message editing
- [ ] Message deletion
- [ ] File sharing
- [ ] Voice messages
- [ ] Video calling
- [ ] Message search

---

# 📚 Key Engineering Concepts

This project demonstrates practical experience with:

- Full-stack application architecture
- REST API design
- JWT authentication & authorization
- Express middleware
- MongoDB data modeling
- Real-time WebSocket communication
- Cloud-based image storage
- Transactional email integration
- API security and rate limiting
- Global frontend state management
- Git branching and collaborative workflows
- Environment-based configuration
- Production deployment

---

# 🔀 Git Workflow

Features are developed using separate branches rather than directly modifying `main`.

```text
main
 │
 ├── signup
 ├── login-logout
 ├── welcome-email
 ├── chat
 └── feature/*
```

Example:

```bash
git checkout -b feature/new-feature

git add .

git commit -m "feat: add new feature"

git push origin feature/new-feature
```

---

# 🤝 Contributing

Contributions, suggestions and feedback are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Push your branch
6. Open a Pull Request

---

# 👨‍💻 Author

### Nitin Kumar

Full-stack developer building and learning through real-world projects.

📌 GitHub: https://github.com/nitinkumar2912

---

## ⭐ Support

If you found this project interesting, consider giving it a ⭐ on GitHub.

Feedback and suggestions are always welcome.
