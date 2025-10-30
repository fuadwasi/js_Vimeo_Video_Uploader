# Vimeo Video Uploader

A responsive web application for uploading videos to Vimeo with a clean, modern interface. Built with vanilla JavaScript, jQuery, and the Vimeo API.

## 🎯 Features

### Core Functionality
- **Drag & Drop Upload**: Intuitive drag-and-drop interface with file picker fallback
- **Multiple File Support**: Upload multiple videos simultaneously
- **Real-time Progress**: Visual progress bars for each upload with percentage indicators
- **Local Database**: IndexedDB integration for persistent storage across sessions
- **Video Management**: View, edit, and delete video entries from local database

### User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **DataTables Integration**: Sortable, filterable, and paginated video listing
- **Toast Notifications**: User-friendly notifications for all actions
- **Copy to Clipboard**: One-click copying of Vimeo URLs and embed codes
- **Modern UI**: Clean gradient design with smooth animations

### Vimeo Integration
- **OAuth2 Authentication**: Secure API token configuration
- **TUS Upload Protocol**: Reliable chunked uploads with resume capability
- **Auto-generated Embed URLs**: Automatically creates embed URLs from video IDs
- **Video Metadata Storage**: Stores video name, size, upload time, and URLs

## 📋 Requirements

- Modern web browser with JavaScript enabled
- Vimeo account with API access
- Vimeo Access Token (see setup instructions below)

## 🚀 Getting Started

### 1. Get Vimeo Access Token

1. Go to [Vimeo Developer Apps](https://developer.vimeo.com/apps)
2. Create a new app or select an existing one
3. Navigate to "Authentication" tab
4. Generate a new Access Token with the following scopes:
   - `upload` - Upload videos
   - `video_files` - Manage video files
   - `edit` - Edit video metadata
5. Copy the generated access token

### 2. Setup Application

#### Option A: Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/fuadwasi/js_Vimeo_Video_Uploader.git
   cd js_Vimeo_Video_Uploader
   ```

2. Open `index.html` in a web browser or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server
   ```

3. Navigate to `http://localhost:8000` in your browser

#### Option B: Deploy to Netlify
1. Fork this repository
2. Go to [Netlify](https://www.netlify.com/)
3. Click "New site from Git"
4. Select your forked repository
5. Click "Deploy site"

#### Option C: Deploy to Vercel
1. Fork this repository
2. Go to [Vercel](https://vercel.com/)
3. Import your forked repository
4. Click "Deploy"

### 3. Configure the Application

1. Open the application in your browser
2. In the "API Configuration" section, paste your Vimeo Access Token
3. Click "Save Configuration"
4. The token will be validated and stored locally

## 📖 Usage

### Uploading Videos

1. **Drag & Drop Method**:
   - Drag video files from your computer to the upload area
   - Drop the files to start uploading

2. **File Picker Method**:
   - Click "Browse Files" button or click anywhere in the upload area
   - Select one or more video files
   - Click "Open" to start uploading

3. **Monitor Progress**:
   - View real-time upload progress for each file
   - Progress bars show upload percentage
   - Spinners indicate active uploads
   - Success/error icons appear when complete

### Managing Videos

1. **View Videos**:
   - All uploaded videos appear in the table below
   - Use the search box to filter videos
   - Click column headers to sort
   - Change page size or navigate pages

2. **Copy URLs**:
   - Click "Copy" next to Vimeo URL to copy video link
   - Click "Copy" next to Embed URL to copy embed code
   - Toast notification confirms successful copy

3. **Edit Video Information**:
   - Click "Edit" button for any video
   - Modify the video name
   - Click "Save Changes" to update

4. **Delete Videos**:
   - Click "Delete" button for any video
   - Confirm deletion in the dialog
   - Note: This only removes from local database, not from Vimeo

## 🛠️ Technical Details

### File Structure
```
js_Vimeo_Video_Uploader/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Stylesheet
├── js/
│   ├── app.js          # Main application logic
│   ├── database.js     # IndexedDB operations
│   ├── uploader.js     # Upload handling
│   └── vimeo-api.js    # Vimeo API integration
└── README.md           # This file
```

### Technologies Used

- **HTML5**: Structure and semantic markup
- **CSS3**: Styling with flexbox, grid, and animations
- **JavaScript (ES6+)**: Application logic
- **jQuery**: DOM manipulation and AJAX
- **DataTables**: Table functionality
- **Toastify.js**: Toast notifications
- **IndexedDB**: Local data storage
- **Vimeo API**: Video upload and management
- **Font Awesome**: Icons

### Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Supported Video Formats

- MP4 (H.264)
- MOV (QuickTime)
- AVI
- WMV
- FLV
- WebM
- MPEG/MPG
- 3GP
- MKV

## 🔐 Security Considerations

1. **API Token Storage**: 
   - Tokens are stored in browser's localStorage
   - Never commit tokens to version control
   - Use environment-specific tokens for production

2. **CORS**: 
   - Vimeo API handles CORS automatically
   - No server-side proxy required

3. **Data Privacy**: 
   - All video information stored locally in browser
   - No data sent to third-party servers (except Vimeo)

## 🐛 Troubleshooting

### Upload Fails
- Verify your access token is valid
- Check token has required scopes (upload, video_files, edit)
- Ensure video format is supported
- Check your internet connection
- Verify Vimeo account has available storage

### Token Validation Fails
- Generate a new token from Vimeo Developer Portal
- Ensure all required scopes are selected
- Check token hasn't expired

### Videos Not Appearing in Table
- Check browser console for errors
- Clear IndexedDB and reload page
- Try re-uploading a video

## 📝 Optional Features (Future Enhancements)

- [ ] Batch upload with resume capability
- [ ] Video thumbnail previews
- [ ] Advanced metadata editing (description, tags, privacy)
- [ ] Direct Vimeo deletion from app
- [ ] Upload queue management (pause/resume)
- [ ] Video player integration
- [ ] Analytics and statistics
- [ ] Multi-language support
- [ ] Dark mode theme

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- [Vimeo API Documentation](https://developer.vimeo.com/api/upload/videos)
- [TUS Protocol Documentation](https://tus.io/)
- [IndexedDB Documentation](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## 👨‍💻 Author

Built with ❤️ for seamless Vimeo integration

---

**Note**: This application requires a valid Vimeo API access token to function. Visit the [Vimeo Developer Portal](https://developer.vimeo.com/apps) to create your app and generate tokens.