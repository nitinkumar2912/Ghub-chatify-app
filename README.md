💬 Chatify

A modern real-time chat application built for fast, secure, and seamless communication.

Chatify is a full-stack real-time messaging application built with React, Node.js, Express, MongoDB, and Socket.io. It features secure authentication, real-time messaging, online presence, image sharing, typing indicators, email notifications, API protection, and a modern responsive interface.

🚧 Status: Actively in development

⸻

✨ Highlights

Feature	Description
🔐 Authentication	Custom JWT-based authentication with protected routes
💬 Real-Time Chat	Instant messaging powered by Socket.io
🟢 Presence	Real-time online/offline user status
⌨️ Typing Indicator	See when another user is typing
🔔 Notifications	Message and typing notification sounds with toggle
🖼️ Image Sharing	Upload and share images using Cloudinary
📨 Welcome Emails	Automated signup emails using Resend
🚦 API Protection	Rate limiting and security powered by Arcjet
🧠 State Management	Global state handled with Zustand
🎨 Modern UI	React, Tailwind CSS and DaisyUI
🔑 Secure Configuration	Environment-based configuration
🚀 Deployment Ready	Production-ready full-stack architecture

⸻

🛠️ Tech Stack

Frontend

* React — UI development
* Vite — Development and build tooling
* React Router — Client-side routing
* Tailwind CSS — Utility-first styling
* DaisyUI — UI components
* Zustand — State management
* Axios — API communication
* Socket.io Client — Real-time communication

Backend

* Node.js — Runtime environment
* Express.js — REST API
* MongoDB — Database
* Mongoose — MongoDB ODM
* JWT — Authentication
* Socket.io — WebSocket communication

Services

* Cloudinary — Image storage and delivery
* Resend — Transactional emails
* Arcjet — API security and rate limiting

Development

* Git
* GitHub
* Postman
* Environment Variables

⸻

🏗️ Architecture

                         ┌──────────────────┐
                         │     Chatify      │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
             ┌──────▼──────┐             ┌──────▼──────┐
             │   Frontend  │             │   Backend   │
             │    React    │             │ Node/Express│
             └──────┬──────┘             └──────┬──────┘
                    │                           │
             ┌──────▼──────┐             ┌──────▼──────┐
             │   Zustand   │             │  REST API   │
             │   + Axios   │             │ + Socket.io │
             └─────────────┘             └──────┬──────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              │                  │                  │
                         ┌────▼────┐        ┌────▼────┐       ┌─────▼─────┐
                         │ MongoDB │        │Cloudinary│       │  Resend   │
                         └─────────┘        └─────────┘       └───────────┘

⸻

💬 Real-Time Messaging

Chatify uses Socket.io to provide real-time communication.

Messages are delivered instantly without requiring users to refresh the page.

User A
   │
   │ Send message
   ▼
Socket.io
   │
   ▼
Backend
   │
   ├── Save → MongoDB
   │
   └── Emit → Socket.io
                    │
                    ▼
                  User B
                    │
                    ▼
             Message appears
                instantly

⸻

🔐 Authentication

Chatify uses custom JWT authentication instead of a third-party authentication provider.

Signup / Login
      │
      ▼
 Express API
      │
      ▼
 Verify credentials
      │
      ▼
 Generate JWT
      │
      ▼
 Secure Cookie
      │
      ▼
 Protected Routes

Passwords are hashed before being stored in the database.

⸻

📁 Project Structure

chatify/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── lib/
│   │   ├── Emails/
│   │   └── server.js
│   │
│   ├── .env
│   └── package.json
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
│   └── package.json
│
├── .gitignore
└── README.md

⸻

🚀 Getting Started

Prerequisites

Make sure you have installed:

* Node.js
* npm
* MongoDB account
* Cloudinary account
* Resend account
* Arcjet account

⸻

1. Clone the repository

git clone https://github.com/nitinkumar2912/Ghub-chatify-app.git
cd Ghub-chatify-app

⸻

2. Configure the Backend

cd backend
npm install

Create a .env file inside backend/:

PORT=3000
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_email
EMAIL_FROM_NAME=your_name
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development

Start the backend:

npm run dev

Backend:

http://localhost:3000

⸻

3. Configure the Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173

⸻

🔑 Environment Variables

Variable	Purpose
MONGO_URI	MongoDB database connection
JWT_SECRET	JWT signing secret
RESEND_API_KEY	Email service authentication
CLOUDINARY_*	Image upload configuration
ARCJET_KEY	Arcjet security configuration
CLIENT_URL	Frontend URL

⚠️ Never commit your .env file or expose API keys and secrets in your repository.

⸻

🧠 State Management

Chatify uses Zustand for managing global application state.

Authentication State

useAuthStore
├── authenticated user
├── login
├── logout
└── authentication status

Chat State

useChatStore
├── contacts
├── selected user
├── messages
├── online users
├── send message
└── real-time updates

⸻

🔒 Security

Security is an important part of the application.

Chatify implements:

* JWT authentication
* Protected routes
* Password hashing
* HTTP-only authentication cookies
* API rate limiting
* Bot detection
* Arcjet security rules
* Environment-based secrets
* Input validation

⸻

🖼️ Screenshots

Add screenshots of your application here as the UI develops.

Login

Add login screenshot here

Chat

Add chat screenshot here

Signup

Add signup screenshot here

⸻

🗺️ Roadmap

Completed

* User signup
* User login
* User logout
* JWT authentication
* Protected routes
* MongoDB integration
* Contacts
* Message persistence
* Image upload
* Welcome emails
* API security
* Zustand setup
* React Router setup

In Progress

* Real-time messaging
* Online/offline presence
* Typing indicators
* Notification sounds
* Complete chat UI

Future

* Group conversations
* Message reactions
* Message editing
* Message deletion
* File sharing
* Voice messages
* Video calling
* Message search
* Improved mobile experience

⸻

📚 What This Project Demonstrates

This project demonstrates practical experience with:

* Full-stack JavaScript development
* REST API design
* Authentication and authorization
* Real-time WebSocket communication
* Database design
* Cloud storage
* Transactional emails
* API security
* Global state management
* Modern React architecture
* Git branching and collaboration workflows
* Production deployment

⸻

🌱 Development Workflow

Feature development is organized using Git branches.

main
 │
 ├── signup
 ├── login-logout
 ├── welcome-email
 └── chat

Changes are developed separately and merged into the main branch after testing.

⸻

🤝 Contributing

Contributions, suggestions, and feedback are welcome.

1. Fork the repository
2. Create a feature branch

git checkout -b feature/your-feature

3. Make your changes
4. Commit your changes

git commit -m "feat: add your feature"

5. Push your branch

git push origin feature/your-feature

6. Open a Pull Request

⸻

📄 License

This project is licensed under the MIT License.

⸻

⭐ Support

If you like this project, consider giving the repository a ⭐ on GitHub.

Feedback and suggestions are always welcome!

⸻

👨‍💻 Author

Nitin Kumar

Built with ❤️ while learning and exploring full-stack development.
