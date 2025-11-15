rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // This is a stricter version of the rules that uses request.auth.
    // We are NOT using it right now because the app's Firebase Auth SDK
    // is not initialized (auth is undefined and REST fallback is used),
    // so request.auth is always null and causes 'Missing or insufficient permissions'.
    //
    // Once proper Firebase Auth is working in the app, you can copy
    // these rules into firestore.rules and deploy them.

    function isAdmin() {
      return request.auth != null &&
        request.auth.token.email != null &&
        request.auth.token.email == 'agriassistme@gmail.com';
    }

    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}


