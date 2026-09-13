const CategoryList = ({ categories, selectedId, onSelect }) => {
  if (!categories.length) {
    return <div className="empty-state">لا توجد أصناف</div>;
  }

  return (
    <div className="flex-col gap-8">
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => onSelect(cat._id)}
          className={`category-button btn-block ${selectedId === cat._id ? 'is-active' : ''}`}
          style={{
            padding: '14px 12px',
            textAlign: 'right',
            fontSize: 16,
            background: selectedId === cat._id ? 'var(--color-accent)' : 'var(--color-surface)',
            color: selectedId === cat._id ? '#fff' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryList;
