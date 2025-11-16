/**
 * Utility script to sync Firebase Authentication users with Firestore `users` collection.
 *
 * What it does:
 * - Loads all documents from `users` (Firestore) and builds a set of known emails.
 * - Loads all Auth users from Firebase Authentication.
 * - Finds Auth users whose email does NOT exist in the `users` collection (these are "orphan" accounts).
 * - By default (DRY-RUN), it ONLY prints a report.
 * - If you pass the `--apply` flag, it will DELETE those orphan Auth users.
 *
 * IMPORTANT:
 * - This script must be run **on your computer or server**, not inside the mobile app.
 * - It requires a Firebase Admin service account JSON file.
 *
 * Usage:
 * 1. Create a service account key for your Firebase project and download the JSON file.
 * 2. Save it in the project root (e.g., `firebase-admin-key.json`).
 * 3. From the project root, run:
 *
 *    DRY RUN (only show which accounts would be deleted):
 *      node scripts/syncAuthUsers.js
 *
 *    ACTUAL DELETE (remove orphan Auth users):
 *      node scripts/syncAuthUsers.js --apply
 *
 * 4. You can point to a different key file by setting:
 *      set FIREBASE_ADMIN_KEY=./path/to/key.json   (Windows PowerShell / CMD)
 */

const path = require('path');
const admin = require('firebase-admin');

// Resolve service account key path from env or default
const serviceAccountPath =
  process.env.FIREBASE_ADMIN_KEY || path.resolve(__dirname, '..', 'firebase-admin-key.json');

/** @type {import('firebase-admin').ServiceAccount} */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log('🔐 Firebase Admin initialized for project:', serviceAccount.project_id);
  console.log(isApply ? '⚠️ APPLY MODE: Orphan Auth users will be DELETED.' : '🔎 DRY RUN: No users will be deleted.');
  console.log('');

  // 1) Load all Firestore users and build a set of emails
  console.log('📥 Loading Firestore `users` collection...');
  const usersSnapshot = await db.collection('users').get();
  const firestoreEmails = new Set();

  usersSnapshot.forEach((doc) => {
    const data = doc.data() || {};
    if (data.email) {
      firestoreEmails.add(String(data.email).toLowerCase());
    }
  });

  console.log(`📊 Found ${firestoreEmails.size} unique emails in Firestore 'users' collection.`);

  // 2) List all Auth users and find orphans (Auth user without Firestore doc)
  console.log('📥 Loading Firebase Auth users...');
  const orphanUsers = [];
  let pageToken = undefined;

  do {
    const result = await admin.auth().listUsers(1000, pageToken);
    result.users.forEach((userRecord) => {
      const email = (userRecord.email || '').toLowerCase();
      if (!email) return;
      if (!firestoreEmails.has(email)) {
        orphanUsers.push({
          uid: userRecord.uid,
          email,
          createdAt: userRecord.metadata.creationTime,
          lastSignIn: userRecord.metadata.lastSignInTime,
        });
      }
    });
    pageToken = result.pageToken;
  } while (pageToken);

  if (orphanUsers.length === 0) {
    console.log('✅ No orphan Auth users found. Everything is in sync.');
    return;
  }

  console.log('');
  console.log(`⚠️ Found ${orphanUsers.length} Auth user(s) with NO matching Firestore 'users' document:`);
  orphanUsers.forEach((u, index) => {
    console.log(
      `${index + 1}. ${u.email} (uid=${u.uid}, created=${u.createdAt || 'n/a'}, lastSignIn=${u.lastSignIn || 'n/a'})`
    );
  });

  if (!isApply) {
    console.log('');
    console.log('DRY RUN complete. To actually delete these Auth users, re-run with the --apply flag:');
    console.log('  node scripts/syncAuthUsers.js --apply');
    return;
  }

  console.log('');
  console.log('🧹 APPLY MODE: Deleting orphan Auth users...');

  for (const u of orphanUsers) {
    try {
      await admin.auth().deleteUser(u.uid);
      console.log(`✅ Deleted Auth user: ${u.email} (uid=${u.uid})`);
    } catch (error) {
      console.error(`❌ Failed to delete Auth user ${u.email} (uid=${u.uid}):`, error.message || error);
    }
  }

  console.log('');
  console.log('🎉 Done. Orphan Auth users have been processed.');
}

main().catch((err) => {
  console.error('Unexpected error in syncAuthUsers.js:', err);
  process.exit(1);
});


