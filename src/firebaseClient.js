import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

let firebaseApp;

/**
 * Initialize Firebase Admin SDK
 * @returns {admin.app.App} Firebase app instance
 */
export function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Use service account JSON file
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = JSON.parse(
        readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
      );

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });

      console.log('✅ Firebase initialized successfully');
      return firebaseApp;
    }

    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH not configured in .env');

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
}

/**
 * Get Firestore database instance
 * @returns {admin.firestore.Firestore}
 */
export function getFirestore() {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
}

/**
 * Get Firebase Storage bucket
 * @returns {admin.storage.Storage}
 */
export function getStorage() {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.storage();
}

/**
 * Save invoice to Firestore
 * @param {string} invoiceId - Unique invoice ID
 * @param {Object} invoiceData - Invoice data object
 * @returns {Promise<void>}
 */
export async function saveInvoice(invoiceId, invoiceData) {
  const db = getFirestore();

  const invoice = {
    ...invoiceData,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('invoices').doc(invoiceId).set(invoice);
  console.log(`✅ Invoice ${invoiceId} saved to Firestore`);
}

/**
 * Upload file to Firebase Storage
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} destinationPath - Path in storage (e.g., 'invoices/pdfs/INV-001.pdf')
 * @param {string} contentType - MIME type (e.g., 'application/pdf')
 * @returns {Promise<string>} Public download URL
 */
export async function uploadFile(fileBuffer, destinationPath, contentType) {
  const bucket = getStorage().bucket();
  const file = bucket.file(destinationPath);

  await file.save(fileBuffer, {
    metadata: { contentType },
    public: true
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
  console.log(`✅ File uploaded: ${destinationPath}`);

  return publicUrl;
}

/**
 * Save user session
 * @param {string} userId - Telegram user ID
 * @param {Object} sessionData - Session data
 * @returns {Promise<void>}
 */
export async function saveSession(userId, sessionData) {
  const db = getFirestore();

  const session = {
    ...sessionData,
    expires_at: admin.firestore.Timestamp.fromMillis(Date.now() + 3600000), // 1 hour
    created_at: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('sessions').doc(userId).set(session);
}

/**
 * Get user session
 * @param {string} userId - Telegram user ID
 * @returns {Promise<Object|null>}
 */
export async function getSession(userId) {
  const db = getFirestore();
  const doc = await db.collection('sessions').doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  const session = doc.data();

  // Check if expired
  if (session.expires_at.toMillis() < Date.now()) {
    await db.collection('sessions').doc(userId).delete();
    return null;
  }

  return session;
}

export default {
  initializeFirebase,
  getFirestore,
  getStorage,
  saveInvoice,
  uploadFile,
  saveSession,
  getSession
};
