const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

// POST /api/upload  (single image, admin only)
router.post('/', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image received' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// DELETE /api/upload/:filename  (admin only; seed files are protected)
router.delete('/:filename', auth, (req, res) => {
  const filename = path.basename(req.params.filename);
  if (filename.startsWith('seed-') || filename.startsWith('seed/')) {
    return res.status(400).json({ message: 'This file is part of the starter content and cannot be deleted' });
  }
  const full = path.join(uploadDir, filename);
  if (!full.startsWith(uploadDir)) return res.status(400).json({ message: 'Invalid path' });
  if (!fs.existsSync(full)) return res.status(404).json({ message: 'File not found' });
  fs.unlinkSync(full);
  res.json({ message: 'File deleted' });
});

module.exports = router;
