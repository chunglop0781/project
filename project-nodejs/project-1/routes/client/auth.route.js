const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../../models/user.model');

// Trang đăng nhập
router.get('/login', (req, res) => {
    res.render('client/pages/login');
});

// Trang đăng ký
router.get('/register', (req, res) => {
    res.render('client/pages/register');
});

// Xử lý đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('client/pages/login', { error: 'Email không tồn tại.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('client/pages/login', { error: 'Mật khẩu không đúng.' });
        }

        // Lưu thông tin người dùng vào session
        // (KHÔNG lưu mật khẩu vào đây - chỉ lưu những gì cần để hiển thị / phân quyền)
        // Object này khớp với middleware `res.locals.currentUser = req.session.user`
        // trong index.js, và với `currentUser.fullName` / `currentUser.role`
        // đang được header.pug sử dụng.
        req.session.user = {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        };

        // Điều hướng khác nhau theo vai trò
        if (user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }

        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.render('client/pages/login', { error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
});

// Xử lý đăng ký
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('client/pages/register', { error: 'Mật khẩu xác nhận không khớp.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('client/pages/register', { error: 'Email đã được sử dụng.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullName,
            email,
            phone,
            password: hashedPassword
        });

        res.redirect('/login');
    } catch (error) {
        console.log(error);
        res.render('client/pages/register', { error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
});

// Xử lý đăng xuất
// Xoá toàn bộ session (giải phóng biến currentUser) -> header tự động
// quay lại hiển thị "Đăng nhập / Đăng ký" nhờ điều kiện if/else có sẵn
// trong header.pug.
router.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.log(error);
        }
        res.redirect('/login');
    });
});

module.exports = router;