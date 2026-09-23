import {initializeApp,getApps} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";
import {getAuth} from "firebase/auth";
export const firebaseConfig={apiKey:"AIzaSyBaQOHGPC8u0bcKSA91x87QQnludZ0TP1U",authDomain:"zara-shadi-service.firebaseapp.com",projectId:"zara-shadi-service",storageBucket:"zara-shadi-service.firebasestorage.app",messagingSenderId:"369935194560",appId:"1:369935194560:web:99beaadf702ffa1e0b5025"};
export const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);
export const db=getFirestore(app);
export const storage=getStorage(app);
export const auth=getAuth(app);