// Adds or updates the menu without deleting sales, users, shifts, or existing products.
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Category = require('./models/Category');
const Product = require('./models/Product');
const menuProducts = require('./menuProducts');

dotenv.config();

const run = async () => {
  await connectDB();
  await Promise.all([
    Category.findOneAndUpdate({ name: 'شرقي' }, { $setOnInsert: { defaultUnit: 'kg', order: 1 } }, { upsert: true, new: true }),
    Category.findOneAndUpdate({ name: 'تورت' }, { $setOnInsert: { defaultUnit: 'piece', order: 2 } }, { upsert: true, new: true }),
    Category.findOneAndUpdate({ name: 'جاتوه' }, { $setOnInsert: { defaultUnit: 'piece', order: 3 } }, { upsert: true, new: true }),
    Category.findOneAndUpdate({ name: 'منتجات العيد' }, { $setOnInsert: { defaultUnit: 'kg', order: 4 } }, { upsert: true, new: true }),
  ]);
  const categories = await Category.find({ name: { $in: ['شرقي', 'تورت', 'جاتوه', 'منتجات العيد'] } });
  const categoryIds = new Map(categories.map((category) => [category.name, category._id]));

  for (const { category, ...product } of menuProducts) {
    await Product.findOneAndUpdate(
      { name: product.name, categoryId: categoryIds.get(category) },
      { $set: { ...product, categoryId: categoryIds.get(category), isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  console.log(`Imported ${menuProducts.length} menu products.`);
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
