const ProductCard = ({ product, onAdd }) => {
  return (
    <button
      onClick={() => onAdd(product)}
      className="product-card card"
      style={{
        padding: 16,
        textAlign: 'right',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minHeight: 108,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15 }}>{product.name}</div>
      <div className="flex items-center justify-between">
        <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
          {product.price} ج.م
        </span>
        <span className="text-muted" style={{ fontSize: 12 }}>
          / {product.unit === 'piece' ? 'قطعة' : 'كجم'}
        </span>
      </div>
    </button>
  );
};

export default ProductCard;
