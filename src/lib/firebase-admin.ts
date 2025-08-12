// src/lib/firebase-admin.ts
// Lazy, server-only initializer for Firebase Admin Firestore and Storage.
// Avoids hard dependency during build when firebase-admin isn't installed.

let cachedDb: FirebaseFirestore.Firestore | null = null;
let cachedStorage: any | null = null;

export async function getAdminDb(): Promise<FirebaseFirestore.Firestore> {
  if (cachedDb) return cachedDb;

  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID/GOOGLE_CLOUD_PROJECT, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local"
    );
  }

  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  try {
    const { cert, getApps, initializeApp } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    const apps = getApps();
    const app = apps.length
      ? apps[0]
      : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: `${projectId}.firebasestorage.app`,
      });

    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (e: any) {
    if (e?.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find module/.test(String(e))) {
      throw new Error(
        "firebase-admin is not installed. Please run: npm install firebase-admin (server-only dependency)"
      );
    }
    throw e;
  }
}

export async function getAdminStorage() {
  if (cachedStorage) return cachedStorage;

  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID/GOOGLE_CLOUD_PROJECT, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local"
    );
  }

  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  try {
    const { cert, getApps, initializeApp } = await import('firebase-admin/app');
    const { getStorage } = await import('firebase-admin/storage');

    const apps = getApps();
    const app = apps.length
      ? apps[0]
      : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: `${projectId}.firebasestorage.app`,
      });

    cachedStorage = getStorage(app);
    return cachedStorage;
  } catch (e: any) {
    if (e?.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find module/.test(String(e))) {
      throw new Error(
        "firebase-admin is not installed. Please run: npm install firebase-admin (server-only dependency)"
      );
    }
    throw e;
  }
}

