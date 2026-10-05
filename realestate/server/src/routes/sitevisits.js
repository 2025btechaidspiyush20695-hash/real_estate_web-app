const router = require('express').Router();
const SiteVisit = require('../models/SiteVisit');
const { logAudit } = require('../middleware/audit');

// GET /api/sitevisits?status=&q=&from=&to=
router.get('/', async (req, res) => {
  try {
    const { status, q, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$or = [{ leadName: { $regex: q, $options: 'i' } }, { propertyTitle: { $regex: q, $options: 'i' } }, { phone: { $regex: q, $options: 'i' } }];
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to + 'T23:59:59');
    }
    const items = await SiteVisit.find(filter).sort({ date: 1, time: 1 }).limit(200);
    res.json({ items });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/sitevisits
router.post('/', async (req, res) => {
  try {
    const visit = await SiteVisit.create(req.body);
    await logAudit(req.user, 'sitevisit.scheduled', { leadName: visit.leadName, propertyTitle: visit.propertyTitle }, req);
    res.status(201).json({ visit });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PATCH /api/sitevisits/:id  (status + feedback)
router.patch('/:id', async (req, res) => {
  try {
    const visit = await SiteVisit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!visit) return res.status(404).json({ message: 'Site visit not found' });
    await logAudit(req.user, 'sitevisit.updated', { leadName: visit.leadName, status: visit.status }, req);
    res.json({ visit });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/sitevisits/:id
router.delete('/:id', async (req, res) => {
  await SiteVisit.findByIdAndDelete(req.params.id);
  res.json({ message: 'Site visit deleted' });
});

module.exports = router;
