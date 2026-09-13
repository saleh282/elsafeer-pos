const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleById } = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.post('/', protect, authorize('cashier'), asyncHandler(createSale));
router.get('/', protect, asyncHandler(getSales));
router.get('/:id', protect, asyncHandler(getSaleById));

module.exports = router;
