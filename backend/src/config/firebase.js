const admin = require("firebase-admin");

// Initialize Firebase Admin SDK from env vars (don't commit the JSON file!)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // private_key has \n in it which env vars convert to literal \\n — fix:
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin initialized");
  } catch (err) {
    console.warn("⚠️  Firebase Admin NOT initialized:", err.message);
    console.warn("    Phone verification will not work until env vars are set.");
  }
}

module.exports = admin;