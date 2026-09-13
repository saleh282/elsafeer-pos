// Centralized error handler
const notFound = (req, res, next) => {
  res.status(404).json({ message: `المسار غير موجود - ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') console.error(err);
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'معرّف البيانات غير صحيح' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'هذه البيانات موجودة بالفعل' });
  }
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'حدث خطأ غير متوقع في الخادم'
      : err.message || 'حدث خطأ في الخادم',
  });
};

module.exports = { notFound, errorHandler };
