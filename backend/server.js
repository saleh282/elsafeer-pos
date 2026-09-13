const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { createRateLimiter } = require('./middleware/rateLimit');

dotenv.config();
// Keep sales-day calculations consistent on the hosting server and local PCs.
process.env.TZ = process.env.APP_TIMEZONE || 'Africa/Cairo';
connectDB();

const app = express();

const allowedFrontendOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const isLocalDevelopmentOrigin = (origin) =>
  process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedFrontendOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('المصدر غير مسموح له بالاتصال بالخادم'));
  },
  credentials: true,
}));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '100kb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: 'تم تجاوز الحد المسموح من الطلبات، حاول لاحقًا',
});
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// On Hostinger, one Node application serves both the React website and API.
// This avoids a second subdomain and keeps browser/API communication same-origin.
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Al Safir POS backend running on port ${PORT}`));
