const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signAccessToken, signRefreshToken } = require('../middleware/auth');

/* ========== 注册 ========== */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 检查重复
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({ success: false, message: '该邮箱已被注册' });
    }
    const nameExists = await User.findOne({ where: { username } });
    if (nameExists) {
      return res.status(409).json({ success: false, message: '该用户名已被使用' });
    }

    const user = await User.create({ username, email, password });

    // 生成 token
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // 保存 refreshToken
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: user.toSafeJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

/* ========== 登录 ========== */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: '账户已被禁用，请联系管理员' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: user.toSafeJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

/* ========== 刷新 Token ========== */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: '缺少 refreshToken' });
    }

    // 验证 token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'refreshToken 无效或已过期' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'refreshToken 无效' });
    }

    // 颁发新 token 对
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

/* ========== 获取当前用户 ========== */
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user.toSafeJSON() }
  });
};

/* ========== 修改资料 ========== */
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, avatar } = req.body;
    const user = req.user;

    if (username && username !== user.username) {
      const nameExists = await User.findOne({ where: { username } });
      if (nameExists) {
        return res.status(409).json({ success: false, message: '该用户名已被使用' });
      }
      user.username = username;
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    res.json({
      success: true,
      message: '资料更新成功',
      data: { user: user.toSafeJSON() }
    });
  } catch (err) {
    next(err);
  }
};

/* ========== 修改密码 ========== */
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    const valid = await user.comparePassword(oldPassword);
    if (!valid) {
      return res.status(400).json({ success: false, message: '原密码错误' });
    }

    user.password = newPassword;   // hook 会自动加密
    user.refreshToken = null;      // 修改密码后使旧 token 失效
    await user.save();

    // 颁发新 token
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功',
      data: { accessToken, refreshToken }
    });
  } catch (err) {
    next(err);
  }
};

/* ========== 登出 ========== */
exports.logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.json({ success: true, message: '已登出' });
  } catch (err) {
    next(err);
  }
};
