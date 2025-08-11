// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "localbuzz-mpkuv",
  "appId": "1:689428714759:web:3f6b7d195dd4a847c4e1a2",
  "storageBucket": "localbuzz-mpkuv.firebasestorage.app",
  "apiKey": "AIzaSyAIQQLuNAc0YhNz4o9LF1Zyw_Fy0nJUfwI",
  "authDomain": "localbuzz-mpkuv.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "689428714759"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
