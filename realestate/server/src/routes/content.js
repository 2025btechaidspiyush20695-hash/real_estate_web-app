const router = require('express').Router();
const Content = require('../models/Content');
const auth = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/content (admin: all blocks)
router.get('/', auth, async (req, res) => {
  const items = await Content.find().sort({ key: 1 });
  res.json({ items });
});

// GET /api/content/:key
router.get('/:key', async (req, res) => {
  const doc = await Content.findOne({ key: req.params.key });
  if (!doc) return res.status(404).json({ message: 'Content block not found' });
  res.json({ key: doc.key, data: doc.data, updatedAt: doc.updatedAt });
});

// PUT /api/content/:key
router.put('/:key', auth, async (req, res) => {
  const { data } = req.body || {};
  if (data === undefined || data === null) return res.status(400).json({ message: 'data is required' });

  const doc = await Content.findOneAndUpdate(
    { key: req.params.key },
    { data, $setOnInsert: { label: req.params.key } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await logAudit(req.user, 'content.updated', { key: doc.key }, req);
  res.json({ key: doc.key, data: doc.data, updatedAt: doc.updatedAt });
});

module.exports = router;
