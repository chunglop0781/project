const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const customerController = require('../../controllers/admin/customer.controller');

// =============================================================
// CUSTOMER ROUTES
// =============================================================

// Danh sách khách hàng (chỉ hiển thị chưa xóa)
router.get('/', requireAdmin, customerController.index);

// ✅ THÙNG RÁC KHÁCH HÀNG
// Lưu ý: các route tĩnh (/trash, /trash/bulk) PHẢI khai báo TRƯỚC route động
// "/:id", nếu không Express sẽ khớp "/:id" với id = "trash" trước, khiến
// route thùng rác không bao giờ được gọi tới.
router.get('/trash', requireAdmin, customerController.trash);

// ✅ Bulk action cho thùng rác
router.post('/trash/bulk', requireAdmin, customerController.bulkTrashAction);

// Bulk action cho danh sách chính (giữ nguyên path cũ để không phá view hiện tại)
router.post('/bulk-action', requireAdmin, customerController.bulkAction);

// ✅ Đổi trạng thái nhiều bản ghi (change-multi-patch) - route tĩnh, PHẢI đặt trước "/:id"
router.patch('/change-multi', requireAdmin, customerController.changeMultiPatch);

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

// ✅ XÓA MỀM (Chuyển vào thùng rác)
router.delete('/:id', requireAdmin, customerController.delete);

// ✅ KHÔI PHỤC TỪ THÙNG RÁC
router.post('/:id/restore', requireAdmin, customerController.restore);

// ✅ XÓA VĨNH VIỄN
router.delete('/:id/force', requireAdmin, customerController.forceDelete);

module.exports = router;