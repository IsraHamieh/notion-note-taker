# Notion Agent

Notion Agent is a full-stack application for transforming files, web content, and YouTube videos into structured Notion pages using AI. It features a modern React frontend, a Node.js/Express backend for authentication and Notion API proxying, and a Python/FastAPI backend for AI-powered content processing.

---

## Features
- **Modern React Frontend**: Clean UI for uploading files, searching Notion, and managing API keys.
- **Authentication**: Secure JWT-based email/password authentication.
- **API Key Management**: Store and encrypt Notion and AI provider keys per user.
- **Notion Integration**: Search and select Notion pages/databases, and send content directly to Notion.
- **Multi-Agent AI Processing**: Python backend orchestrates file parsing, web search, math, diagrams, and more.
- **File & YouTube Support**: Upload PDFs, DOCX, PPTX, XLSX, images, and YouTube links.
- **Chat History**: Save and view previous AI-generated Notion content.
- **Security**: All sensitive data is encrypted; CORS and environment variable protection.

---

## Required Libraries

### Backend (Node.js/TypeScript)
- @notionhq/client
- axios
- bcryptjs
- cors
- dotenv
- express
- jsonwebtoken
- mongoose
- nodemailer
- passport
- passport-jwt
- nodemon (dev)
- ts-node (dev)
- typescript (dev)

### Backend (Python/FastAPI)
- ray
- langgraph
- langchain
- langchain-anthropic
- langchain-tavily
- langchain_core
- requests
- llamaparse
- pytube
- Pillow
- openpyxl
- fastapi
- uvicorn[standard]
- python-multipart

### Frontend (React)
- @emotion/react
- @emotion/styled
- @mui/icons-material
- @mui/material
- @testing-library/dom
- @testing-library/jest-dom
- @testing-library/react
- @testing-library/user-event
- @types/jest
- @types/node
- @types/react
- @types/react-dom
- axios
- react
- react-dom
- react-dropzone
- react-router-dom
- react-scripts
- typescript
- web-vitals
- tailwindcss
- postcss
- autoprefixer

---

## Setup Guide

### 1. Backend (Node.js/TypeScript)

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```
PORT=5050
NODE_ENV=development
MONGO_URI=mongodb-connection-uri
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your-256-bit-encryption-key
FRONTEND_URL=http://localhost:3000
```

Start the backend server:
```bash
npm run dev
```

### 2. Backend (Python/FastAPI)

```bash
cd backend
pip install -r requirements.txt
```

Set up any required environment variables (see backend/README.md for details if needed).

Start the Python backend:
```bash
python app.py
# or for development
uvicorn app:app --reload --host 0.0.0.0 --port 5000
```

### 3. Frontend (React)

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory (optional, for direct API calls):
```
REACT_APP_API_URL=http://localhost:5000
```

Start the frontend dev server:
```bash
npm start
```

---

## Backend: Dockerized Multi-Container Setup

### 1. Configure Environment Variables

- Copy the provided `.env` sample and fill in your secrets:
  ```sh
  cp backend/.env backend/.env.local
  # Edit backend/.env.local and set your values
  ```
- **Do NOT commit your .env file to git.**

### 2. Build and Run Both Backends with Docker Compose

From the `backend` directory:
```sh
docker-compose up --build
```
- This will build and start:
  - Node.js backend (Express) on [http://localhost:5000](http://localhost:5000)
  - Python FastAPI backend on [http://localhost:5001](http://localhost:5001)

Both services will use environment variables from `.env`.

### 3. Stopping the Services

Press `Ctrl+C` to stop, or run:
```sh
docker-compose down
```

### 4. Environment Variables Reference

- `FRONTEND_URL` — URL of your frontend (for CORS)
- `MONGO_URI` — MongoDB connection string
- `AWS_REGION` — AWS region for DynamoDB/S3
- `JWT_SECRET` — JWT secret for Node.js backend

---

## Local Development (without Docker)

You can still run each backend manually if you prefer:
- Python: `uvicorn app:app --host 0.0.0.0 --port 5001`
- Node.js: `npm run start:node`

---

## Architecture

```
[React Frontend] → [Node.js/Express Auth/API Proxy] → [Python FastAPI AI Backend]
```
- **Frontend**: User interface, authentication, file upload, Notion search, chat history
- **Node.js Backend**: Auth, user & key management, Notion API proxy, MongoDB
- **Python Backend**: AI processing, file parsing, web search, agent orchestration

---

## Security Notes
- Passwords and API keys are encrypted in the database
- JWT-based authentication for all protected routes
- CORS configured for secure frontend-backend communication
- Environment variables for all secrets and keys
- Rate limiting and error handling on backend

---

## Project Description

Notion Agent is designed to help users turn their files, web content, and YouTube videos into beautiful, structured Notion pages using the power of AI. It provides a seamless workflow from uploading and searching to AI-powered content generation and direct Notion integration, all with modern security and a great user experience.
