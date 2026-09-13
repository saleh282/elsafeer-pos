import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CategoryList from '../components/CategoryList';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import ConfirmDialog from '../components/ConfirmDialog';
import { useShift } from '../context/ShiftContext';
import { useAuth } from '../context/AuthContext';
import { getCategories, getProducts } from '../services/productService';
import { createSale } from '../services/saleService';

const PAYMENT_METHODS = [
  { key: 'cash', label: 'نقدي' },
  { key: 'visa', label: 'فيزا' },
  { key: 'wallet', label: 'محفظة' },
];

const POS = () => {
  const { shift, loading: shiftLoading, refreshShift } = useShift();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [cart, setCart] = useState([]); // { productId, name, unit, price, quantity }
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (user?.branchId) refreshShift(user.branchId).catch(() => setError('تعذر التحقق من حالة الشيفت'));
  }, [user?.branchId, refreshShift]);

  useEffect(() => {
    getCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length) setSelectedCategory(cats[0]._id);
      })
      .catch((err) => setError(err.response?.data?.message || 'تعذر تحميل الأصناف'));
    getProducts()
      .then(setAllProducts)
      .catch(() => setError('تعذر تحميل المنتجات للبحث'));
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    setLoadingProducts(true);
    getProducts(selectedCategory)
      .then(setProducts)
      .catch((err) => setError(err.response?.data?.message || 'تعذر تحميل المنتجات'))
      .finally(() => setLoadingProducts(false));
  }, [selectedCategory]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id
            ? {
                ...i,
                quantity: product.unit === 'piece'
                  ? Number(i.quantity) + 1
                  : (Number(i.quantity) > 0 ? Number(i.quantity) + 0.25 : ''),
              }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          unit: product.unit,
          price: product.price,
          quantity: product.unit === 'piece' ? 1 : '',
        },
      ];
    });
  };

  const updateQty = (productId, quantity) => {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * (Number(i.quantity) || 0), 0),
    [cart]
  );
  const displayedProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase('ar');
    const source = query ? allProducts : products;
    return query
      ? source.filter((product) => product.name.toLocaleLowerCase('ar').includes(query))
      : source;
  }, [allProducts, products, productSearch]);
  const discountValue = Math.min(Number(discount) || 0, subtotal);
  const total = Math.max(0, subtotal - discountValue);
  const change =
    paymentMethod === 'cash' && paidAmount !== '' ? Number(paidAmount) - total : null;

  const canConfirm =
    cart.length > 0 &&
    shift &&
    cart.every((item) => Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0) &&
    (paymentMethod !== 'cash' || (Number(paidAmount) >= total && paidAmount !== ''));

  const handleConfirmSale = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        shiftId: shift._id,
        customerPhone,
        discount: discountValue,
        paymentMethod,
        paidAmount: paymentMethod === 'cash' ? Number(paidAmount) : undefined,
        products: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };
      const sale = await createSale(payload);
      navigate(`/invoice/${sale._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل البيع');
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (shiftLoading) {
    return (
      <div>
        <Navbar />
        <div className="page flex items-center justify-between" style={{ justifyContent: 'center', height: '60vh' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div>
        <Navbar />
        <div className="page" style={{ maxWidth: 480, textAlign: 'center', marginTop: 60 }}>
          <div className="card" style={{ padding: 32 }}>
            <h2>لا يوجد شيفت مفتوح</h2>
            <p className="text-muted">يجب فتح شيفت أولاً قبل بدء البيع</p>
            <button className="btn btn-lg" style={{ marginTop: 16 }} onClick={() => navigate('/open-shift')}>
              فتح شيفت
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="page">
        {error && (
          <div className="text-danger" style={{ background: '#FCE9E7', padding: 12, borderRadius: 8, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 340px',
            gap: 16,
            alignItems: 'start',
          }}
          className="pos-grid"
        >
          {/* Categories */}
          <div>
            <h4 style={{ marginBottom: 10 }}>الأصناف</h4>
            <CategoryList categories={categories} selectedId={selectedCategory} onSelect={setSelectedCategory} />
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between" style={{ gap: 12, marginBottom: 10 }}>
              <h4 style={{ margin: 0 }}>المنتجات</h4>
              <input
                type="search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="ابحث عن منتج..."
                aria-label="البحث عن منتج"
                style={{ maxWidth: 280 }}
              />
            </div>
            {loadingProducts ? (
              <div className="spinner" />
            ) : displayedProducts.length === 0 ? (
              <div className="empty-state">لا توجد نتائج مطابقة للبحث</div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 12,
                }}
              >
                {displayedProducts.map((p) => (
                  <ProductCard key={p._id} product={p} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>

          {/* Cart / Checkout */}
          <div className="card" style={{ padding: 16, position: 'sticky', top: 76 }}>
            <h4 style={{ marginBottom: 10 }}>الفاتورة الحالية</h4>
            <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
              <Cart items={cart} onUpdateQty={updateQty} onRemove={removeItem} />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>رقم هاتف العميل (اختياري)</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                style={{ marginTop: 4, marginBottom: 10 }}
              />

              <label style={{ fontSize: 13, fontWeight: 600 }}>الخصم (ج.م)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                style={{ marginTop: 4, marginBottom: 10 }}
              />

              <div className="flex-col gap-8" style={{ fontSize: 14 }}>
                <div className="flex items-center justify-between">
                  <span className="text-muted">الإجمالي الفرعي</span>
                  <span>{subtotal.toFixed(2)} ج.م</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">الخصم</span>
                  <span className="text-danger">- {discountValue.toFixed(2)} ج.م</span>
                </div>
                <div className="flex items-center justify-between" style={{ fontSize: 18, fontWeight: 800 }}>
                  <span>الإجمالي النهائي</span>
                  <span style={{ color: 'var(--color-primary)' }}>{total.toFixed(2)} ج.م</span>
                </div>
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginTop: 14 }}>
                طريقة الدفع
              </label>
              <div className="flex gap-8" style={{ marginTop: 6, marginBottom: 10 }}>
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.key}
                    className={paymentMethod === m.key ? 'btn btn-block btn-sm' : 'btn-outline btn-block btn-sm'}
                    onClick={() => setPaymentMethod(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'cash' && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>المبلغ المدفوع</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ marginTop: 4 }}
                  />
                  {paidAmount !== '' && (
                    <div
                      className="flex items-center justify-between"
                      style={{ marginTop: 8, fontSize: 14, fontWeight: 700 }}
                    >
                      <span>الباقي للعميل</span>
                      <span className={change < 0 ? 'text-danger' : 'text-success'}>
                        {change !== null ? change.toFixed(2) : '0.00'} ج.م
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn-accent btn-lg btn-block"
                style={{ marginTop: 8 }}
                disabled={!canConfirm || submitting}
                onClick={() => setConfirmOpen(true)}
              >
                تأكيد البيع
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="تأكيد البيع"
        message={`سيتم تسجيل فاتورة بقيمة ${total.toFixed(2)} ج.م. هل تريد المتابعة؟`}
        onConfirm={handleConfirmSale}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel={submitting ? 'جاري التأكيد...' : 'تأكيد'}
      />
    </div>
  );
};

export default POS;
