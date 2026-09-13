const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Shift = require('../models/Shift');
const { isValidObjectId } = require('mongoose');
const generateInvoiceNumber = require('../utils/invoiceNumber');
const { businessDayRange, scheduledShiftType } = require('../utils/businessDay');

// POST /api/sales
const createSale = async (req, res) => {
  const { shiftId, customerPhone, products, discount, paymentMethod, paidAmount } = req.body;

  if (!shiftId) return res.status(400).json({ message: 'يجب فتح شيفت أولاً' });
  if (!isValidObjectId(shiftId)) return res.status(400).json({ message: 'معرّف الشيفت غير صحيح' });
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'السلة فارغة' });
  }
  if (!['cash', 'visa', 'wallet'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'طريقة الدفع غير صحيحة' });
  }

  // Verify shift belongs to the cashier's branch and is open
  const shift = await Shift.findById(shiftId);
  if (!shift) return res.status(404).json({ message: 'الشيفت غير موجود' });
  if (shift.status !== 'open') return res.status(400).json({ message: 'لا يمكن تسجيل بيع في شيفت مغلق' });

  const expectedShift = scheduledShiftType();
  if (!expectedShift) {
    return res.status(400).json({ message: 'انتهت مواعيد البيع اليوم. العمل من 9 صباحًا إلى 1 صباحًا' });
  }
  if (shift.shiftType !== expectedShift) {
    return res.status(400).json({
      message: expectedShift === 'morning'
        ? 'الوقت الحالي للشيفت الصباحي. افتح شيفت صباحي لتسجيل البيع'
        : 'الوقت الحالي للشيفت المسائي. اقفل الشيفت الصباحي وافتح الشيفت المسائي',
    });
  }

  const branchId = req.user.role === 'owner' ? shift.branchId : req.user.branchId;
  if (req.user.role === 'cashier' && shift.branchId.toString() !== req.user.branchId) {
    return res.status(403).json({ message: 'لا يمكنك البيع في فرع آخر' });
  }

  // Re-fetch real product prices from DB - never trust client-sent prices
  const productIds = products.map((p) => p.productId);
  if (productIds.some((productId) => !isValidObjectId(productId))) {
    return res.status(400).json({ message: 'معرّف أحد المنتجات غير صحيح' });
  }
  const dbProducts = await Product.find({ _id: { $in: productIds }, isActive: true });
  const dbProductMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  const saleProducts = [];

  for (const item of products) {
    const dbProduct = dbProductMap.get(item.productId);
    if (!dbProduct) {
      return res.status(400).json({ message: `منتج غير موجود: ${item.productId}` });
    }
    const quantity = Number(item.quantity);
    const isValidQuantity =
      Number.isFinite(quantity) &&
      quantity > 0 &&
      (dbProduct.unit === 'kg' || Number.isInteger(quantity));
    if (!isValidQuantity) {
      return res.status(400).json({ message: `الكمية غير صحيحة للمنتج ${dbProduct.name}` });
    }

    const lineTotal = Math.round(dbProduct.price * quantity * 100) / 100;
    subtotal += lineTotal;

    saleProducts.push({
      productId: dbProduct._id,
      name: dbProduct.name,
      unit: dbProduct.unit,
      price: dbProduct.price,
      quantity,
      total: lineTotal,
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;
  const requestedDiscount = discount === undefined || discount === '' ? 0 : Number(discount);
  if (!Number.isFinite(requestedDiscount) || requestedDiscount < 0) {
    return res.status(400).json({ message: 'قيمة الخصم غير صحيحة' });
  }
  const discountValue = Math.min(requestedDiscount, subtotal);
  const total = Math.round((subtotal - discountValue) * 100) / 100;

  let paidAmountValue = undefined;
  let change = undefined;

  if (paymentMethod === 'cash') {
    paidAmountValue = Number(paidAmount);
    if (!Number.isFinite(paidAmountValue) || paidAmountValue < total) {
      return res.status(400).json({ message: 'المبلغ المدفوع أقل من إجمالي الفاتورة' });
    }
    change = Math.round((paidAmountValue - total) * 100) / 100;
  }

  const invoiceNumber = await generateInvoiceNumber();

  const sale = await Sale.create({
    invoiceNumber,
    branchId,
    shiftId: shift._id,
    shift: shift.shiftType,
    cashierId: req.user.userId,
    customerPhone: customerPhone || '',
    products: saleProducts,
    subtotal,
    discount: discountValue,
    total,
    paymentMethod,
    paidAmount: paidAmountValue,
    change,
  });

  res.status(201).json(sale);
};

// GET /api/sales?date=&paymentMethod=&shift=&page=
const getSales = async (req, res) => {
  const filter = {};

  // Branch enforcement: cashier only sees their own branch
  if (req.user.role === 'cashier') {
    filter.branchId = req.user.branchId;
  } else if (req.query.branchId) {
    if (!isValidObjectId(req.query.branchId)) {
      return res.status(400).json({ message: 'معرّف الفرع غير صحيح' });
    }
    filter.branchId = req.query.branchId;
  }

  if (req.query.paymentMethod) {
    if (!['cash', 'visa', 'wallet'].includes(req.query.paymentMethod)) {
      return res.status(400).json({ message: 'طريقة الدفع غير صحيحة' });
    }
    filter.paymentMethod = req.query.paymentMethod;
  }
  if (req.query.shift) {
    if (!['morning', 'night'].includes(req.query.shift)) {
      return res.status(400).json({ message: 'نوع الشيفت غير صحيح' });
    }
    filter.shift = req.query.shift;
  }

  if (req.query.date) {
    const range = businessDayRange(req.query.date);
    if (!range) return res.status(400).json({ message: 'صيغة التاريخ غير صحيحة' });
    const { start, end } = range;
    filter.createdAt = { $gte: start, $lte: end };
  }

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));

  const sales = await Sale.find(filter)
    .populate('cashierId', 'name')
    .populate('branchId', 'name')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Sale.countDocuments(filter);

  res.json({ sales, total, page, pages: Math.ceil(total / limit) });
};

// GET /api/sales/:id
const getSaleById = async (req, res) => {
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'معرّف الفاتورة غير صحيح' });
  const sale = await Sale.findById(req.params.id).populate('cashierId', 'name').populate('branchId', 'name');
  if (!sale) return res.status(404).json({ message: 'الفاتورة غير موجودة' });

  if (req.user.role === 'cashier' && sale.branchId._id.toString() !== req.user.branchId) {
    return res.status(403).json({ message: 'غير مصرح بعرض هذه الفاتورة' });
  }

  res.json(sale);
};

module.exports = { createSale, getSales, getSaleById };
