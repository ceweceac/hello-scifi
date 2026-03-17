const rateLimit = require('express-rate-limit');

// 通用 API 限流：每 IP 15 分钟最多 100 次
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '请求过于频繁，请稍后再试' }
});

// 登录限流：每 IP 15 分钟最多 10 次
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '登录尝试过多，请15分钟后再试' }
});

// 注册限流：每 IP 1 小时最多 5 次
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '注册次数过多，请1小时后再试' }
});

module.exports = { apiLimiter, loginLimiter, registerLimiter };
