import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { Request } from 'express';

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const documentsDir = path.join(uploadDir, 'documents');

fs.ensureDirSync(documentsDir);

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.ensureDir(documentsDir);
      cb(null, documentsDir);
    } catch (error) {
      cb(error as Error, documentsDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types for documents
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WebP, and PDF files are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
    files: 1, // Only one file per request
  },
});

// Middleware for single document upload
export const uploadDocument = upload.single('document');

// Middleware for handling multer errors
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed.',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Use "document" as field name.',
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

export default { uploadDocument, handleUploadError };