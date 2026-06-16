# Auxano Facial Recognition

Facial recognition enrollment and verification system for De Guzman Pascual and Associates CPAs using AWS Rekognition.

## Overview

This project contains:

- **Frontend:** React + Vite web app
- **Backend:** Node.js + Express API
- **Face AI:** AWS Rekognition for face validation, indexing, and search
- **Storage:** Local JSON user registry and saved images

The app is designed for enrollment of three face images (front, left, right) and verification of live captures against enrolled profiles.

## Project structure

```
├── backend/
│   ├── data/                 # Local storage for users and images
│   ├── src/
│   │   ├── config.js         # AWS configuration checks
│   │   ├── index.js          # Express server and API routes
│   │   ├── mock-rekognition.js # Dev mock Rekognition provider
│   │   ├── rekognition.js    # AWS Rekognition wrapper and validation
│   │   └── storage.js        # Local user/image persistence
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/       # EnrollForm, VerifyForm, UsersList, WebcamCapture
│   │   └── utils/            # API client and form validation
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Prerequisites

- Node.js 18 or later
- npm
- A modern browser with webcam access (Chrome, Edge, Firefox)
- AWS account for live Rekognition usage

## Backend setup

1. Open a terminal and go to the backend folder:

```bash
cd "c:\Users\ADMIN\Desktop\Auxano Facial Recognition\backend"
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in `backend/` using this template:

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
REKOGNITION_COLLECTION_ID=auxano-faces
PORT=3001
```

4. Start the backend server:

```bash
npm run dev
```

The API will listen on `http://localhost:3001`.

## Frontend setup

1. Open a separate terminal and go to the frontend folder:

```bash
cd "c:\Users\ADMIN\Desktop\Auxano Facial Recognition\frontend"
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend app:

```bash
npm run dev
```

The app will open at `http://localhost:5173`.

## Running the app

- Backend API: `http://localhost:3001`
- Frontend UI: `http://localhost:5173`
- Frontend proxies API requests to the backend via `/api`

## How it works

1. The frontend captures webcam images and sends them to the backend.
2. `/api/validate` checks image quality and face pose.
3. `/api/enroll` saves user details, indexes faces in Rekognition, and stores local images.
4. `/api/verify` validates a live face image and searches the Rekognition collection.
5. `/api/users` returns the list of enrolled users.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check and mode status |
| `POST` | `/api/validate` | Validate a single face image |
| `POST` | `/api/enroll` | Enroll a user with 3 images |
| `POST` | `/api/verify` | Verify live face against enrolled faces |
| `GET` | `/api/users` | List enrolled users |

## Backend behavior

- Image validation uses AWS Rekognition face detection and quality checks.
- Enrollment indexes faces into the Rekognition collection `auxano-faces`.
- Verification returns a match only when similarity is at least `85%`.
- Local data is stored in `backend/data/users.json`.
- Captured images are saved under `backend/data/images/<employeeId>/`.

## Dev mode (mock fallback)

If AWS credentials are missing or invalid, the backend starts in mock mode.

- Validation still works for captured images.
- Enrollment will store user records locally.
- `verify` will not return a real Rekognition match in mock mode.

## Notes

- Use a webcam-friendly browser and allow camera permissions.
- Enroll with three distinct face poses: `front`, `left`, `right`.
- If a user already exists, `employeeId` must be unique.

## Helpful commands

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Recommended improvements

- Add AWS S3 storage for images
- Use a database instead of `users.json`
- Add authentication for admin access
- Move the backend to a hosted API or serverless environment
