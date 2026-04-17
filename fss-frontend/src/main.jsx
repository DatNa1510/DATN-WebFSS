import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

// THAY CLIENT ID BẰNG CỦA BẠN VÀO ĐÂY SAU!
const GOOGLE_CLIENT_ID = "495536065770-6v2unf2jqa7cv18lb4jd7u7gjuucpq2c.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
