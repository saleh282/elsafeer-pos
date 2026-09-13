const Product = require('../models/Product');

// GET /api/products?categoryId=...
const getProducts = async (req, res) => {
  const filter = { isActive: true };
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  const products = await Product.find(filter).populate('categoryId', 'name defaultUnit').sort('name');
  res.json(products);
};

// POST /api/products (owner only)
const createProduct = async (req, res) => {
  const { name, price, categoryId, unit } = req.body;
  const numericPrice = Number(price);
  if (!name?.trim() || !categoryId || !unit || !Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }
  if (!['piece', 'kg'].includes(unit)) {
    return res.status(400).json({ message: 'الوحدة يجب أن تكون قطعة أو كيلو' });
  }
  const product = await Product.create({ name: name.trim(), price: numericPrice, categoryId, unit });
  res.status(201).json(product);
};

// PUT /api/products/:id (owner only)
const updateProduct = async (req, res) => {
  const { name, price, categoryId, unit, isActive } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });

  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ message: 'اسم المنتج مطلوب' });
    product.name = String(name).trim();
  }
  if (price !== undefined) {
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: 'السعر غير صحيح' });
    }
    product.price = numericPrice;
  }
  if (categoryId !== undefined) product.categoryId = categoryId;
  if (unit !== undefined) {
    if (!['piece', 'kg'].includes(unit)) return res.status(400).json({ message: 'الوحدة غير صحيحة' });
    product.unit = unit;
  }
  if (isActive !== undefined) product.isActive = isActive;

  await product.save();
  res.json(product);
};

// DELETE /api/products/:id (owner only) - soft delete
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
  product.isActive = false;
  await product.save();
  res.json({ message: 'تم حذف المنتج' });
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
