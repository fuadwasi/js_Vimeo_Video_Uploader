# Quick Start Guide

Get up and running with Vimeo Video Uploader in 5 minutes!

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Vimeo account
- Vimeo API access token

## Step 1: Get Your Vimeo Access Token (2 minutes)

1. Visit [Vimeo Developer Apps](https://developer.vimeo.com/apps)
2. Log in to your Vimeo account
3. Click **"Create an app"** (or select existing app)
4. Fill in the required information:
   - App Name: "My Video Uploader"
   - App Description: "Personal video uploader"
   - Accept terms and conditions
5. Go to the **"Authentication"** tab
6. Under **"Generate an Access Token"**:
   - Check these scopes:
     - ☑️ `public` - View public videos
     - ☑️ `private` - View private videos
     - ☑️ `upload` - Upload videos
     - ☑️ `video_files` - Manage video files
     - ☑️ `edit` - Edit videos
   - Click **"Generate"**
7. Copy the generated access token (save it somewhere safe!)

## Step 2: Set Up the Application (1 minute)

### Option A: Run Locally
```bash
# Clone the repository
git clone https://github.com/fuadwasi/js_Vimeo_Video_Uploader.git
cd js_Vimeo_Video_Uploader

# Start a local server (choose one):

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (requires http-server: npm install -g http-server)
http-server -p 8000

# PHP
php -S localhost:8000
```

Then open: http://localhost:8000

### Option B: Deploy to Netlify (Fastest!)
1. Fork the repository on GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click **"Add new site" → "Import an existing project"**
4. Select **GitHub** and choose your forked repo
5. Click **"Deploy"**
6. Your app is live! 🎉

### Option C: Deploy to Vercel
1. Fork the repository on GitHub
2. Go to [Vercel](https://vercel.com/)
3. Click **"New Project"**
4. Import your forked repository
5. Click **"Deploy"**
6. Your app is live! 🚀

## Step 3: Configure the Application (30 seconds)

1. Open the application in your browser
2. In the **"API Configuration"** section:
   - Paste your Vimeo access token
   - Click **"Save Configuration"**
3. You'll see a success message: "Configuration saved successfully!"

## Step 4: Upload Your First Video (1 minute)

### Method 1: Drag & Drop
1. Drag a video file from your computer
2. Drop it in the **"Drag & Drop videos here"** area
3. Watch the progress bar fill up!

### Method 2: File Picker
1. Click **"Browse Files"**
2. Select one or more video files
3. Click **"Open"**
4. Watch the upload progress!

## Step 5: Manage Your Videos (30 seconds)

Once uploaded, you'll see your video in the table below:

- **Search**: Use the search box to find videos
- **Sort**: Click column headers to sort
- **Copy URLs**: Click "Copy" buttons to get video or embed URLs
- **Edit**: Click "Edit" to change the video name
- **Delete**: Click "Delete" to remove from local database

## Tips & Tricks

### 💡 Copy Embed Code Quickly
Click the "Copy" button next to "Embed URL" to get:
```html
https://player.vimeo.com/video/YOUR_VIDEO_ID
```

Use it in an iframe:
```html
<iframe src="https://player.vimeo.com/video/YOUR_VIDEO_ID" width="640" height="360" frameborder="0" allowfullscreen></iframe>
```

### 💡 Upload Multiple Videos
Select multiple files at once, or drag & drop multiple files together!

### 💡 Export Your Video Library
Open browser console (F12) and type:
```javascript
// Export to JSON
App.exportToJSON();

// Export to CSV
App.exportToCSV();
```

### 💡 Quick Search
Start typing in the search box to instantly filter your videos!

### 💡 Mobile Upload
The app works great on mobile devices - upload videos from your phone!

## Troubleshooting

### ❌ "Please configure your Vimeo access token first"
→ Make sure you've pasted and saved your token in the API Configuration section

### ❌ "Invalid access token"
→ Your token may be wrong or expired. Generate a new one from Vimeo Developer Portal

### ❌ Upload fails immediately
→ Check if your video format is supported (MP4, MOV, AVI, etc.)

### ❌ Upload stuck at 0%
→ Check your internet connection and try again

### ❌ Videos not showing in table
→ Open browser console (F12) and check for errors

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [FEATURES.md](FEATURES.md) for complete feature list
- Visit [Vimeo API Docs](https://developer.vimeo.com/api/upload/videos) to learn more

## Support

Found an issue? [Open an issue on GitHub](https://github.com/fuadwasi/js_Vimeo_Video_Uploader/issues)

---

**Happy Uploading! 🎥**
