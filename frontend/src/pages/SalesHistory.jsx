import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getSales } from '../services/saleService';
import { getBranches } from '../services/branchService';
import { useAuth } from '../context/AuthContext';

const PAYMENT_LABELS = { cash: 'نقدي', visa: 'فيزا', wallet: 'محفظة' };

const localDateInputValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const businessDateInputValue = (date = new Date()) => {
  const businessDate = new Date(date);
  if (businessDate.getHours() < 1) businessDate.setDate(businessDate.getDate() - 1);
  return localDateInputValue(businessDate);
};

const shiftDate = (dateValue, amount) => {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localDateInputValue(date);
};

const groupSalesByDayAndBranch = (sales) => {
  const days = new Map();

  sales.forEach((sale) => {
    const date = new Date(sale.createdAt);
    if (date.getHours() < 1) date.setDate(date.getDate() - 1);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!days.has(dayKey)) {
      days.set(dayKey, {
        timestamp: date.setHours(0, 0, 0, 0),
        label: date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        branches: new Map(),
      });
    }

    const branchKey = sale.branchId?._id || 'unknown';
    const day = days.get(dayKey);
    if (!day.branches.has(branchKey)) {
      day.branches.set(branchKey, {
        name: sale.branchId?.name || 'فرع غير معروف',
        shifts: { morning: [], night: [] },
      });
    }
    day.branches.get(branchKey).shifts[sale.shift]?.push(sale);
  });

  return [...days.values()]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((day) => ({ ...day, branches: [...day.branches.values()] }));
};

const ShiftDetails = ({ title, sales, navigate }) => {
  if (!sales.length) return null;
  const total = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <section className="shift-details">
      <div className="shift-details-header">
        <div><span className="shift-label">الشيفت</span><h5>{title}</h5></div>
        <div><span>{sales.length} فاتورة</span><strong>{total.toFixed(2)} ج.م</strong></div>
      </div>
      <div style={{ overflow: 'auto' }}>
        <table>
          <thead>
            <tr><th>رقم الفاتورة</th><th>الوقت</th><th>الكاشير</th><th>الإجمالي</th><th>الدفع</th></tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const date = new Date(sale.createdAt);
              return (
                <tr key={sale._id} className="sales-row" onClick={() => navigate(`/invoice/${sale._id}`)}>
                  <td><strong>{sale.invoiceNumber}</strong></td>
                  <td>{date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{sale.cashierId?.name || '-'}</td>
                  <td style={{ fontWeight: 800 }}>{sale.total.toFixed(2)} ج.م</td>
                  <td><span className={`badge badge-${sale.paymentMethod}`}>{PAYMENT_LABELS[sale.paymentMethod]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ date: businessDateInputValue(), paymentMethod: '', shift: '', branchId: '' });
  const [branches, setBranches] = useState([]);
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const navigate = useNavigate();

  const loadSales = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 500 };
      if (filters.date) params.date = filters.date;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.shift) params.shift = filters.shift;
      if (isOwner && filters.branchId) params.branchId = filters.branchId;
      const data = await getSales(params);
      setSales(data.sales);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر تحميل المبيعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [filters, isOwner]);

  useEffect(() => {
    if (!isOwner) return;
    getBranches().then(setBranches).catch(() => setBranches([]));
  }, [isOwner]);

  const groupedSales = useMemo(() => groupSalesByDayAndBranch(sales), [sales]);

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="daily-report-heading">
          <div>
            <p className="eyebrow">سجل منظم يومًا بيوم</p>
            <h2 style={{ marginBottom: 4 }}>مبيعات اليوم</h2>
            <p className="text-muted">يوم العمل يبدأ 9 صباحًا وينتهي 1 صباح اليوم التالي.</p>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
            <div style={{ minWidth: 160 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>اختر اليوم</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="flex gap-8" style={{ alignItems: 'flex-end' }}>
              <button className="btn-outline btn-sm" onClick={() => setFilters((f) => ({ ...f, date: shiftDate(f.date, -1) }))}>اليوم السابق</button>
              <button className="btn btn-sm" onClick={() => setFilters((f) => ({ ...f, date: businessDateInputValue() }))}>اليوم</button>
              <button className="btn-outline btn-sm" onClick={() => setFilters((f) => ({ ...f, date: shiftDate(f.date, 1) }))}>اليوم التالي</button>
            </div>
            {isOwner && (
              <div style={{ minWidth: 180 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>الفرع</label>
                <select
                  value={filters.branchId || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, branchId: e.target.value }))}
                >
                  <option value="">كل الفروع</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ minWidth: 160 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>طريقة الدفع</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value }))}
              >
                <option value="">الكل</option>
                <option value="cash">نقدي</option>
                <option value="visa">فيزا</option>
                <option value="wallet">محفظة</option>
              </select>
            </div>
            <div style={{ minWidth: 160 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>الشيفت</label>
              <select
                value={filters.shift}
                onChange={(e) => setFilters((f) => ({ ...f, shift: e.target.value }))}
              >
                <option value="">الكل</option>
                <option value="morning">صباحي</option>
                <option value="night">مسائي</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn-outline btn-sm"
                onClick={() => setFilters({ date: businessDateInputValue(), paymentMethod: '', shift: '', branchId: '' })}
              >
                إعادة ضبط
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-danger" style={{ background: '#FCE9E7', padding: 12, borderRadius: 8, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div className="sales-timeline">
          {loading ? (
            <div className="flex items-center justify-between" style={{ justifyContent: 'center', padding: 30 }}>
              <div className="spinner" />
            </div>
          ) : sales.length === 0 ? (
            <div className="empty-state">لا توجد مبيعات مطابقة</div>
          ) : groupedSales.map((day) => (
            <details className="sales-day" key={day.timestamp}>
              <summary className="sales-day-title">
                <span className="sales-day-dot" />
                <div><span className="sales-day-label">اضغط لعرض التفاصيل</span><h3>{day.label}</h3></div>
                <div className="sales-day-summary">
                  <span>{day.branches.reduce((count, branch) => count + branch.shifts.morning.length + branch.shifts.night.length, 0)} فاتورة</span>
                  <strong>{day.branches.reduce((sum, branch) => sum + [...branch.shifts.morning, ...branch.shifts.night].reduce((total, sale) => total + sale.total, 0), 0).toFixed(2)} ج.م</strong>
                </div>
              </summary>

              {day.branches.map((branch) => {
                const branchSales = [...branch.shifts.morning, ...branch.shifts.night];
                const branchTotal = branchSales.reduce((total, sale) => total + sale.total, 0);
                return (
                  <div className="sales-branch card" key={`${day.timestamp}-${branch.name}`}>
                    <div className="sales-branch-header">
                      <div>
                        <span className="sales-branch-label">الفرع</span>
                        <h4>{branch.name}</h4>
                      </div>
                      <div className="sales-branch-total">
                        <span>{branchSales.length} فاتورة</span>
                        <strong>{branchTotal.toFixed(2)} ج.م</strong>
                      </div>
                    </div>
                    <ShiftDetails title="صباحي ☀️" sales={branch.shifts.morning} navigate={navigate} />
                    <ShiftDetails title="مسائي 🌙" sales={branch.shifts.night} navigate={navigate} />
                  </div>
                );
              })}
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
