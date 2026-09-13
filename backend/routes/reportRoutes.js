const express = require('express');
const router = express.Router();
const { getSalesReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/sales', protect, asyncHandler(getSalesReport));

module.exports = router;
