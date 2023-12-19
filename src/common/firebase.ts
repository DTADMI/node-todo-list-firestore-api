import {initializeApp, cert, ServiceAccount} from 'firebase-admin/app';
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

export const db = getFirestore();