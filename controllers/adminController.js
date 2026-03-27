const User = require('../models/User');
const { Op } = require('sequelize');

/* ========== 获取所有用户 ========== */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    const search = req.query.search || '';
    const where  = search
      ? { [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { email:    { [Op.like]: `%${search}%` } }
        ]}
      : {};

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id','username','email','role','status','lastLoginAt','createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        users: rows
      }
    });
  } catch (err) {
    next(err);
  }
};

/* ========== 获取单个用户 ========== */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password','refreshToken'] }
    });
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/* ========== 修改用户状态 ========== */
exports.setUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active','disabled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status 只能为 active 或 disabled' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: '不能修改自己的状态' });
    }
    user.status = status;
    if (status === 'disabled') user.refreshToken = null; // 强制登出
    await user.save();
    res.json({ success: true, message: `用户已${status === 'active' ? '启用' : '禁用'}` });
  } catch (err) {
    next(err);
  }
};

/* ========== 修改用户角色 ========== */
exports.setUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user','admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'role 只能为 user 或 admin' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: '不能修改自己的角色' });
    }
    user.role = role;
    await user.save();
    res.json({ success: true, message: `角色已更新为 ${role}` });
  } catch (err) {
    next(err);
  }
};

/* ========== 删除用户 ========== */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: '不能删除自己' });
    }
    await user.destroy();
    res.json({ success: true, message: '用户已删除' });
  } catch (err) {
    next(err);
  }
};
