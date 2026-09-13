const Category = require('../models/Category');

// GET /api/categories
const getCategories = async (req, res) => {
  const categories = await Category.find().sort('order');
  res.json(categories);
};

// POST /api/categories  (owner only)
const createCategory = async (req, res) => {
  const { name, defaultUnit, order } = req.body;
  if (!name || !defaultUnit) {
    return res.status(400).json({ message: 'الاسم والوحدة الافتراضية مطلوبان' });
  }
  const category = await Category.create({ name, defaultUnit, order: order || 0 });
  res.status(201).json(category);
};

module.exports = { getCategories, createCategory };
