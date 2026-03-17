const { body, validationResult } = require('express-validator');

/* ---------- 公共处理 ---------- */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map(e => e.msg).join('；');
    return res.status(400).json({ success: false, message: msg });
  }
  next();
}

/* ---------- 注册规则 ---------- */
const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 2, max: 30 }).withMessage('用户名长度 2-30 个字符')
    .matches(/^[a-zA-Z0-9\u4e00-\u9fa5_]+$/).withMessage('用户名只能包含字母、数字、中文和下划线'),
  body('email')
    .trim()
    .isEmail().withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 50 }).withMessage('密码长度 6-50 个字符')
    .matches(/(?=.*[a-zA-Z])(?=.*\d)/).withMessage('密码需包含字母和数字'),
  handleValidation
];

/* ---------- 登录规则 ---------- */
const loginRules = [
  body('email')
    .trim()
    .isEmail().withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('请输入密码'),
  handleValidation
];

/* ---------- 修改密码规则 ---------- */
const changePasswordRules = [
  body('oldPassword')
    .notEmpty().withMessage('请输入原密码'),
  body('newPassword')
    .isLength({ min: 6, max: 50 }).withMessage('新密码长度 6-50 个字符')
    .matches(/(?=.*[a-zA-Z])(?=.*\d)/).withMessage('新密码需包含字母和数字'),
  handleValidation
];

/* ---------- 修改资料规则 ---------- */
const updateProfileRules = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 }).withMessage('用户名长度 2-30 个字符')
    .matches(/^[a-zA-Z0-9\u4e00-\u9fa5_]+$/).withMessage('用户名只能包含字母、数字、中文和下划线'),
  body('avatar')
    .optional()
    .isURL().withMessage('头像必须是有效的 URL'),
  handleValidation
];

module.exports = { registerRules, loginRules, changePasswordRules, updateProfileRules };
