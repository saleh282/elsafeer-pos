import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useShift } from '../context/ShiftContext';
import { getShiftSummaryPreview, closeShift } from '../services/shiftService';

const ShiftClose = () => {
  const { shift, setShift, refreshShift } = useShift();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closedResult, setClosedResult] = useState(null);
  const navigate = useNavigate();

  const printShiftReceipt = () => {
    const receipt = document.getElementById('shift-close-print');
    if (!receipt) return window.print();
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

  useEffect(() => {
    if (!shift) {
      refreshShift();
      return;
    }
    getShiftSummaryPreview(shift._id)
      .then((data) => setPreview(data))
      .catch((err) => setError(err.response?.data?.message || 'تعذر تحميل الملخص'))
      .finally(() => setLoading(false));
  }, [shift]);

  const handleClose = async () => {
    setClosing(true);
    setError('');
    try {
      const result = await closeShift(shift._id);
      setClosedResult(result);
      setShift(null);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر إغلاق الشيفت');
    } finally {
      setClosing(false);
      setConfirmOpen(false);
    }
  };

  if (!shift && !closedResult) {
    return (
      <div>
        <Navbar />
        <div className="page empty-state">لا يوجد شيفت مفتوح حاليًا</div>
      </div>
    );
  }

  if (closedResult) {
    const s = closedResult.summary;
    return (
      <div>
        <Navbar />
        <div className="page" style={{ maxWidth: 480 }}>
          <div id="shift-close-print" className="receipt" style={{ padding: 28, textAlign: 'center' }}>
            <div className="receipt-brand">
              <img className="receipt-logo" src="/logo.jpg" alt="شعار حلواني السفير" />
              <h2>إيصال قفل الشيفت</h2>
              <p className="text-muted">حلواني السفير</p>
            </div>
            <div className="flex-col gap-8" style={{ marginTop: 20, textAlign: 'right' }}>
              <Row label="الفرع" value={closedResult.branchId?.name} />
              <Row label="الشيفت" value={closedResult.shiftType === 'morning' ? 'صباحي' : 'مسائي'} />
              <Row label="عدد الفواتير" value={s.invoiceCount} />
              <Row label="نقدي" value={`${s.cash} ج.م`} />
              <Row label="فيزا" value={`${s.visa} ج.م`} />
              <Row label="محفظة" value={`${s.wallet} ج.م`} />
              <Row label="الخصومات" value={`${s.discounts} ج.م`} />
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />
              <Row label="الإجمالي النهائي" value={`${s.totalSales} ج.م`} big />
            </div>
            <button className="btn btn-lg btn-block no-print" style={{ marginTop: 20 }} onClick={printShiftReceipt}>
              🖨️ طباعة إيصال القفل
            </button>
            <button className="btn-outline btn-lg btn-block no-print" style={{ marginTop: 10 }} onClick={() => navigate('/dashboard')}>
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = preview?.summary;

  return (
    <div>
      <Navbar />
      <div className="page" style={{ maxWidth: 480 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ textAlign: 'center' }}>قفل الشيفت</h2>

          {error && (
            <div className="text-danger" style={{ background: '#FCE9E7', padding: 12, borderRadius: 8, marginTop: 12 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-between" style={{ justifyContent: 'center', padding: 30 }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="flex-col gap-8" style={{ marginTop: 16 }}>
              <Row label="الفرع" value={preview.shift.branchId?.name} />
              <Row label="الشيفت" value={preview.shift.shiftType === 'morning' ? 'صباحي' : 'مسائي'} />
              <Row label="الكاشير" value={preview.shift.openedBy?.name} />
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '6px 0' }} />
              <Row label="عدد الفواتير" value={s.invoiceCount} />
              <Row label="نقدي" value={`${s.cash} ج.م`} />
              <Row label="فيزا" value={`${s.visa} ج.م`} />
              <Row label="محفظة" value={`${s.wallet} ج.م`} />
              <Row label="الخصومات" value={`${s.discounts} ج.م`} />
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '6px 0' }} />
              <Row label="الإجمالي النهائي" value={`${s.totalSales} ج.م`} big />

              <button
                className="btn-accent btn-lg btn-block"
                style={{ marginTop: 16 }}
                onClick={() => setConfirmOpen(true)}
              >
                تأكيد قفل الشيفت
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="تأكيد قفل الشيفت"
        message="بعد الإغلاق لن تتمكن من تسجيل مبيعات جديدة في هذا الشيفت. هل أنت متأكد؟"
        onConfirm={handleClose}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel={closing ? 'جاري الإغلاق...' : 'تأكيد الإغلاق'}
        danger
      />
    </div>
  );
};

const Row = ({ label, value, big }) => (
  <div className="flex items-center justify-between" style={{ fontSize: big ? 20 : 14, fontWeight: big ? 800 : 500 }}>
    <span className={big ? '' : 'text-muted'}>{label}</span>
    <span style={{ color: big ? 'var(--color-primary)' : 'inherit' }}>{value}</span>
  </div>
);

export default ShiftClose;
