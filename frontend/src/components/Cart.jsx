const Cart = ({ items, onUpdateQty, onRemove }) => {
  const readQuantity = (value, minimum) => {
    const quantity = Number(value);
    return Number.isFinite(quantity) ? Math.max(minimum, quantity) : minimum;
  };

  if (!items.length) {
    return <div className="empty-state">السلة فارغة، اختر منتجًا لإضافته</div>;
  }

  return (
    <div className="flex-col gap-8">
      {items.map((item) => (
        <div
          key={item.productId}
          className="card"
          style={{ padding: 12 }}
        >
          <div className="flex items-center justify-between">
            <strong style={{ fontSize: 14 }}>{item.name}</strong>
            <button
              onClick={() => onRemove(item.productId)}
              className="btn-danger btn-sm"
              style={{ padding: '4px 10px' }}
              title="حذف"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            <div className="flex items-center gap-8">
              {item.unit === 'piece' ? (
                <>
                  <button
                    className="btn-outline btn-sm"
                    onClick={() => onUpdateQty(item.productId, Math.max(1, item.quantity - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQty(item.productId, readQuantity(e.target.value, 1))}
                    style={{ width: 60, textAlign: 'center', padding: '6px' }}
                  />
                  <button
                    className="btn-outline btn-sm"
                    onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                  >
                    +
                  </button>
                  <span className="text-muted" style={{ fontSize: 12 }}>قطعة</span>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    min="0.05"
                    step="0.05"
                    value={item.quantity}
                    onChange={(e) => onUpdateQty(item.productId, e.target.value)}
                    placeholder="مثال: 0.25"
                    style={{ width: 80, textAlign: 'center', padding: '6px' }}
                  />
                  <span className="text-muted" style={{ fontSize: 12 }}>كجم</span>
                </>
              )}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {(item.price * (Number(item.quantity) || 0)).toFixed(2)} ج.م
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Cart;
