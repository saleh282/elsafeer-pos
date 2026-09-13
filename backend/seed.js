const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Branch = require('./models/Branch');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');
const Sale = require('./models/Sale');
const Shift = require('./models/Shift');
const menuProducts = require('./menuProducts');

dotenv.config();

const run = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    Sale.deleteMany({}),
    Shift.deleteMany({}),
    Branch.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log('Creating branches...');
  const branches = await Branch.insertMany([
    { name: 'الإسماعيلية' },
    { name: 'فايد' },
    { name: 'سرابيوم' },
  ]);
  const [ismailia, fayed, sarabium] = branches;

  console.log('Creating categories...');
  const categories = await Category.insertMany([
    { name: 'شرقي', defaultUnit: 'kg', order: 1 },
    { name: 'تورت', defaultUnit: 'piece', order: 2 },
    { name: 'جاتوه', defaultUnit: 'piece', order: 3 },
    { name: 'منتجات العيد', defaultUnit: 'kg', order: 4 },
  ]);
  const categoryIds = new Map(categories.map((category) => [category.name, category._id]));

  console.log('Creating products...');
  await Product.insertMany(menuProducts.map(({ category, ...product }) => ({
    ...product,
    categoryId: categoryIds.get(category),
  })));

  console.log('Creating users...');
  await User.create([
    {
      name: 'احمد شاكر',
      username: 'ahmed shaker',
      password: 'owner123',
      role: 'owner',
    },
    {
      name: 'أحمد سامي',
      username: 'ismailia1',
      password: 'cashier123',
      role: 'cashier',
      branchId: ismailia._id,
    },
    {
      name: 'احمد',
      username: 'fayed1',
      password: 'cashier123',
      role: 'cashier',
      branchId: fayed._id,
    },
    {
      name: 'سرابيوم',
      username: 'sarabium1',
      password: 'cashier123',
      role: 'cashier',
      branchId: sarabium._id,
    },
  ]);

  console.log('Seed complete!');
  console.log('---------------------------------');
  console.log('Owner login:    owner / owner123');
  console.log('Cashier login:  ismailia1 / cashier123 (branch: الإسماعيلية)');
  console.log('Cashier login:  fayed1 / cashier123 (branch: فايد)');
  console.log('Cashier login:  sarabium1 / cashier123 (branch: سرابيوم)');
  console.log('---------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
