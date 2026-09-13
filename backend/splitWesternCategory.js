const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Category = require('./models/Category');
const Product = require('./models/Product');

dotenv.config();

const run = async () => {
  await connectDB();
  const [oldCategory, cakes, gateau] = await Promise.all([
    Category.findOne({ name: 'غربي' }),
    Category.findOneAndUpdate({ name: 'تورت' }, { $setOnInsert: { defaultUnit: 'piece', order: 2 } }, { upsert: true, new: true }),
    Category.findOneAndUpdate({ name: 'جاتوه' }, { $setOnInsert: { defaultUnit: 'piece', order: 3 } }, { upsert: true, new: true }),
  ]);

  if (oldCategory) {
    const result = await Product.updateMany(
      { categoryId: oldCategory._id },
      [{ $set: { categoryId: { $cond: [{ $regexMatch: { input: '$name', regex: '^تورتة' } }, cakes._id, gateau._id] } } }],
    );
    await Category.deleteOne({ _id: oldCategory._id });
    console.log(`Split ${result.modifiedCount} western products.`);
  }
  await mongoose.connection.close();
};

run().catch(async (error) => { console.error(error); await mongoose.connection.close(); process.exit(1); });
