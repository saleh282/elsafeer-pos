const Branch = require('../models/Branch');

// GET /api/branches
const getBranches = async (req, res) => {
  const branches = await Branch.find({ isActive: true }).sort('name');
  res.json(branches);
};

module.exports = { getBranches };
