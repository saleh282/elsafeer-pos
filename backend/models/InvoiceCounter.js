const mongoose = require('mongoose');

// One atomic counter per calendar day prevents duplicate invoice numbers.
const invoiceCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // YYYYMMDD
  sequence: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model('InvoiceCounter', invoiceCounterSchema);
