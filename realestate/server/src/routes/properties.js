const router = require('express').Router();
const Property = require('../models/Property');
const auth = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

async function uniqueSlug(base, ignoreId) {
  let slug = slugify(base) || `property-${Date.now()}`;
  let n = 2;
  while (await Property.findOne({ slug, _id: { $ne: ignoreId } })) slug = `${slugify(base)}-${n++}`;
  return slug;
}

// ---- PUBLIC ----

// GET /api/properties  (filters: q, type, status, city, minPrice, maxPrice, featured, sort, page, limit)
router.get('/', async (req, res) => {
  try {
    const {
      q, type, status, city, minPrice, maxPrice, featured, sort = 'newest', page = 1, limit = 12,
    } = req.query;

    const filter = { active: true };
    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { city: { $regex: q, $options: 'i' } },
      { locality: { $regex: q, $options: 'i' } },
    ];
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (city) filter.city = city;
    if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
    if (featured === 'true') filter.featured = true;

    const sortMap = {
      newest: { createdAt: -1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      popular: { views: -1 },
    };

    const total = await Property.countDocuments(filter);
    const items = await Property.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/properties/meta  (available cities/types for filters)
router.get('/meta', async (req, res) => {
  try {
    const [cities, types] = await Promise.all([
      Property.distinct('city', { active: true }),
      Property.distinct('type', { active: true }),
    ]);
    res.json({ cities: cities.sort(), types: types.sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/properties/id/:id  (admin only — fetch by _id)
router.get('/id/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json({ property });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/properties/:slug
router.get('/:slug', async (req, res) => {
  try {
    const property = await Property.findOneAndUpdate(
      { slug: req.params.slug, active: true },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const similar = await Property.find({
      active: true,
      _id: { $ne: property._id },
      $or: [{ type: property.type }, { city: property.city }],
    })
      .limit(4)
      .select('title slug price area bedrooms bathrooms city locality images featured status type');

    res.json({ property, similar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- ADMIN (JWT protected) ----

// POST /api/properties
router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (Array.isArray(data.images) && data.images.length > 20) {
      return res.status(400).json({ message: 'Maximum 20 photos per property' });
    }
    data.slug = await uniqueSlug(data.title || 'property');
    const property = await Property.create(data);
    await logAudit(req.user, 'property.created', { title: property.title, id: property._id }, req);
    res.status(201).json({ property });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/properties/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const data = { ...req.body };
    if (Array.isArray(data.images) && data.images.length > 20) {
      return res.status(400).json({ message: 'Maximum 20 photos per property' });
    }
    delete data._id;
    delete data.views;
    if (data.title && data.title !== property.title) data.slug = await uniqueSlug(data.title, property._id);

    Object.assign(property, data);
    await property.save();
    await logAudit(req.user, 'property.updated', { title: property.title, id: property._id }, req);
    res.json({ property });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/properties/:id/feature
router.patch('/:id/feature', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    property.featured = !property.featured;
    await property.save();
    await logAudit(req.user, 'property.featured', { title: property.title, featured: property.featured }, req);
    res.json({ property });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/properties/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    await logAudit(req.user, 'property.deleted', { title: property.title, id: property._id }, req);
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
