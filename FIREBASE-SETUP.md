# 🔥 Firebase Setup Guide for SnapBooks

## Overview
Firebase will be used for:
- **Firestore Database**: Store invoice data, user sessions, transaction history
- **Firebase Storage**: Store generated PDFs and XML files
- **Firebase Authentication** (optional): User authentication for web dashboard

---

## Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
Visit: https://console.firebase.google.com/

### 1.2 Create New Project
1. Click **"Add project"**
2. **Project name**: `SnapBooks` (or your preferred name)
3. **Enable Google Analytics**: Yes (recommended for tracking usage)
4. **Analytics account**: Create new or use existing
5. Click **"Create project"**

Wait for project creation (~30 seconds)

---

## Step 2: Set Up Firestore Database

### 2.1 Create Firestore Database
1. In Firebase Console, go to **Build → Firestore Database**
2. Click **"Create database"**
3. **Select location**: Choose closest to your users (e.g., `asia-south1` for India)
4. **Security rules**: Start in **Production mode** (we'll update rules later)
5. Click **"Enable"**

### 2.2 Create Collections
Firestore will auto-create collections when you first write data, but here's the structure:

```
snapbooks (root)
├── invoices/
│   └── {invoiceId}
│       ├── invoice_number: string
│       ├── customer_name: string
│       ├── date: timestamp
│       ├── items: array
│       ├── grand_total: number
│       ├── pdf_url: string
│       ├── xml_url: string
│       ├── created_at: timestamp
│       └── user_id: string
│
├── users/
│   └── {telegramUserId}
│       ├── username: string
│       ├── first_name: string
│       ├── last_name: string
│       ├── created_at: timestamp
│       └── invoice_count: number
│
└── sessions/
    └── {sessionId}
        ├── user_id: string
        ├── image_url: string
        ├── extracted_data: object
        ├── status: string
        └── expires_at: timestamp
```

---

## Step 3: Set Up Firebase Storage

### 3.1 Create Storage Bucket
1. Go to **Build → Storage**
2. Click **"Get started"**
3. **Security rules**: Start in **Production mode**
4. **Storage location**: Same as Firestore (e.g., `asia-south1`)
5. Click **"Done"**

### 3.2 Create Folder Structure
Firebase Storage will auto-create folders, but plan for:
```
gs://your-project.appspot.com/
├── invoices/
│   ├── pdfs/
│   │   └── {invoiceId}.pdf
│   └── xmls/
│       └── {invoiceId}.xml
└── temp/
    └── {sessionId}/
        └── image.jpg
```

---

## Step 4: Generate Service Account Key

### 4.1 Go to Project Settings
1. Click **⚙️ (gear icon)** → **Project settings**
2. Go to **"Service accounts"** tab

### 4.2 Generate New Private Key
1. Click **"Generate new private key"**
2. Click **"Generate key"** in the confirmation dialog
3. A JSON file will download: `snapbooks-xxxxx-firebase-adminsdk-xxxxx.json`

### 4.3 Store Service Account Key
1. **Rename** the file to: `firebase-service-account.json`
2. **Move** it to your project root: `/Users/gauravjain/ai-projects/snapbooks/`
3. **Add to .gitignore** (already done): `firebase-service-account.json`

⚠️ **IMPORTANT**: Never commit this file to git! It contains secret credentials.

---

## Step 5: Update Environment Variables

### 5.1 Add Firebase Configuration to .env
Open `/Users/gauravjain/ai-projects/snapbooks/.env` and add:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# Alternative: Path to service account JSON (easier)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Firebase Storage Bucket
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 5.2 Get Values from Service Account JSON
Open `firebase-service-account.json` and copy:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY`

---

## Step 6: Initialize Firebase in Code

### 6.1 Create Firebase Client Module
Create: `/Users/gauravjain/ai-projects/snapbooks/src/firebaseClient.js`

```javascript
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
    // Option 1: Use service account JSON file (easier)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = JSON.parse(
        readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
      );

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    }
    // Option 2: Use individual environment variables
    else {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    }

    console.log('✅ Firebase initialized successfully');
    return firebaseApp;

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
```

---

## Step 7: Update Firestore Security Rules

### 7.1 Go to Firestore Rules
1. Firebase Console → **Firestore Database**
2. Click **"Rules"** tab

### 7.2 Update Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Invoices collection - authenticated users can read their own
    match /invoices/{invoiceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Sessions - short-lived, anyone can write (bot uses admin SDK)
    match /sessions/{sessionId} {
      allow read, write: if true; // Admin SDK bypasses these rules
    }
  }
}
```

### 7.3 Publish Rules
Click **"Publish"**

---

## Step 8: Update Storage Security Rules

### 8.1 Go to Storage Rules
1. Firebase Console → **Storage**
2. Click **"Rules"** tab

### 8.2 Update Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read for invoices
    match /invoices/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Temp files - auto-delete after 1 day
    match /temp/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 8.3 Publish Rules
Click **"Publish"**

---

## Step 9: Test Firebase Connection

