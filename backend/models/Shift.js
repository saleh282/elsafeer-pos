const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    shiftType: { type: String, enum: ['morning', 'night'], required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    openedAt: { type: Date, default: Date.now },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    closedAt: { type: Date },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Snapshot of totals, filled in at close time
    summary: {
      invoiceCount: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
      visa: { type: Number, default: 0 },
      wallet: { type: Number, default: 0 },
      discounts: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// A branch has a single cash register, so it can have only one open shift.
shiftSchema.index(
  { branchId: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } }
);

module.exports = mongoose.model('Shift', shiftSchema);
