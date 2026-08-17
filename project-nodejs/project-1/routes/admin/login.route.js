const router = require('express').Router();
const bcrypt = require('bcrypt'); // npm install bcrypt (nếu chưa có)
const User = require('../../models/user.model');

// =============================================================
// TRANG ĐĂNG NHẬP
// =============================================================

router.get('/login', (req, res) => {

    // Đã đăng nhập rồi thì vào thẳng dashboard, khỏi login lại
    if (req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }

    res.render('client/pages/login', {
        pageTitle: 'Đăng nhập quản trị'
    });

});

router.post('/login', async (req, res) => {

    try {

        const { username, password } = req.body;

        // login.pug ghi "Tên đăng nhập hoặc Email" -> tìm theo email
        // (user.model.js hiện không có field "username" riêng)
        const user = await User.findOne({ email: username });

        if (!user || user.role !== 'admin') {
            return res.render('client/pages/login', {
                pageTitle: 'Đăng nhập quản trị',
                error: 'Tài khoản không tồn tại hoặc không có quyền quản trị'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render('client/pages/login', {
                pageTitle: 'Đăng nhập quản trị',
                error: 'Sai mật khẩu'
            });
        }

        req.session.user = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        };

        // "Ghi nhớ đăng nhập" -> kéo dài thời gian sống của session cookie
        if (req.body.remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 ngày
        }

        res.redirect('/admin/dashboard');

    } catch (error) {

        console.log(error);
        res.render('client/pages/login', {
            pageTitle: 'Đăng nhập quản trị',
            error: 'Có lỗi xảy ra, vui lòng thử lại'
        });

    }

});

// =============================================================
// ĐĂNG XUẤT
// =============================================================

router.get('/logout', (req, res) => {

    req.session.destroy(() => {
        res.redirect('/admin/login');
    });

});

module.exports = router;
