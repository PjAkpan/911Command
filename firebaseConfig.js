// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDw--K5coIZ-L-b9gaN-e4yurTFvIEsG3E",
  authDomain: "command-e92a9.firebaseapp.com",
  projectId: "command-e92a9",
  storageBucket: "command-e92a9.appspot.com",
  messagingSenderId: "1041524721920",
  appId: "1:1041524721920:web:4d4797c3b3cbac09354be5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
