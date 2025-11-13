const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Storage configuration
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'data.json');
const MAX_EDITIONS = 10;

// Ensure uploads directory exists
async function initializeStorage() {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch (err) {
        console.error('Error creating uploads directory:', err);
    }
}

// Load/Save data
async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { files: {} };
    }
}

async function saveData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Configure multer for file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: async (req, file, cb) => {
            cb(null, UPLOADS_DIR);
        },
        filename: (req, file, cb) => {
            const uniqueId = crypto.randomBytes(16).toString('hex');
            const ext = path.extname(file.originalname);
            cb(null, `${uniqueId}${ext}`);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileId = crypto.randomBytes(8).toString('hex');
        const originalPath = req.file.path;
        const ext = path.extname(req.file.filename);
        
        // Store file metadata
        const data = await loadData();
        data.files[fileId] = {
            id: fileId,
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            currentEdition: 1,
            totalEditions: MAX_EDITIONS,
            uploadedAt: new Date().toISOString()
        };
        await saveData(data);

        res.json({
            fileId: fileId,
            downloadUrl: `/download/${fileId}`,
            edition: 1,
            maxEditions: MAX_EDITIONS
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Download endpoint with quality degradation
app.get('/download/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const data = await loadData();
        const fileInfo = data.files[fileId];

        if (!fileInfo) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (fileInfo.currentEdition > MAX_EDITIONS) {
            return res.status(410).json({ error: 'All editions exhausted' });
        }

        const filePath = path.join(UPLOADS_DIR, fileInfo.filename);
        
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        // Check if it's an image that can be compressed
        const isImage = fileInfo.mimetype.startsWith('image/');
        
        if (isImage) {
            // Degrade quality based on edition
            const quality = Math.max(10, 100 - (fileInfo.currentEdition - 1) * 10);
            const degradedFilename = `${path.parse(fileInfo.filename).name}_edition${fileInfo.currentEdition}.jpg`;
            const degradedPath = path.join(UPLOADS_DIR, degradedFilename);

            try {
                // Create degraded version - convert to JPEG with reduced quality
                await sharp(filePath)
                    .jpeg({ quality: Math.round(quality), force: true })
                    .toFile(degradedPath);

                // Update edition counter
                fileInfo.currentEdition++;
                await saveData(data);

                // Send degraded file
                res.download(degradedPath, `edition${fileInfo.currentEdition - 1}_${fileInfo.originalName}`, async (err) => {
                    // Clean up degraded file after sending
                    try {
                        await fs.unlink(degradedPath);
                    } catch (cleanupErr) {
                        console.error('Cleanup error:', cleanupErr);
                    }
                });
            } catch (sharpErr) {
                // If sharp fails, just serve the original file
                console.error('Sharp processing error:', sharpErr);
                fileInfo.currentEdition++;
                await saveData(data);
                res.download(filePath, `edition${fileInfo.currentEdition - 1}_${fileInfo.originalName}`);
            }
        } else {
            // For non-image files, just increment counter
            fileInfo.currentEdition++;
            await saveData(data);
            
            res.download(filePath, `edition${fileInfo.currentEdition - 1}_${fileInfo.originalName}`);
        }
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Get file info endpoint
app.get('/info/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const data = await loadData();
        const fileInfo = data.files[fileId];

        if (!fileInfo) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({
            id: fileInfo.id,
            originalName: fileInfo.originalName,
            currentEdition: fileInfo.currentEdition,
            totalEditions: fileInfo.totalEditions,
            remainingEditions: Math.max(0, fileInfo.totalEditions - fileInfo.currentEdition + 1),
            uploadedAt: fileInfo.uploadedAt
        });
    } catch (err) {
        console.error('Info error:', err);
        res.status(500).json({ error: 'Failed to get file info' });
    }
});

// Initialize and start server
initializeStorage().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
