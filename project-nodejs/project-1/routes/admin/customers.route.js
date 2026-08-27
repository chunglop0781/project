const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const customerController = require('../../controllers/admin/customer.controller');

// =============================================================
// CUSTOMER ROUTES
// =============================================================

// Danh sách khách hàng
router.get('/', requireAdmin, customerController.index);

// Chi tiết khách hàng
router.get('/:id', requireAdmin, customerController.detail);

// Sửa khách hàng
router.get('/:id/edit', requireAdmin, customerController.editPage);

// Cập nhật khách hàng - CÓ UPLOAD ẢNH
router.post('/:id/edit', 
    requireAdmin, 
    customerController.upload.single('avatar'), 
    customerController.edit
);

// Xóa khách hàng
router.delete('/:id', requireAdmin, customerController.delete);

// Bulk action
router.post('/bulk-action', requireAdmin, customerController.bulkAction);

module.exports = router;