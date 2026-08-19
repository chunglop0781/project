const router = require('express').Router();

const multer = require('multer');
const path = require('path');

const requireAdmin = require('../../middlewares/requireAdmin');

const settingsController =
    require('../../controllers/admin/settings.controller');


// =============================================================
// KIỂM TRA CONTROLLER
// =============================================================

console.log(
    'settingsController.accounts:',
    typeof settingsController.accounts
);

console.log(
    'settingsController.accountsCreate:',
    typeof settingsController.accountsCreate
);

console.log(
    'settingsController.accountsCreatePost:',
    typeof settingsController.accountsCreatePost
);

console.log(
    'settingsController.accountsEdit:',
    typeof settingsController.accountsEdit
);

console.log(
    'settingsController.accountsEditPost:',
    typeof settingsController.accountsEditPost
);

console.log(
    'settingsController.accountsDelete:',
    typeof settingsController.accountsDelete
);

console.log(
    'settingsController.roles:',
    typeof settingsController.roles
);

console.log(
    'settingsController.roleCreate:',
    typeof settingsController.roleCreate
);

console.log(
    'settingsController.roleCreatePost:',
    typeof settingsController.roleCreatePost
);

console.log(
    'settingsController.roleEdit:',
    typeof settingsController.roleEdit
);

console.log(
    'settingsController.roleEditPost:',
    typeof settingsController.roleEditPost
);


// =============================================================
// CẤU HÌNH UPLOAD
// =============================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },

    filename: (req, file, cb) => {

        const ext =
            path.extname(file.originalname);

        const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            ext;

        cb(null, uniqueName);
    }

});

const upload = multer({
    storage
});


// =============================================================
// CÀI ĐẶT CHUNG
// =============================================================

router.get(
    '/settings',
    requireAdmin,
    settingsController.general
);


// =============================================================
// THÔNG TIN WEBSITE
// =============================================================

router.get(
    '/settings/websiteInfo',
    requireAdmin,
    settingsController.website
);

router.post(
    '/settings/websiteInfo',
    requireAdmin,
    upload.fields([
        {
            name: 'logo',
            maxCount: 1
        },
        {
            name: 'favicon',
            maxCount: 1
        }
    ]),
    settingsController.updateWebsite
);


// =============================================================
// TÀI KHOẢN QUẢN TRỊ
// =============================================================


// -------------------------------------------------------------
// Danh sách
// -------------------------------------------------------------

router.get(
    '/settings/accounts',
    requireAdmin,
    settingsController.accounts
);


// -------------------------------------------------------------
// Trang tạo
// -------------------------------------------------------------

router.get(
    '/settings/accounts/create',
    requireAdmin,
    settingsController.accountsCreate
);


// -------------------------------------------------------------
// Xử lý tạo
// -------------------------------------------------------------

router.post(
    '/settings/accounts/create',
    requireAdmin,
    settingsController.accountsCreatePost
);


// -------------------------------------------------------------
// Trang sửa
// -------------------------------------------------------------

router.get(
    '/settings/accounts/edit/:id',
    requireAdmin,
    settingsController.accountsEdit
);


// -------------------------------------------------------------
// Xử lý sửa
// -------------------------------------------------------------

router.post(
    '/settings/accounts/edit/:id',
    requireAdmin,
    settingsController.accountsEditPost
);


// -------------------------------------------------------------
// Xóa
// -------------------------------------------------------------

router.post(
    '/settings/accounts/delete/:id',
    requireAdmin,
    settingsController.accountsDelete
);


// =============================================================
// NHÓM QUYỀN
// =============================================================


// -------------------------------------------------------------
// Danh sách
// -------------------------------------------------------------

router.get(
    '/settings/roles',
    requireAdmin,
    settingsController.roles
);


// -------------------------------------------------------------
// Trang tạo
// -------------------------------------------------------------

router.get(
    '/settings/roles/create',
    requireAdmin,
    settingsController.roleCreate
);


// -------------------------------------------------------------
// Xử lý tạo
// -------------------------------------------------------------

router.post(
    '/settings/roles/create',
    requireAdmin,
    settingsController.roleCreatePost
);


// -------------------------------------------------------------
// Trang sửa
// -------------------------------------------------------------

router.get(
    '/settings/roles/edit/:id',
    requireAdmin,
    settingsController.roleEdit
);


// -------------------------------------------------------------
// Xử lý sửa
// -------------------------------------------------------------

router.post(
    '/settings/roles/edit/:id',
    requireAdmin,
    settingsController.roleEditPost
);


module.exports = router;