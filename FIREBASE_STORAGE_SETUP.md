# Firebase Storage Setup for Excel File

## Step 1: Enable Firebase Storage

1. In Firebase Console, you should see a **yellow "Get started" button** on the Storage page
2. Click **"Get started"**
3. It will ask you to set up Storage rules - use these:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read files
    match /Prices/{fileName} {
      allow read: if true; // Allow public read for Excel file
      allow write: if request.auth != null; // Only authenticated users can write
    }
  }
}
```

4. Click **"Next"** and choose a location (use `us-central` or nearest to you)
5. Click **"Done"**

## Step 2: Create Folder and Upload Excel File

After Storage is enabled, you'll see the Storage interface with files/folders:

1. Click **"Files"** tab (top of the Storage page)
2. Click the **"+"** button or **"Upload file"** button
3. Create a folder called `Prices`:
   - Click **"Create folder"**
   - Name it: `Prices`
   - Click **"Create"**
4. Open the `Prices` folder
5. Click **"Upload file"** or drag your Excel file
6. Select: `data/Prices/Forecast All_FORECASTED_CORRECTED.xlsx`
7. Wait for upload to complete

## Step 3: Verify

After upload, you should see:
- Folder: `Prices/`
- File: `Forecast All_FORECASTED_CORRECTED.xlsx`

The app will automatically download and use this file!

## Alternative: Quick Upload via Firebase CLI

If you prefer command line:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Upload file
firebase storage:upload "data/Prices/Forecast All_FORECASTED_CORRECTED.xlsx" "Prices/"
```

## Troubleshooting

**If "Get started" button doesn't appear:**
- Make sure you're in the correct Firebase project: `database-agriassist`
- Check if Storage is already enabled (look for "Files" tab)
- Try refreshing the page

**If upload fails:**
- Check file size (Firebase free tier has limits)
- Make sure you're logged in with proper permissions
- Check browser console for errors











