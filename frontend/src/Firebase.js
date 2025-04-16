// ✅ Import Firebase modules correctly
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBL14lFBUF0--CGXTIDqIdbV9u2s7cIIIE",
  authDomain: "login-with-3a0a4.firebaseapp.com",
  projectId: "login-with-3a0a4",
  storageBucket: "login-with-3a0a4.firebasestorage.app",
  messagingSenderId: "475869277833",
  appId: "1:475869277833:web:1251a490d33a9f6dffe058",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ Correctly export what is needed
export { auth, provider, signInWithPopup };
