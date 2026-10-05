const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT auth middleware.
 * - Verifies signature + expiry.
 * - Verifies the token's `ver` matches the user's CURRENT tokenVersion.
 *   After an ownership transfer / password reset / password change the
 *   version is bumped, so every old token (all devices) is rejected here
 *   with 401 and the client is forced back to the login screen.
 */
module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authorised' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Account not found' });

    // Session-revocation check
    if (payload.ver !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session revoked — please login again' });
    }

    req.user = user.toSafeJSON();
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired, please login again' });
    }
    return res.status(401).json({ message: 'Invalid session, please login again' });
  }
};
