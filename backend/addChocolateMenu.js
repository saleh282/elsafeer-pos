// Adds or updates the chocolate section without changing any sales or other menu items.
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Category = require('./models/Category');
const Product = require('./models/Product');

dotenv.config();

const chocolateProducts = [
  ['شوكلاته معرض 40 قطعة', 300, 'piece'],
  ['شوكلاته معرض 60 قطعة', 360, 'piece'],
  ['شوكلاته معرض 80 قطعة', 450, 'piece'],
  ['شوكلاته معرض بندق', 500, 'piece'],
  ['شوكلاته معرض مكسرات', 500, 'piece'],
  ['شوكلاته سادة', 300, 'kg'],
  ['شوكلاته سادة طبيعي', 350, 'kg'],
  ['شوكلاته كروشيه', 400, 'kg'],
  ['شوكلاته بندق / لوز', 400, 'kg'],
  ['شوكلاته كريسبي / كراميل / مكسرات', 350, 'kg'],
];

const run = async () => {
  await connectDB();

  const category = await Category.findOneAndUpdate(
    { name: 'شوكولاتة' },
    { $set: { defaultUnit: 'kg' }, $setOnInsert: { order: 5 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  for (const [name, price, unit] of chocolateProducts) {
    await Product.findOneAndUpdate(
      { name, categoryId: category._id },
      { $set: { name, price, categoryId: category._id, unit, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  console.log(`Chocolate menu ready: ${chocolateProducts.length} products.`);
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
