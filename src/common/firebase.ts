import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import admin from "firebase-admin"
import { initializeApp, cert, ServiceAccount} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import { Buffer } from "buffer";
import * as dotenv from 'dotenv';
dotenv.config();
const privateKey = process.env.SERVER_FIREBASE_CREDS_PRIVATE_KEY ? Buffer.from(process.env.SERVER_FIREBASE_CREDS_PRIVATE_KEY, 'base64').toString().replace(/\\n/g, '\n') : undefined;

const serviceAccount: ServiceAccount = {
    type: process.env.SERVER_FIREBASE_CREDS_TYPE,
    projectId: process.env.SERVER_FIREBASE_CREDS_PROJECT_ID,
    privateKeyId: process.env.SERVER_FIREBASE_CREDS_PRIVATE_KEY_ID,
    privateKey,
    clientEmail: process.env.SERVER_FIREBASE_CREDS_CLIENT_EMAIL,
    clientId: process.env.SERVER_FIREBASE_CREDS_CLIENT_ID,
    authUri: process.env.SERVER_FIREBASE_CREDS_AUTH_URI,
    tokenUri: process.env.SERVER_FIREBASE_CREDS_TOKEN_URI,
    authProviderX509CertUrl: process.env.SERVER_FIREBASE_CREDS_AUTH_PROVIDER_X509_CERT_URL,
    clientX509CertUrl: process.env.SERVER_FIREBASE_CREDS_CLIENT_X509_CERT_URL,
    universeDomain: process.env.SERVER_FIREBASE_CREDS_UNIVERSE_DOMAIN
} as ServiceAccount;

initializeApp({
    credential: cert(serviceAccount)
});
export const firebaseConfig = {
    apiKey: process.env.SERVER_FIREBASE_API_KEY,
    authDomain: process.env.SERVER_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.SERVER_FIREBASE_PROJECT_ID,
    storageBucket: process.env.SERVER_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.SERVER_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.SERVER_FIREBASE_APP_ID,
    measurementId: process.env.SERVER_FIREBASE_MEASUREMENT_ID
};

firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
export const db = getFirestore();
export const logInWithEmailAndPassword = (email: string, password: string) => {
    return auth.signInWithEmailAndPassword(email, password);
}
export const signUpWithEmailAndPassword = (email: string, password: string) => {
    return auth.createUserWithEmailAndPassword(email, password);
}
export const logOut = () => {
    return auth.signOut();
}

export const revokeToken = (token: string) => {
    return admin.auth().revokeRefreshTokens(token);
}
