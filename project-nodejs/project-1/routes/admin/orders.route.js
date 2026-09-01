// routes/admin/order.route.js

const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const orderController = require('../../controllers/admin/order.controller');

// =============================================================
// ORDER ROUTES
// =============================================================

// Danh sách đơn hàng (chưa xóa)
router.get('/', requireAdmin, orderController.index);

// 🆕 Thùng rác
router.get('/trash', requireAdmin, orderController.getTrash);

// 🆕 Hành động hàng loạt trên thùng rác
router.post('/trash/bulk', requireAdmin, orderController.bulkAction);

// 🆕 Khôi phục đơn hàng
router.post('/:id/restore', requireAdmin, orderController.restore);

// 🆕 Xóa vĩnh viễn
router.delete('/:id/force', requireAdmin, orderController.forceDelete);

// Chi tiết đơn hàng
router.get('/:id', requireAdmin, orderController.detail);

// Trang sửa đơn hàng
router.get('/:id/edit', requireAdmin, orderController.editPage);

// Cập nhật đơn hàng
router.post('/:id/edit', requireAdmin, orderController.edit);

// Cập nhật trạng thái
router.post('/:id/status', requireAdmin, orderController.updateStatus);

// Xóa đơn hàng (xóa mềm) – ĐÃ SỬA Ở CONTROLLER
router.delete('/:id', requireAdmin, orderController.delete);

// API lấy chi tiết
router.get('/api/:id', requireAdmin, orderController.getDetail);

module.exports = router;