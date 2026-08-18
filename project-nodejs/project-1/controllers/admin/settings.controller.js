const Website = require('../../models/website.model');

// =============================================================
// TRANG CÀI ĐẶT CHUNG (menu) - settings-general.pug
// =============================================================

exports.general = (req, res) => {
    res.render('admin/pages/settings/settings-general', { activeMenu: 'settings' });
};


// =============================================================
// TRANG THÔNG TIN WEBSITE - settings-website.pug
// =============================================================

exports.website = async (req, res) => {
    try {
        // Chỉ có 1 document cấu hình website (singleton) -> lấy cái đầu tiên
        const website = await Website.findOne();

        res.render('admin/pages/settings/settings-website', { website, activeMenu: 'settings' });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/settings/settings-website', { website: null, activeMenu: 'settings' });
    }
};

// Xử lý cập nhật thông tin website
exports.updateWebsite = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        const update = { name, phone, email, address };

        // req.files do middleware upload (multer) ở settings.route.js gắn vào
        if (req.files && req.files.logo && req.files.logo[0]) {
            update.logo = '/uploads/' + req.files.logo[0].filename;
        }
        if (req.files && req.files.favicon && req.files.favicon[0]) {
            update.favicon = '/uploads/' + req.files.favicon[0].filename;
        }

        // upsert: nếu chưa có document cấu hình nào thì tạo mới luôn
        await Website.findOneAndUpdate({}, update, { new: true, upsert: true, setDefaultsOnInsert: true });

        res.redirect('/admin/settings/website');

    } catch (error) {
        console.log(error);
        const website = await Website.findOne();
        res.render('admin/pages/settings/settings-website', { website, activeMenu: 'settings', error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
};
