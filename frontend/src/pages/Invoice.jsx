import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getSaleById } from '../services/saleService';

const PAYMENT_LABELS = { cash: 'نقدي', visa: 'فيزا', wallet: 'محفظة' };

const Invoice = () => {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getSaleById(id)
      .then(setSale)
      .catch((err) => setError(err.response?.data?.message || 'تعذر تحميل الفاتورة'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="page flex items-center justify-between" style={{ justifyContent: 'center', height: '60vh' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div>
        <Navbar />
        <div className="page empty-state">{error || 'الفاتورة غير موجودة'}</div>
      </div>
    );
  }

  const dt = new Date(sale.createdAt);
  const handlePrint = () => {
    const receipt = document.getElementById('invoice-print');
    if (!receipt) return window.print();

    // Xprinter's 80 mm paper has a 72 mm printable area. Matching that
    // width prevents the driver from shrinking the receipt to fit.
    // The height is based on the actual content, so it does not feed the
    // rest of the driver's long, fixed page after the footer.
    const { width, height } = receipt.getBoundingClientRect();
    const printableWidthMm = 72;
    const heightMm = Math.max(45, Math.ceil((height / width) * printableWidthMm + 3));
    const pageStyle = document.createElement('style');
    pageStyle.id = 'thermal-receipt-page-size';
    pageStyle.textContent = `@media print { @page { size: ${printableWidthMm}mm ${heightMm}mm; margin: 0; } }`;
    document.head.appendChild(pageStyle);
    const removePageStyle = () => {
      pageStyle.remove();
      window.removeEventListener('afterprint', removePageStyle);
    };
    window.addEventListener('afterprint', removePageStyle);
    window.print();
  };

  return (
    <div>
      <Navbar />
      <div className="page" style={{ maxWidth: 560 }}>
        <div className="flex gap-12" style={{ marginBottom: 16 }}>
          <button className="btn" onClick={handlePrint}>
            🖨️ طباعة الفاتورة
          </button>
          <button className="btn-outline" onClick={() => navigate('/pos')}>
            بيع جديد
          </button>
          <button className="btn-outline" onClick={() => navigate('/sales')}>
            سجل المبيعات
          </button>
        </div>

        <div id="invoice-print" className="receipt" style={{ padding: 28 }}>
          <div className="receipt-brand">
            <img className="receipt-logo" src="/logo.jpg" alt="شعار حلواني السفير" />
            <h1 style={{ color: 'var(--color-accent)', fontSize: 27, marginBottom: 4 }}>حلواني السفير</h1>
            <p className="text-muted" style={{ fontSize: 13 }}>فاتورة بيع · {sale.branchId?.name}</p>
          </div>

          <div className="receipt-meta">
            <div className="receipt-meta-item"><span>رقم الفاتورة</span><strong>{sale.invoiceNumber}</strong></div>
            <div className="receipt-meta-item"><span>التاريخ والوقت</span><strong>{dt.toLocaleDateString('ar-EG')} · {dt.toLocaleTimeString('ar-EG')}</strong></div>
            <div className="receipt-meta-item"><span>الكاشير</span><strong>{sale.cashierId?.name}</strong></div>
            <div className="receipt-meta-item"><span>الشيفت</span><strong>{sale.shift === 'morning' ? 'صباحي' : 'مسائي'}</strong></div>
            {sale.customerPhone && <div className="receipt-meta-item"><span>هاتف العميل</span><strong>{sale.customerPhone}</strong></div>}
          </div>

          <table className="receipt-table" style={{ marginBottom: 12 }}>
            <thead>
              <tr>
                <th className="receipt-col-product">المنتج</th>
                <th className="receipt-col-quantity">الكمية</th>
                <th className="receipt-col-price">السعر</th>
                <th className="receipt-col-total">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {sale.products.map((p, idx) => (
                <tr key={idx}>
                  <td className="receipt-col-product">{p.name}</td>
                  <td className="receipt-col-quantity">
                    {p.quantity} {p.unit === 'piece' ? 'قطعة' : 'كجم'}
                  </td>
                  <td className="receipt-col-price">{p.price}</td>
                  <td className="receipt-col-total">{p.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-total flex-col gap-8" style={{ fontSize: 14 }}>
            <div className="flex items-center justify-between">
              <span className="text-muted">الإجمالي الفرعي</span>
              <span>{sale.subtotal.toFixed(2)} ج.م</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">الخصم</span>
              <span className="text-danger">- {sale.discount.toFixed(2)} ج.م</span>
            </div>
            <div className="flex items-center justify-between" style={{ fontSize: 21, fontWeight: 800, paddingTop: 8, borderTop: '1px dashed #b7cec1' }}>
              <span>الإجمالي النهائي</span>
              <span style={{ color: 'var(--color-primary)' }}>{sale.total.toFixed(2)} ج.م</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">طريقة الدفع</span>
              <span>{PAYMENT_LABELS[sale.paymentMethod]}</span>
            </div>
            {sale.paymentMethod === 'cash' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted">المبلغ المدفوع</span>
                  <span>{sale.paidAmount?.toFixed(2)} ج.م</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">الباقي</span>
                  <span>{sale.change?.toFixed(2)} ج.م</span>
                </div>
              </>
            )}
          </div>

          <p className="receipt-footer text-muted">
            شكرًا لزيارتكم · السفير دايمًا أقرب لكم
          </p>
          <p className="receipt-print-note">جاهزة للطباعة الحرارية 80 مم</p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
