# Degrading Editions - Anonymous Media Hosting

An anonymous media hosting website where uploaded files have limited editions (10 total). Each download degrades the quality of the file until it becomes illegible.

## Features

- **Anonymous Upload**: No authentication required - upload media completely anonymously
- **Limited Editions**: Each file has exactly 10 editions
- **Quality Degradation**: Each download reduces image quality by 10%, progressively degrading the file
- **Free Downloads**: All downloads are free, but limited by the edition system
- **Automatic Compression**: Images are automatically compressed using Sharp library

## How It Works

1. **Upload**: Users upload media files (images/videos) anonymously
2. **Get Link**: Receive a unique file ID and shareable download link
3. **Download**: Each download serves the current edition and automatically degrades quality
4. **Degradation**: Quality drops from 100% to 10% over 10 downloads
5. **Exhaustion**: After 10 editions, the file becomes essentially illegible

## Technology Stack

- **Backend**: Node.js + Express
- **File Processing**: Sharp (for image compression)
- **Storage**: Local filesystem
- **Frontend**: Vanilla HTML/CSS/JavaScript

## Installation

```bash
# Clone the repository
git clone https://github.com/madmaxdod/site.git
cd site

# Install dependencies
npm install

# Start the server
npm start
```

The server will run on `http://localhost:3000` by default.

## Usage

### Upload a File

1. Visit the homepage
2. Click "Choose File" and select an image or video
3. Click "Upload Anonymously"
4. Copy the generated link to share

### Download a File

1. Enter the File ID in the download section
2. Click "Get File Info" to see remaining editions
3. Click download to get the current edition

## API Endpoints

### POST /upload
Upload a new file anonymously
- **Body**: multipart/form-data with 'file' field
- **Response**: `{ fileId, downloadUrl, edition, maxEditions }`

### GET /download/:fileId
Download the current edition of a file
- **Response**: File download (quality degrades with each request)

### GET /info/:fileId
Get information about a file
- **Response**: `{ id, originalName, currentEdition, totalEditions, remainingEditions, uploadedAt }`

## Deployment

### Environment Variables

- `PORT`: Server port (default: 3000)

### Deployment Platforms

#### Heroku
```bash
heroku create
git push heroku main
```

#### Vercel/Netlify
Not recommended due to serverless architecture limitations with file storage.

#### VPS/Cloud Server
```bash
# Install Node.js
# Clone repository
npm install
npm start

# Use PM2 for production
npm install -g pm2
pm2 start server.js --name "degrading-editions"
```

## Security & Privacy

- **Anonymous**: No user tracking or authentication
- **No Logs**: Minimal logging for privacy
- **Temporary Storage**: Files stored temporarily
- **No Analytics**: No third-party tracking

## Limitations

- Maximum file size: 50MB
- Only image files support quality degradation
- Local storage only (not suitable for distributed systems without modification)
- No file deletion API (files persist until manually removed)

## Future Enhancements

- Video compression support
- Cloud storage integration (S3, etc.)
- Custom edition counts
- File expiration
- Admin panel for file management

## License

ISC

## Disclaimer

This software is provided for educational purposes. Users are responsible for ensuring their use complies with local laws and regulations. The authors are not responsible for any misuse of this software.