// Lightweight in-memory limiter. Suitable for one Node process; use a shared
// store such as Redis if the API is later deployed across multiple instances.
const createRateLimiter = ({ windowMs, max, message }) => {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const record = requests.get(key);

    if (!record || record.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      res.set('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
      return res.status(429).json({ message });
    }
    return next();
  };
};

module.exports = { createRateLimiter };
