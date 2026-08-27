// routes/admin/order.route.js

const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const orderController = require('../../controllers/admin/order.controller');

// =============================================================
// ORDER ROUTES
// =============================================================

// Danh sách đơn hàng
router.get('/', requireAdmin, orderController.index);

// Chi tiết đơn hàng
router.get('/:id', requireAdmin, orderController.detail);

// Trang sửa đơn hàng
router.get('/:id/edit', requireAdmin, orderController.editPage);

// Cập nhật đơn hàng
router.post('/:id/edit', requireAdmin, orderController.edit);

// Cập nhật trạng thái
router.post('/:id/status', requireAdmin, orderController.updateStatus);

// Xóa đơn hàng
router.delete('/:id', requireAdmin, orderController.delete);

// API lấy chi tiết
router.get('/api/:id', requireAdmin, orderController.getDetail);

module.exports = router;