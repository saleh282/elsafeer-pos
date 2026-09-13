const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmLabel = 'تأكيد', danger = false }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(44,24,16,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ width: 380, maxWidth: '90vw', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p className="text-muted">{message}</p>
        <div className="flex gap-12" style={{ marginTop: 20 }}>
          <button className="btn-outline btn-block" onClick={onCancel}>
            إلغاء
          </button>
          <button className={`btn-block ${danger ? 'btn-danger' : 'btn'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
