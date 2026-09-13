const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', protect, asyncHandler(getProducts));
router.post('/', protect, authorize('owner'), asyncHandler(createProduct));
router.put('/:id', protect, authorize('owner'), asyncHandler(updateProduct));
router.delete('/:id', protect, authorize('owner'), asyncHandler(deleteProduct));

module.exports = router;
