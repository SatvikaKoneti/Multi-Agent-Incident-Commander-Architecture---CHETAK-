import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { config } from '../config.js';
import { AppError } from '../utils/index.js';

fs.mkdirSync(config.uploads.dir, { recursive: true });

const ALLOWED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_VIDEO = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploads.dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
  },
});

function fileFilter(kind) {
  return (req, file, cb) => {
    const allowed = kind === 'video' ? ALLOWED_VIDEO : ALLOWED_IMAGE;
    if (!allowed.has(file.mimetype)) {
      return cb(new AppError(400, `Unsupported ${kind} type: ${file.mimetype}`));
    }
    if (kind === 'video' && file.size / (1024 * 1024) > config.uploads.maxVideoMb) {
      return cb(new AppError(400, `Video exceeds ${config.uploads.maxVideoMb}MB limit`));
    }
    cb(null, true);
  };
}

export const uploadImage = multer({
  storage,
  fileFilter: fileFilter('image'),
  limits: { fileSize: config.uploads.maxImageMb * 1024 * 1024 },
});

export const uploadVideo = multer({
  storage,
  fileFilter: fileFilter('video'),
  limits: { fileSize: config.uploads.maxVideoMb * 1024 * 1024 },
});

export function toPublicPath(file) {
  if (!file) return null;
  return `/uploads/${file.filename}`;
}