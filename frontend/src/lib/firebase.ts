import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBTtiYQrU9MoJnTHYJgGt2RIqFnr7U2a5Y",
  authDomain: "accps-b100b.firebaseapp.com",
  projectId: "accps-b100b",
  storageBucket: "accps-b100b.firebasestorage.app",
  messagingSenderId: "618202074543",
  appId: "1:618202074543:web:4f88f4aa62e2911f42f35a",
  measurementId: "G-F97XQD1YW0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
