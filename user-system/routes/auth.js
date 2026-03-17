const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, changePasswordRules, updateProfileRules } = require('../middleware/validator');

// 公开路由
router.post('/register', registerLimiter, registerRules, ctrl.register);
router.post('/login',    loginLimiter,    loginRules,    ctrl.login);
router.post('/refresh',  ctrl.refreshToken);

// 需要认证的路由
router.get('/me',              authenticate, ctrl.getMe);
router.put('/profile',         authenticate, updateProfileRules, ctrl.updateProfile);
router.put('/change-password', authenticate, changePasswordRules, ctrl.changePassword);
router.post('/logout',         authenticate, ctrl.logout);

module.exports = router;
