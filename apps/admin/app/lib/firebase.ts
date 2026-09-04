// Client-only — Firebase init untuk login Google di admin KINAU.
// JANGAN import dari server (loader/action) — hanya dari client (event handler).
// apiKey Firebase web aman di-expose (bukan secret); keamanan di-handle Firebase Auth rules.

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCsm3LWyvaXjyedSdAHoyQPCbHoecZyPsc",
  authDomain: "rnd-media.firebaseapp.com",
  projectId: "rnd-media",
  storageBucket: "rnd-media.firebasestorage.app",
  messagingSenderId: "1082775312917",
  appId: "1:1082775312917:web:f2979d208daa236005cc1c",
  measurementId: "G-V1TN40Q051",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Sign in dengan Google popup → return Firebase ID token (bisa diverifikasi
// backend via /auth/google). JANGAN import getAnalytics — tidak diperlukan untuk auth.
export async function signInWithGoogle(): Promise<string> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return idToken;
}

export function onGoogleAuthStateChange(cb: (user: { email: string | null; name: string | null } | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      cb({ email: user.email, name: user.displayName });
    } else {
      cb(null);
    }
  });
}
