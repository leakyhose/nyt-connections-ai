const firebaseConfig = {
  apiKey: "AIzaSyBcyUQ0PVVjdUgZAb4u3RbpbodRaAdx_dI",
  authDomain: "nyt-connections-ai.firebaseapp.com",
  projectId: "nyt-connections-ai",
  storageBucket: "nyt-connections-ai.firebasestorage.app",
  messagingSenderId: "179130960645",
  appId: "1:179130960645:web:b3810c385628f70921456c",
  measurementId: "G-TGPKNHBQMH"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