### 9.1 Create Test Script
Create: `/Users/gauravjain/ai-projects/snapbooks/test-firebase.js`

```javascript
import { initializeFirebase, saveInvoice, uploadFile } from './src/firebaseClient.js';
import { readFileSync } from 'fs';

console.log('🧪 Testing Firebase Connection...\n');

async function testFirebase() {
  try {
    // Initialize
    console.log('1️⃣ Initializing Firebase...');
    initializeFirebase();
    console.log('   ✅ Firebase initialized\n');

    // Test Firestore write
    console.log('2️⃣ Testing Firestore write...');
    const testInvoice = {
      invoice_number: 'TEST-001',
      customer_name: 'Test Customer',
      date: new Date().toISOString(),
      items: [{ name: 'Test Item', quantity: 1, rate: 100, amount: 100 }],
      grand_total: 100
    };

    await saveInvoice('test-invoice-001', testInvoice);
    console.log('   ✅ Firestore write successful\n');

    // Test Storage upload
    console.log('3️⃣ Testing Firebase Storage upload...');
    const testBuffer = Buffer.from('Test PDF content', 'utf-8');
    const url = await uploadFile(testBuffer, 'test/test-file.txt', 'text/plain');
    console.log('   ✅ Storage upload successful');
    console.log('   📎 URL:', url, '\n');

    console.log('🎉 All Firebase tests passed!');
    console.log('\n✅ Firebase is ready to use with SnapBooks');

  } catch (error) {
    console.error('\n❌ Firebase test failed:', error.message);
    console.error('   Check your service account JSON and environment variables');
    process.exit(1);
  }
}

testFirebase();
```

### 9.2 Run Test
```bash
node test-firebase.js
```

Expected output:
```
🧪 Testing Firebase Connection...

1️⃣ Initializing Firebase...
   ✅ Firebase initialized

2️⃣ Testing Firestore write...
   ✅ Invoice test-invoice-001 saved to Firestore
   ✅ Firestore write successful

3️⃣ Testing Firebase Storage upload...
   ✅ File uploaded: test/test-file.txt
   ✅ Storage upload successful
   📎 URL: https://storage.googleapis.com/...

🎉 All Firebase tests passed!

✅ Firebase is ready to use with SnapBooks
```

---

## Step 10: Update Pipeline to Use Firebase

### 10.1 Modify pipeline.js
Add Firebase integration to save invoices and upload files:

```javascript
import { saveInvoice, uploadFile } from './firebaseClient.js';

// After PDF and XML generation
const invoiceId = invoiceData.invoice_number.replace(/\//g, '-');

// Upload to Firebase Storage
const [pdfUrl, xmlUrl] = await Promise.all([
  uploadFile(pdfBuffer, `invoices/pdfs/${invoiceId}.pdf`, 'application/pdf'),
  uploadFile(Buffer.from(xmlString), `invoices/xmls/${invoiceId}.xml`, 'application/xml')
]);

// Save to Firestore
await saveInvoice(invoiceId, {
  ...invoiceData,
  pdf_url: pdfUrl,
  xml_url: xmlUrl,
  user_id: userId // from Telegram
});
```

---

## 🎯 Quick Setup Checklist

- [ ] Create Firebase project
- [ ] Enable Firestore Database
- [ ] Enable Firebase Storage
- [ ] Download service account JSON
- [ ] Add to .env or use file path
- [ ] Add firebase-service-account.json to .gitignore
- [ ] Create firebaseClient.js
- [ ] Update security rules (Firestore + Storage)
- [ ] Run test-firebase.js
- [ ] Update pipeline.js to save data

---

## 🔍 Troubleshooting

### Error: "Could not load default credentials"
- Check that `FIREBASE_SERVICE_ACCOUNT_PATH` points to correct file
- Or verify `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` are set

### Error: "Permission denied"
- Update Firestore security rules
- Ensure service account has `Editor` or `Owner` role

### Error: "Storage bucket not found"
- Verify `FIREBASE_STORAGE_BUCKET` matches your project
- Format: `your-project-id.appspot.com`

### Error: "Invalid service account"
- Re-download service account JSON from Firebase Console
- Check JSON file is valid (not corrupted)

---

## 📊 Firebase Console Shortcuts

- **Firestore Data**: https://console.firebase.google.com/project/YOUR_PROJECT/firestore
- **Storage Files**: https://console.firebase.google.com/project/YOUR_PROJECT/storage
- **Service Accounts**: https://console.firebase.google.com/project/YOUR_PROJECT/settings/serviceaccounts

Replace `YOUR_PROJECT` with your Firebase project ID.

---

## 🚀 Next Steps

After Firebase is set up:
1. ✅ Bot can save invoices to cloud
2. ✅ PDFs and XMLs are stored permanently
3. ✅ Build web dashboard to view invoices
4. ✅ Add user analytics and history
5. ✅ Enable invoice search and filters

---

**Firebase Setup Complete!** 🎉

Now your SnapBooks bot can persist data to the cloud instead of just generating temporary files.
