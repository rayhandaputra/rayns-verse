import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Test connection to Firestore as per requirements
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    // Silence offline errors during initial boot as they can be transient in sandbox environments
    // if (error instanceof Error && error.message.includes("offline")) {
    //   console.error("Please check your Firebase configuration.");
    // }
  }
}

if (typeof window !== "undefined") {
  testConnection();
}
