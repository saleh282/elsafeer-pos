const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { createRateLimiter } = require('../middleware/rateLimit');

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'محاولات تسجيل الدخول كثيرة، حاول بعد 15 دقيقة',
});

router.post('/login', loginLimiter, asyncHandler(login));
router.get('/me', protect, asyncHandler(getMe));

module.exports = router;
