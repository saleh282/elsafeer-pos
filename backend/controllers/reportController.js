const Sale = require('../models/Sale');
const { businessDayRange } = require('../utils/businessDay');

// GET /api/reports/sales?from=&to=&branchId=
const getSalesReport = async (req, res) => {
  const { from, to } = req.query;

  const filter = {};

  if (req.user.role === 'cashier') {
    filter.branchId = req.user.branchId;
  } else if (req.query.branchId) {
    filter.branchId = req.query.branchId;
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const range = businessDayRange(from);
      if (!range) return res.status(400).json({ message: 'صيغة تاريخ البداية غير صحيحة' });
      filter.createdAt.$gte = range.start;
    }
    if (to) {
      const range = businessDayRange(to);
      if (!range) return res.status(400).json({ message: 'صيغة تاريخ النهاية غير صحيحة' });
      filter.createdAt.$lte = range.end;
    }
  }

  const sales = await Sale.find(filter);

  const report = {
    totalSales: 0,
    invoiceCount: sales.length,
    cash: 0,
    visa: 0,
    wallet: 0,
    discounts: 0,
  };

  for (const sale of sales) {
    report.totalSales += sale.total;
    report.discounts += sale.discount || 0;
    if (sale.paymentMethod === 'cash') report.cash += sale.total;
    if (sale.paymentMethod === 'visa') report.visa += sale.total;
    if (sale.paymentMethod === 'wallet') report.wallet += sale.total;
  }

  // round to 2 decimals
  Object.keys(report).forEach((k) => {
    if (typeof report[k] === 'number') report[k] = Math.round(report[k] * 100) / 100;
  });

  res.json(report);
};

module.exports = { getSalesReport };
