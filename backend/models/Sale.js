const mongoose = require('mongoose');

const saleProductSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unit: { type: String, enum: ['piece', 'kg'], required: true },
    price: { type: Number, required: true }, // price per unit at time of sale
    quantity: { type: Number, required: true }, // pieces or kg
    total: { type: Number, required: true },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
    shift: { type: String, enum: ['morning', 'night'], required: true },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerPhone: { type: String, default: '' },

    products: { type: [saleProductSchema], required: true, validate: (v) => v.length > 0 },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    paymentMethod: { type: String, enum: ['cash', 'visa', 'wallet'], required: true },
    paidAmount: { type: Number },
    change: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);
