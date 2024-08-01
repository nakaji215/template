import { initializeApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyC7tKztPTyVE0uHxqBRMXNXg3IgHjtsc7I",
  authDomain: "template-33e07.firebaseapp.com",
  projectId: "template-33e07",
  storageBucket: "template-33e07.appspot.com",
  messagingSenderId: "742419562518",
  appId: "1:742419562518:web:501a7e3174e38fb9443537"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// Firebaseの認証とデータベースのインスタンス
export const auth = getAuth(app);
export const database = getDatabase(app);
