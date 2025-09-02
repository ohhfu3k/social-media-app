import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, Firestore } from "firebase-admin/firestore";

function getCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey && privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey } as const;
  }
  return null;
}

const creds = getCredentials();
export const firebaseEnabled = !!creds;

let db: Firestore | null = null;
if (firebaseEnabled) {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: creds!.projectId,
        clientEmail: creds!.clientEmail,
        privateKey: creds!.privateKey!,
      }),
    });
  }
  db = getFirestore();
}

export const firestore = db as Firestore;
export const serverTimestamp = FieldValue.serverTimestamp;
export const arrayUnion = FieldValue.arrayUnion;
export const arrayRemove = FieldValue.arrayRemove;
