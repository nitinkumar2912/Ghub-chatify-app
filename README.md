💬 Chatify

A modern real-time chat application built with React, Node.js, Express, MongoDB, and Socket.io.

✨ Features

* 🔐 JWT Authentication & protected routes
* 💬 Real-time messaging with Socket.io
* 🟢 Online/offline presence & typing indicators
* 🔔 Notification and typing sounds
* 🖼️ Image sharing with Cloudinary
* 📨 Welcome emails with Resend
* 🚦 API security & rate limiting with Arcjet
* 🧠 Global state management with Zustand
* 🎨 Responsive UI with Tailwind CSS & DaisyUI
* 🧱 MongoDB + Mongoose for data persistence
* 🔀 Git/GitHub branching & feature-based workflow
* 🚀 Deployment-ready full-stack architecture

🛠️ Tech Stack

Frontend: React, Vite, React Router, Tailwind CSS, DaisyUI, Zustand, Axios, Socket.io Client

Backend: Node.js, Express, MongoDB, Mongoose, JWT, Socket.io

Services: Cloudinary, Resend, Arcjet

📁 Project Structure

chatify/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── store/
│       └── lib/
│
├── backend/
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── lib/
│
└── README.md

⚙️ Setup

Backend

cd backend
npm install
npm run dev

Frontend

cd frontend
npm install
npm run dev

Create a .env file in backend/ with your MongoDB, JWT, Resend, Cloudinary, and Arcjet credentials.

PORT=3000
MONGO_URI=your_mongodb_uri
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

⚠️ Never commit your .env file or expose your API keys.

🚀 What I Learned

This project helped me practice full-stack development, authentication, REST APIs, real-time communication, database management, cloud services, API security, state management, and Git/GitHub workflows.

📌 Status

🚧 Currently in development

⭐ If you like the project, feel free to star the repository and share your feedback.
