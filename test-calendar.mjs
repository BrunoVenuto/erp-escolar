import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";

// Mock Firebase config to test
const firebaseConfig = {
  apiKey: "AIzaSy***", // Redacted for the script, wait I have the real config in client.ts
};
