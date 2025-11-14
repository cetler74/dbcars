import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/vehicles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Upload single image (admin only)
router.post(
  '/image',
  authenticate,
  requireAdmin,
  upload.single('image'),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Return the URL path that can be used to access the image
      const imageUrl = `/uploads/vehicles/${req.file.filename}`;
      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
  }
);

// Upload multiple images (admin only)
router.post(
  '/images',
  authenticate,
  requireAdmin,
  upload.array('images', 10), // Max 10 images
  (req: Request, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map((file) => `/uploads/vehicles/${file.filename}`);

      res.json({ urls: imageUrls, count: files.length });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      res.status(500).json({ error: error.message || 'Failed to upload files' });
    }
  }
);

export default router;

