import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { getSalesReport } from '../services/reportService';

// A shop day starts at 09:00 and continues until 01:00 the next morning.
const todayStr = () => {
  const businessDate = new Date();
  if (businessDate.getHours() < 1) businessDate.setDate(businessDate.getDate() - 1);
  const offset = businessDate.getTimezoneOffset() * 60 * 1000;
  return new Date(businessDate.getTime() - offset).toISOString().slice(0, 10);
};

const Dashboard = () => {
  const { user } = useAuth();
  const { shift, loading: shiftLoading, refreshShift } = useShift();
  const [todayReport, setTodayReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'cashier') {
      refreshShift();
    }
  }, [user]);

  useEffect(() => {
    const loadReport = async () => {
      setLoadingReport(true);
      try {
        const params = { from: todayStr(), to: todayStr() };
        const data = await getSalesReport(params);
        setTodayReport(data);
      } catch (err) {
        // silent - dashboard is not critical path
      } finally {
        setLoadingReport(false);
      }
    };
    loadReport();
  }, []);

  const statCards = [
    { label: 'مبيعات اليوم', value: todayReport ? `${todayReport.totalSales} ج.م` : '—' },
    { label: 'عدد الفواتير', value: todayReport ? todayReport.invoiceCount : '—' },
    { label: 'نقدي', value: todayReport ? `${todayReport.cash} ج.م` : '—' },
    { label: 'فيزا', value: todayReport ? `${todayReport.visa} ج.م` : '—' },
    { label: 'محفظة', value: todayReport ? `${todayReport.wallet} ج.م` : '—' },
  ];

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="dashboard-hero card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="eyebrow">نظام نقاط البيع</div>
              <h2 style={{ marginBottom: 2 }}>مرحبًا، {user?.name}</h2>
              <p className="text-muted" style={{ fontSize: 14 }}>
                {user?.role === 'owner' ? 'مالك المحل - جميع الفروع' : `فرع: ${user?.branchName}`}
              </p>
            </div>

            {user?.role === 'cashier' && (
              <div>
                {shiftLoading ? (
                  <div className="spinner" />
                ) : shift ? (
                  <span className="badge badge-cash">
                    شيفت {shift.shiftType === 'morning' ? 'صباحي' : 'مسائي'} مفتوح
                  </span>
                ) : (
                  <span className="badge badge-wallet">لا يوجد شيفت مفتوح</span>
                )}
              </div>
            )}
          </div>
        </div>

        <h3 style={{ marginBottom: 12 }}>ملخص يوم العمل <span className="text-muted" style={{ fontSize: 13, fontWeight: 500 }}>(9 ص – 1 ص)</span></h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 28,
          }}
        >
          {statCards.map((s) => (
            <div key={s.label} className="card" style={{ padding: 16 }}>
              <div className="text-muted" style={{ fontSize: 13, marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}>
                {loadingReport ? '...' : s.value}
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ marginBottom: 12 }}>إجراءات سريعة</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          {user?.role === 'cashier' && (
            <button
              className="btn-lg"
              style={{ padding: '20px' }}
              onClick={() => navigate(shift ? '/pos' : '/open-shift')}
            >
              🛒 فتح الكاشير
            </button>
          )}
          <button className="btn-outline btn-lg" style={{ padding: '20px' }} onClick={() => navigate('/sales')}>
            📋 سجل المبيعات
          </button>
          <button className="btn-outline btn-lg" style={{ padding: '20px' }} onClick={() => navigate('/reports')}>
            📊 التقارير
          </button>
          {user?.role === 'cashier' && shift && (
            <button className="btn-accent btn-lg" style={{ padding: '20px' }} onClick={() => navigate('/close-shift')}>
              🔒 قفل الشيفت
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
