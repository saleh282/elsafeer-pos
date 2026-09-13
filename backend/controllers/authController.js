const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
  }

  const user = await User.findOne({ username: username.toLowerCase().trim() }).populate('branchId', 'name');
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      userId: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      branchId: user.branchId ? user.branchId._id : null,
      branchName: user.branchId ? user.branchId.name : null,
    },
  });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findById(req.user.userId).populate('branchId', 'name').select('-password');
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

  res.json({
    userId: user._id,
    name: user.name,
    username: user.username,
    role: user.role,
    branchId: user.branchId ? user.branchId._id : null,
    branchName: user.branchId ? user.branchId.name : null,
  });
};

module.exports = { login, getMe };
