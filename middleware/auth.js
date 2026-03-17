const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 生成 Access Token（短期）
 */
function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '2h' }
  );
}

/**
 * 生成 Refresh Token（长期）
 */
function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

/**
 * 认证中间件 — 验证 Access Token
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: '用户不存在或已被禁用' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'token 已过期', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: '认证失败' });
  }
}

/**
 * 权限中间件 — 检查角色
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '无权限访问' });
    }
    next();
  };
}

module.exports = { signAccessToken, signRefreshToken, authenticate, authorize };
