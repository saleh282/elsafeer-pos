const Shift = require('../models/Shift');
const Sale = require('../models/Sale');
const { scheduledShiftType } = require('../utils/businessDay');

// GET /api/shifts/current
// Returns the currently open shift for the user's branch (owner must pass branchId query param)
const getCurrentShift = async (req, res) => {
  const branchId = req.user.role === 'owner' ? req.query.branchId : req.user.branchId;
  if (!branchId) return res.status(400).json({ message: 'يجب تحديد الفرع' });

  const shift = await Shift.findOne({ branchId, status: 'open' })
    .populate('branchId', 'name')
    .populate('openedBy', 'name');

  if (!shift) return res.json(null);
  res.json(shift);
};

// POST /api/shifts/open   body: { shiftType: 'morning' | 'night' }
const openShift = async (req, res) => {
  const { shiftType } = req.body;
  if (!['morning', 'night'].includes(shiftType)) {
    return res.status(400).json({ message: 'نوع الشيفت غير صحيح' });
  }

  const expectedShift = scheduledShiftType();
  if (!expectedShift) {
    return res.status(400).json({ message: 'مواعيد العمل من 9 صباحًا إلى 1 صباحًا' });
  }
  if (shiftType !== expectedShift) {
    return res.status(400).json({
      message: expectedShift === 'morning'
        ? 'الوقت الحالي للشيفت الصباحي (من 9 ص إلى 6 م)'
        : 'الوقت الحالي للشيفت المسائي (من 6 م إلى 1 ص)',
    });
  }

  const branchId = req.user.branchId;
  if (!branchId) return res.status(400).json({ message: 'المستخدم غير مرتبط بفرع' });

  // Only one open shift per branch at a time (single register)
  const existing = await Shift.findOne({ branchId, status: 'open' });
  if (existing) {
    return res.status(400).json({ message: 'يوجد شيفت مفتوح بالفعل لهذا الفرع' });
  }

  let shift;
  try {
    shift = await Shift.create({
      branchId,
      shiftType,
      status: 'open',
      openedAt: new Date(),
      openedBy: req.user.userId,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'يوجد شيفت مفتوح بالفعل لهذا الفرع' });
    }
    throw err;
  }

  res.status(201).json(shift);
};

// POST /api/shifts/close   body: { shiftId }
const closeShift = async (req, res) => {
  const { shiftId } = req.body;
  const shift = await Shift.findById(shiftId);
  if (!shift) return res.status(404).json({ message: 'الشيفت غير موجود' });
  if (shift.status === 'closed') return res.status(400).json({ message: 'الشيفت مغلق بالفعل' });

  // Branch authorization: cashier can only close their own branch's shift
  if (req.user.role === 'cashier' && shift.branchId.toString() !== req.user.branchId) {
    return res.status(403).json({ message: 'لا يمكنك إغلاق شيفت فرع آخر' });
  }

  const summary = await calculateShiftSummary(shift._id);

  shift.status = 'closed';
  shift.closedAt = new Date();
  shift.closedBy = req.user.userId;
  shift.summary = summary;
  await shift.save();

  const populated = await Shift.findById(shift._id)
    .populate('branchId', 'name')
    .populate('openedBy', 'name')
    .populate('closedBy', 'name');

  res.json(populated);
};

// Calculates totals for a given shift purely from Sale documents in DB
const calculateShiftSummary = async (shiftId) => {
  const sales = await Sale.find({ shiftId });

  const summary = {
    invoiceCount: sales.length,
    totalSales: 0,
    cash: 0,
    visa: 0,
    wallet: 0,
    discounts: 0,
  };

  for (const sale of sales) {
    summary.totalSales += sale.total;
    summary.discounts += sale.discount || 0;
    if (sale.paymentMethod === 'cash') summary.cash += sale.total;
    if (sale.paymentMethod === 'visa') summary.visa += sale.total;
    if (sale.paymentMethod === 'wallet') summary.wallet += sale.total;
  }

  return summary;
};

// GET /api/shifts/:id/summary - live preview before closing (same calc, no write)
const getShiftSummaryPreview = async (req, res) => {
  const shift = await Shift.findById(req.params.id).populate('branchId', 'name').populate('openedBy', 'name');
  if (!shift) return res.status(404).json({ message: 'الشيفت غير موجود' });

  if (req.user.role === 'cashier' && shift.branchId._id.toString() !== req.user.branchId) {
    return res.status(403).json({ message: 'غير مصرح' });
  }

  const summary = await calculateShiftSummary(shift._id);
  res.json({ shift, summary });
};

module.exports = { getCurrentShift, openShift, closeShift, getShiftSummaryPreview };
