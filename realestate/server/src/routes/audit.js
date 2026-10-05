const router = require('express').Router();
const AuditLog = require('../models/AuditLog');

/**
 * Activity Log (admin only)
 * GET /api/audit?action=login.success&q=...&limit=100
 */
router.get('/', async (req, res) => {
  try {
    const { action, q, limit = 100 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (q) {
      filter.$or = [
        { ip: { $regex: q, $options: 'i' } },
        { 'details.email': { $regex: q, $options: 'i' } },
        { userAgent: { $regex: q, $options: 'i' } },
      ];
    }
    const items = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 100, 300));
    const actions = await AuditLog.distinct('action');
    res.json({ items, actions: actions.sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
