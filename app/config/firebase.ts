// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCOQDs3yzvfbkVeUfMAtr4LKkkpvVJnObo",
  authDomain: "kinau-id.firebaseapp.com",
  projectId: "kinau-id",
  storageBucket: "kinau-id.appspot.com",
  messagingSenderId: "248162834692",
  appId: "1:248162834692:web:6e5f1f6258450c7d665851",
  measurementId: "G-S74RNQBLHJ",
};
const app = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
export const auth = getAuth(app);
// export const db = getFirestore(app);
