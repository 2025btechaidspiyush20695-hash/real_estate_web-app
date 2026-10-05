const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'editor'], default: 'admin' },
    /**
     * Session-revocation counter. Every JWT carries the tokenVersion it was
     * issued with. Whenever credentials change (password reset, ownership
     * transfer, password change) this counter is incremented, instantly
     * invalidating EVERY previously issued token.
     */
    tokenVersion: { type: Number, default: 0 },
    /**
     * 2FA (TOTP — Google Authenticator etc.)
     * Secret is stored encrypted (AES-256-GCM, key derived from JWT_SECRET)
     */
    twoFactorSecret: { type: String, select: false, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    /** Last 3 password hashes — blocks password reuse */
    passwordHistory: { type: [String], select: false, default: [] },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    const hist = Array.isArray(this.passwordHistory) ? this.passwordHistory : [];
    hist.push(this.password);
    this.passwordHistory = hist.slice(-3); // keep last 3
  }
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

/** True if `plain` matches ANY of the last 3 historical hashes (excluding the current one). */
userSchema.methods.isPasswordReused = async function (plain) {
  const hist = Array.isArray(this.passwordHistory) ? this.passwordHistory : [];
  const current = this.password;
  for (const h of hist) {
    if (h === current) continue; // skip current — that's not "reuse"
    if (await bcrypt.compare(plain, h)) return true;
  }
  return false;
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    twoFactorEnabled: !!this.twoFactorEnabled,
    lastLoginAt: this.lastLoginAt,
  };
};

module.exports = mongoose.model('User', userSchema);
