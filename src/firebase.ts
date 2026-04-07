import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmTtVIT_fD3f4IpyM3TRxcXYcYbl4itBs",
  authDomain: "jogodaspistas-3527e.firebaseapp.com",
  projectId: "jogodaspistas-3527e",
  storageBucket: "jogodaspistas-3527e.firebasestorage.app",
  messagingSenderId: "797434716993",
  appId: "1:797434716993:web:b908dcad704873737277c0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
