const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies JWT and attaches the authenticated user to req.user
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'غير مصرح، الرجاء تسجيل الدخول' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.userId) {
      return res.status(401).json({ message: 'جلسة غير صالحة، الرجاء تسجيل الدخول مرة أخرى' });
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'المستخدم غير موجود أو غير مفعل' });
    }

    // req.user is always derived from the DB record - never trust client-provided branchId
    req.user = {
      userId: user._id.toString(),
      name: user.name,
      role: user.role,
      branchId: user.branchId ? user.branchId.toString() : null,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'جلسة غير صالحة، الرجاء تسجيل الدخول مرة أخرى' });
  }
};

// Restrict route to specific roles
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });
  }
  next();
};

module.exports = { protect, authorize };
