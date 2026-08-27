const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const tourController = require('../../controllers/admin/tour.controller');

// =============================================================
// TOUR ROUTES
// =============================================================

// Danh sách tour
router.get('/', requireAdmin, tourController.index);

// Thùng rác
router.get('/trash', requireAdmin, tourController.trash);
router.post('/trash/bulk', requireAdmin, tourController.bulkTrashAction);

// Tạo tour mới
router.get('/new', requireAdmin, tourController.createPage);
router.post('/new', requireAdmin, tourController.upload.single('image'), tourController.create);

// Bulk action (danh sách chính)
router.post('/bulk', requireAdmin, tourController.bulkAction);

// Sửa tour
router.get('/:id/edit', requireAdmin, tourController.editPage);
router.post('/:id/edit', requireAdmin, tourController.upload.single('image'), tourController.edit);

// Xóa tour (chuyển vào thùng rác)
router.delete('/:id', requireAdmin, tourController.delete);

// Khôi phục tour
router.post('/:id/restore', requireAdmin, tourController.restore);

// Xóa vĩnh viễn
router.delete('/:id/force', requireAdmin, tourController.forceDelete);

module.exports = router;