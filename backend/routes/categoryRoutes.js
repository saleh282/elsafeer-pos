const express = require('express');
const router = express.Router();
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', protect, asyncHandler(getCategories));
router.post('/', protect, authorize('owner'), asyncHandler(createCategory));

module.exports = router;
