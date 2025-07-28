// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCsZ298KHPylGpIeilrUwYZ8W9FM8d0ALg",
  authDomain: "mymealapp-ec27f.firebaseapp.com",
  projectId: "mymealapp-ec27f",
  storageBucket: "mymealapp-ec27f.firebasestorage.app",
  messagingSenderId: "445559164783",
  appId: "1:445559164783:web:b70ef814eac8865d08229a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };