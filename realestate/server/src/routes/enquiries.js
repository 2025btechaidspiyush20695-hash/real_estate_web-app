const router = require('express').Router();
const Enquiry = require('../models/Enquiry');
const auth = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { notifyEnquiry } = require('../services/notifier');

// POST /api/enquiries (public form)
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, message, property, propertyTitle, requirementType, requirementCity, budget, bedrooms, timeline } = req.body || {};
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });
    const enquiry = await Enquiry.create({ name, phone, email, message, property, propertyTitle, requirementType, requirementCity, budget, bedrooms, timeline });
    // 🔔 Real-time notification to the admin panel (never blocks the response)
    notifyEnquiry(enquiry);
    res.status(201).json({ enquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/enquiries (admin)
router.get('/', auth, async (req, res) => {
  const { status, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { phone: { $regex: q, $options: 'i' } },
    { propertyTitle: { $regex: q, $options: 'i' } },
  ];
  const items = await Enquiry.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
});

// PATCH /api/enquiries/:id (status + follow-up + notes)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, nextFollowUp, lastContactedAt, notes, source, budgetPref, preferredBhk } = req.body || {};
    const allowed = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed'];
    if (status && !allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const update = {};
    if (status) update.status = status;
    if (nextFollowUp) update.nextFollowUp = new Date(nextFollowUp);
    if (lastContactedAt) update.lastContactedAt = new Date(lastContactedAt);
    if (notes !== undefined) update.notes = notes;
    if (source) update.source = source;
    if (budgetPref !== undefined) update.budgetPref = budgetPref;
    if (preferredBhk !== undefined) update.preferredBhk = preferredBhk;
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    await logAudit(req.user, 'enquiry.status', { id: enquiry._id, status: enquiry.status }, req);
    res.json({ enquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/enquiries/:id
router.delete('/:id', auth, async (req, res) => {
  await Enquiry.findByIdAndDelete(req.params.id);
  await logAudit(req.user, 'enquiry.deleted', { id: req.params.id }, req);
  res.json({ message: 'Enquiry deleted' });
});

module.exports = router;
