const express = require('express');
const router = express.Router();
const { getBranches } = require('../controllers/branchController');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', protect, asyncHandler(getBranches));

module.exports = router;
