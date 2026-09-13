import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { getSales } from '../services/saleService';

const money = (value) => `${value.toFixed(2)} ج.م`;

const businessDate = (dateValue) => {
  const date = new Date(dateValue);
  if (date.getHours() < 1) date.setDate(date.getDate() - 1);
  return date;
};

const groupDailySales = (sales) => {
  const days = new Map();
  sales.forEach((sale) => {
    const date = businessDate(sale.createdAt);
    const key = [date.getFullYear(), date.getMonth(), date.getDate()].join('-');
    if (!days.has(key)) {
      days.set(key, {
        key,
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
        date: date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        invoices: 0, total: 0, cash: 0, visa: 0, wallet: 0, discounts: 0,
      });
    }
    const day = days.get(key);
    day.invoices += 1;
    day.total += sale.total;
    day.discounts += sale.discount || 0;
    day[sale.paymentMethod] += sale.total;
  });
  return [...days.values()].sort((a, b) => b.timestamp - a.timestamp);
};

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  const loadSales = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSales({ limit: 500 });
      setSales(data.sales);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر تحميل المبيعات اليومية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSales(); }, []);
  const dailySales = useMemo(() => groupDailySales(sales), [sales]);
  const day = selectedDay ? dailySales.find((item) => item.key === selectedDay) : null;

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="daily-report-heading">
          <div>
            <p className="eyebrow">ملخص يوم بيوم</p>
            <h2>المبيعات اليومية</h2>
            <p className="text-muted">كل يوم عمل من 9 صباحًا إلى 1 صباح اليوم التالي ظاهر لوحده.</p>
          </div>
          <button className="btn-outline" onClick={loadSales} disabled={loading}>تحديث البيانات</button>
        </div>

        {error && <div className="text-danger" style={{ background: '#FCE9E7', padding: 12, borderRadius: 8, marginBottom: 14 }}>{error}</div>}

        {loading ? (
          <div className="flex items-center justify-between" style={{ justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : dailySales.length === 0 ? (
          <div className="empty-state">لا توجد مبيعات مسجلة حتى الآن</div>
        ) : (
          <>
            <div className="daily-sales-list">
              {dailySales.map((item) => (
                <button type="button" key={item.key} className={`daily-sale-card card ${selectedDay === item.key ? 'is-selected' : ''}`} onClick={() => setSelectedDay((current) => current === item.key ? null : item.key)}>
                  <div className="daily-sale-date"><span>{item.date}</span><small>{item.invoices} فاتورة</small></div>
                  <strong>{money(item.total)}</strong>
                  <div className="daily-payment-summary">
                    <span>نقدي: {money(item.cash)}</span>
                    <span>فيزا: {money(item.visa)}</span>
                    <span>محفظة: {money(item.wallet)}</span>
                  </div>
                </button>
              ))}
            </div>

            {day && (
              <section className="daily-report-detail card">
                <h3>تفاصيل {day.date}</h3>
                <div className="daily-detail-grid">
                  <div><span>إجمالي المبيعات</span><strong>{money(day.total)}</strong></div>
                  <div><span>عدد الفواتير</span><strong>{day.invoices}</strong></div>
                  <div><span>إجمالي الخصم</span><strong>{money(day.discounts)}</strong></div>
                  <div><span>نقدي</span><strong>{money(day.cash)}</strong></div>
                  <div><span>فيزا</span><strong>{money(day.visa)}</strong></div>
                  <div><span>محفظة</span><strong>{money(day.wallet)}</strong></div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
