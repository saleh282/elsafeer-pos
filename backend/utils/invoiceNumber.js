const Sale = require('../models/Sale');
const InvoiceCounter = require('../models/InvoiceCounter');

// Uses a database-side atomic counter, so simultaneous sales cannot get the same number.
const generateInvoiceNumber = async () => {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Existing installations may already have invoices from before counters were introduced.
  // Bring the counter up to their latest sequence before incrementing it.
  const latestInvoice = await Sale.findOne({ invoiceNumber: new RegExp(`^INV-${datePart}-(\\d{4,})$`) })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();
  const latestSequence = latestInvoice ? Number(latestInvoice.invoiceNumber.split('-').pop()) : 0;

  await InvoiceCounter.findByIdAndUpdate(
    datePart,
    { $max: { sequence: latestSequence } },
    { upsert: true, new: true, setDefaultsOnInsert: false },
  );
  const counter = await InvoiceCounter.findByIdAndUpdate(
    datePart,
    { $inc: { sequence: 1 } },
    { new: true },
  );

  const seq = String(counter.sequence).padStart(4, '0');
  return `INV-${datePart}-${seq}`;
};

module.exports = generateInvoiceNumber;
