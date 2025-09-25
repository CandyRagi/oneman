import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQ_DiGHUH3quU8w370Vvm1laXJj-tVU4Y",
  authDomain: "oneman-452e8.firebaseapp.com",
  databaseURL: "https://oneman-452e8-default-rtdb.firebaseio.com",
  projectId: "oneman-452e8",
  storageBucket: "oneman-452e8.appspot.com", // 🔧 fixed
  messagingSenderId: "24388063631",
  appId: "1:24388063631:web:3599aec55a55a3fa103bfa",
  measurementId: "G-Q4DK42SFTL"
};

// Prevent re-initialization during hot reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
