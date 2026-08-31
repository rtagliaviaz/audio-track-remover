import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { listAudioTracks, removeAudioTracks } from './ffmpegService';
import { ProcessRequest, UploadResponse } from './types';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
ensureDir('uploads');
ensureDir('outputs');

router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const originalName = file.originalname;
    const extension = originalName.split('.').pop() || 'mkv';

    const tracks = await listAudioTracks(file.path);

    const response: UploadResponse = {
      file: {
        path: file.path,
        name: originalName,
        size: file.size,
        extension,
      },
      tracks,
    };

    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

router.post('/process', async (req, res) => {
  try {
    const { filePath, tracksToKeep, outputFormat }: ProcessRequest = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (!tracksToKeep || tracksToKeep.length === 0) {
      return res.status(400).json({ error: 'At least one audio track must be selected' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Temporary file not found' });
    }

    const outputPath = path.join(
      'outputs',
      `processed_${Date.now()}.${outputFormat}`
    );

    await removeAudioTracks(filePath, tracksToKeep, outputPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted temporary file: ${filePath}`);
    }

    res.json({
      success: true,
      outputPath,
      message: 'Video processed successfully',
    });
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: 'Failed to process video' });
  }
});

router.get('/download/:filename', (req, res) => {
  const filePath = path.join('outputs', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;