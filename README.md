# FitCoach - Fitness Coaching Platform

A full-stack fitness coaching platform that connects trainers with clients. Features real-time chat, AI-powered coaching via Google Gemini, workout plan management, and a mobile app built with React Native/Expo.

## Features

- **Phone-based Authentication** - OTP verification with SMS delivery, JWT-based sessions, password reset
- **Trainer Profiles** - Specialties, certificates, bio, ratings, and reviews
- **Workout Plans** - Trainers create and assign weekly schedules with sets, reps, and custom exercises
- **Real-time Chat** - Socket.io powered messaging between trainers and clients
- **AI Coaching** - Context-aware workout feedback and coaching tips powered by Google Gemini
- **Media Uploads** - Profile avatars, certificates, and workout videos via Cloudinary
- **Client Management** - Trainers manage athletes, subscriptions, and schedules

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | React Native, Expo, Zustand, React Navigation, React Hook Form |
| **Backend** | Node.js, Express v5, Socket.io |
| **Database** | PostgreSQL |
| **AI** | Google Gemini (Generative AI) |
| **File Storage** | Cloudinary |
| **SMS/OTP** | Kavenegar |
| **Auth** | JWT, bcrypt |

## Project Structure

```
gym-project/
├── Backend/
│   ├── controllers/       # Route handlers (auth, trainer, user, chat, AI)
│   ├── routes/            # API endpoint definitions
│   ├── middleware/         # JWT authentication middleware
│   ├── realtime/          # Socket.io chat implementation
│   ├── services/          # Cloudinary & SMS integrations
│   ├── utils/             # OTP generation, phone normalization
│   ├── db/                # PostgreSQL connection pool
│   ├── app.js             # Express app setup
│   └── server.js          # HTTP server with Socket.io
│
└── mobile-app/
    ├── src/
    │   ├── screens/       # Auth, Home, Profile, Splash screens
    │   ├── components/    # Reusable UI & feature components
    │   ├── navigation/    # Stack navigator setup
    │   ├── store/         # Zustand state management
    │   ├── api/           # Axios client, API functions, Socket.io client
    │   └── theme/         # Styling & theming
    ├── App.js
    └── app.json           # Expo configuration
```

## Prerequisites

- **Node.js** v18+
- **PostgreSQL** running instance
- **Cloudinary** account (image/video storage)
- **Kavenegar** API key (SMS delivery)
- **Google Gemini** API key (AI coaching)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/erfan2083/gym-project.git
cd gym-project
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` directory:

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# Auth
JWT_SECRET=your_jwt_secret
OTP_SECRET=your_otp_secret

# External Services
KAVENEGAR_API_KEY=your_kavenegar_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GEMINI_API_KEY=your_gemini_key
```

Start the backend:

```bash
npm run dev    # Development (with nodemon)
npm start      # Production
```

The server starts at `http://localhost:3000`.

### 3. Mobile App Setup

```bash
cd mobile-app
npm install
```

Update the backend URL in `src/api/client.js` to match your server address.

Start the app:

```bash
npm start          # Expo dev server
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device
```

## API Endpoints

| Route | Description |
|-------|-------------|
| `POST /api/auth/send-otp` | Send OTP to phone number |
| `POST /api/auth/verify-otp` | Verify OTP code |
| `POST /api/auth/signup` | Register new user |
| `POST /api/auth/login` | Login with credentials |
| `GET /api/trainer/profile` | Get trainer profile |
| `POST /api/trainer/plan` | Create workout plan |
| `GET /api/user/profile` | Get user profile |
| `POST /api/user/review` | Submit trainer review |
| `GET /api/chat/history/:id` | Get chat history |
| `POST /api/ai-chat` | Send message to AI coach |
| `GET /ping` | Health check |

## Database

The application uses PostgreSQL with the following key tables:

- `User` - Accounts with phone, password, and role (client/trainer/admin)
- `trainerprofile` - Trainer details, specialties, and bio
- `plan` - Workout plans created by trainers
- `weeklyschedule` / `scheduleworkout` - Client weekly workout schedules
- `subscription` - Client plan subscriptions
- `chatmessage` - Chat message history
- `review` - Trainer ratings and reviews

## Real-time Communication

Socket.io handles real-time messaging with JWT-authenticated connections. Each user joins a personal room (`user:{userId}`) for direct message delivery.

## License

This project is proprietary software. All rights reserved.
