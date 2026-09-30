import { Router } from 'express';
import path from 'node:path';
import { config } from '../config.js';

const router = Router();

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

router.get('/:file', (req, res) => {
  const name = path.basename(String(req.params.file || ''));
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
    return res.status(400).json({ error: 'Invalid file name.' });
  }
  const full = path.join(config.uploads.dir, name);
  res.sendFile(full, (err) => {
    if (err) return res.status(404).json({ error: 'File not found.' });
    return undefined;
  });
});

export { MIME };
export default router;