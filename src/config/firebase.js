// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZPi5MsZKFq2MTWxrjzPuKMKSmt_XI7XM",
  authDomain: "aula-ccb81.firebaseapp.com",
  projectId: "aula-ccb81",
  storageBucket: "aula-ccb81.firebasestorage.app",
  messagingSenderId: "431558567766",
  appId: "1:431558567766:web:9115e6540929f2b6df98f7",
  measurementId: "G-CXWTR7H34T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);