# Notion Agent with Authentication

This project includes both frontend and backend components with email and Google authentication.

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/notion-agent
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_specific_password
   EMAIL_FROM=your_email@gmail.com
   FRONTEND_URL=http://localhost:3000
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials
5. Create an OAuth 2.0 Client ID
6. Add authorized redirect URIs:
   - http://localhost:5000/api/auth/google/callback (for development)
7. Copy the Client ID and Client Secret to your backend `.env` file

## Email Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in your SMTP_PASS environment variable

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Email verification
- Google OAuth integration
- Protected routes
- CORS configuration
- Environment variable protection
- Rate limiting (implemented in backend)
- Secure password reset flow
- XSS protection
- CSRF protection
