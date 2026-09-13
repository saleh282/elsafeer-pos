import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { openShift } from '../services/shiftService';

const scheduledShiftType = () => {
  const hour = new Date().getHours();
  if (hour >= 9 && hour < 18) return 'morning';
  if (hour >= 18 || hour < 1) return 'night';
  return null;
};

const OpenShift = () => {
  const { user } = useAuth();
  const { setShift } = useShift();
  const expectedShift = scheduledShiftType();
  const [shiftType, setShiftType] = useState(() => expectedShift || 'morning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleOpen = async () => {
    if (!expectedShift) {
      setError('مواعيد العمل من 9 صباحًا إلى 1 صباحًا');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const shift = await openShift(shiftType);
      setShift(shift);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر فتح الشيفت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 460 }}>
      <div className="card" style={{ padding: 28, marginTop: 40 }}>
        <h2>فتح شيفت جديد</h2>
        <p className="text-muted">
          الفرع: <strong>{user?.branchName}</strong>
        </p>
        <p className="text-muted" style={{ fontSize: 13 }}>الصباحي 9 ص – 6 م · المسائي 6 م – 1 ص</p>
        {!expectedShift && (
          <p className="text-danger" style={{ marginTop: 8 }}>خارج مواعيد العمل حاليًا. يمكن فتح الكاشير من 9 صباحًا.</p>
        )}

        {error && (
          <div className="text-danger" style={{ background: '#FCE9E7', padding: 10, borderRadius: 8, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <label style={{ fontWeight: 600, fontSize: 14, display: 'block', margin: '16px 0 8px' }}>
          اختر نوع الشيفت
        </label>
        <div className="flex gap-12">
          <button
            className={shiftType === 'morning' ? 'btn btn-block' : 'btn-outline btn-block'}
            onClick={() => setShiftType('morning')}
            disabled={expectedShift !== 'morning'}
          >
            ☀️ صباحي
          </button>
          <button
            className={shiftType === 'night' ? 'btn btn-block' : 'btn-outline btn-block'}
            onClick={() => setShiftType('night')}
            disabled={expectedShift !== 'night'}
          >
            🌙 مسائي
          </button>
        </div>

        <button className="btn-accent btn-lg btn-block" style={{ marginTop: 24 }} onClick={handleOpen} disabled={loading || !expectedShift}>
          {loading ? 'جاري الفتح...' : 'فتح الشيفت والبدء'}
        </button>
      </div>
    </div>
  );
};

export default OpenShift;
