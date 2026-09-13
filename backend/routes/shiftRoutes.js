const express = require('express');
const router = express.Router();
const {
  getCurrentShift,
  openShift,
  closeShift,
  getShiftSummaryPreview,
} = require('../controllers/shiftController');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/current', protect, asyncHandler(getCurrentShift));
router.post('/open', protect, authorize('cashier'), asyncHandler(openShift));
router.post('/close', protect, authorize('cashier'), asyncHandler(closeShift));
router.get('/:id/summary', protect, asyncHandler(getShiftSummaryPreview));

module.exports = router;
