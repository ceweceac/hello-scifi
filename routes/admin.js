const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有管理员路由都需要登录 + 管理员权限
router.use(authenticate, authorize('admin'));

router.get('/users',              ctrl.getAllUsers);
router.get('/users/:id',          ctrl.getUser);
router.put('/users/:id/status',   ctrl.setUserStatus);
router.put('/users/:id/role',     ctrl.setUserRole);
router.delete('/users/:id',       ctrl.deleteUser);

module.exports = router;
