import { Router, Response } from 'express';
import { BriefingPDF } from '../entity/BriefingPDF';
import { getDataSource } from '../db';
import { broadcastUpdate } from '../ws';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const storageDir = getPdfStorageDir();
    cb(null, storageDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${safeOriginalName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Ensure PDF storage directory exists
const getPdfStorageDir = (): string => {
  const storageDir = path.join(process.cwd(), 'pdfs');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  return storageDir;
};

// ==================== LIST BRIEFINGS ====================

router.get('/', async (_req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(BriefingPDF);
    const briefings = await repo.find({ 
      order: { createdAt: 'DESC' } 
    });
    res.json(briefings);
  } catch (error) {
    console.error('Error fetching briefings:', error);
    res.status(500).json({ error: 'Failed to fetch briefings' });
  }
});

// ==================== GET SINGLE BRIEFING ====================

router.get('/:id', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(BriefingPDF);
    const briefing = await repo.findOneBy({ id: req.params.id });
    if (!briefing) {
      res.status(404).json({ error: 'Briefing not found' });
      return;
    }
    res.json(briefing);
  } catch (error) {
    console.error('Error fetching briefing:', error);
    res.status(500).json({ error: 'Failed to fetch briefing' });
  }
});

// ==================== GET PDF FILE ====================

router.get('/:id/file', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(BriefingPDF);
    const briefing = await repo.findOneBy({ id: req.params.id });
    if (!briefing) {
      res.status(404).json({ error: 'Briefing not found' });
      return;
    }

    const filePath = path.join(getPdfStorageDir(), briefing.filePath);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'PDF file not found' });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${briefing.originalFileName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving PDF file:', error);
    res.status(500).json({ error: 'Failed to serve PDF file' });
  }
});

// ==================== UPLOAD PDF ====================

// Use multer middleware to handle file upload
const uploadPdf = upload.single('pdf');

router.post('/upload', (req, res: Response) => {
  uploadPdf(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      res.status(400).json({ error: err.message || 'File upload failed' });
      return;
    }

    try {
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      const { title, date, unit, uploadedBy } = req.body;

      // Validate required fields
      if (!title || !date || !unit || !uploadedBy) {
        res.status(400).json({ error: 'Missing required fields: title, date, unit, uploadedBy' });
        return;
      }

      // Save metadata to database
      const ds = getDataSource();
      if (!ds.isInitialized) await ds.initialize();
      const repo = ds.getRepository(BriefingPDF);

      const briefing = repo.create({
        title,
        date,
        unit,
        uploadedBy,
        filePath: req.file.filename,
        originalFileName: req.file.originalname,
      });

      await repo.save(briefing);

      // Broadcast update to all connected clients
      try {
        const allBriefings = await repo.find({ order: { createdAt: 'DESC' } });
        broadcastUpdate({ type: 'briefings', data: allBriefings });
      } catch (e) {
        console.error('Broadcast error:', e);
      }

      res.status(201).json(briefing);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({ error: 'Failed to upload PDF' });
    }
  });
});

// ==================== DELETE BRIEFING ====================

router.delete('/:id', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(BriefingPDF);
    const briefing = await repo.findOneBy({ id: req.params.id });
    
    if (!briefing) {
      res.status(404).json({ error: 'Briefing not found' });
      return;
    }

    // Delete the PDF file
    const filePath = path.join(getPdfStorageDir(), briefing.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await repo.delete(req.params.id);

    // Broadcast update
    try {
      const allBriefings = await repo.find({ order: { createdAt: 'DESC' } });
      broadcastUpdate({ type: 'briefings', data: allBriefings });
    } catch (e) {
      console.error('Broadcast error:', e);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting briefing:', error);
    res.status(500).json({ error: 'Failed to delete briefing' });
  }
});

export default router;
