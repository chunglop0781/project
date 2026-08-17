const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../../models/user.model');
const { generateOtp, sendOtpEmail } = require('../../utils/mailer');
const requireLogin = require('../../middlewares/requireLogin');

// Trang đăng nhập
router.get('/login', (req, res) => {
    res.render('client/pages/login');
});

// Trang đăng ký
router.get('/register', (req, res) => {
    res.render('client/pages/register');
});

// Trang quên mật khẩu
router.get('/forgot-password', (req, res) => {
    res.render('client/pages/forgot-password');
});

// Xử lý gửi mã OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('client/pages/forgot-password', { error: 'Email không tồn tại trong hệ thống.' });
        }

        const otp = generateOtp();

        // Lưu OTP vào session, hết hạn sau 5 phút
        req.session.resetEmail = email;
        req.session.otpCode = otp;
        req.session.otpExpires = Date.now() + 5 * 60 * 1000;
        req.session.otpVerified = false;

        await sendOtpEmail(email, otp);

        res.redirect('/verify-otp');
    } catch (error) {
        console.log(error);
        res.render('client/pages/forgot-password', { error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
});


// =============================================================
// XÁC MINH OTP
// =============================================================

router.get('/verify-otp', (req, res) => {
    if (!req.session.resetEmail) {
        return res.redirect('/forgot-password');
    }
    res.render('client/pages/verify-otp', { email: req.session.resetEmail });
});

router.post('/verify-otp', (req, res) => {
    const { otp } = req.body;

    if (!req.session.resetEmail || !req.session.otpCode) {
        return res.redirect('/forgot-password');
    }

    if (Date.now() > req.session.otpExpires) {
        return res.render('client/pages/verify-otp', {
            email: req.session.resetEmail,
            error: 'Mã OTP đã hết hạn.'
        });
    }

    if (otp !== req.session.otpCode) {
        return res.render('client/pages/verify-otp', {
            email: req.session.resetEmail,
            error: 'Mã OTP không đúng.'
        });
    }

    req.session.otpVerified = true;
    res.redirect('/otp-password');
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


// =============================================================
// ĐẶT MẬT KHẨU MỚI (SAU KHI XÁC MINH OTP)
// =============================================================

router.get('/otp-password', (req, res) => {
    if (!req.session.resetEmail || !req.session.otpVerified) {
        return res.redirect('/forgot-password');
    }
    res.render('client/pages/otp-password', { email: req.session.resetEmail });
});

router.post('/otp-password', async (req, res) => {
    try {
        if (!req.session.resetEmail || !req.session.otpVerified) {
            return res.redirect('/forgot-password');
        }

        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('client/pages/otp-password', { email: req.session.resetEmail, error: 'Mật khẩu xác nhận không khớp.' });
        }

        if (password.length < 6) {
            return res.render('client/pages/otp-password', { email: req.session.resetEmail, error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findOneAndUpdate({ email: req.session.resetEmail }, { password: hashedPassword });

        // Xoá sạch session tạm dùng cho quá trình quên mật khẩu
        delete req.session.resetEmail;
        delete req.session.otpCode;
        delete req.session.otpExpires;
        delete req.session.otpVerified;

        res.redirect('/login');
    } catch (error) {
        console.log(error);
        res.render('client/pages/otp-password', { email: req.session.resetEmail, error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
});


// =============================================================
// ĐỔI MẬT KHẨU (KHI ĐÃ ĐĂNG NHẬP - KHÁC LUỒNG QUÊN MẬT KHẨU)
// =============================================================

router.get('/change-password', requireLogin, (req, res) => {
    res.render('client/pages/change-password', { email: req.session.user.email });
});

router.post('/change-password', requireLogin, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.render('client/pages/change-password', {
                email: req.session.user.email,
                error: 'Mật khẩu hiện tại không đúng.'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('client/pages/change-password', {
                email: req.session.user.email,
                error: 'Mật khẩu xác nhận không khớp.'
            });
        }

        if (newPassword.length < 6) {
            return res.render('client/pages/change-password', {
                email: req.session.user.email,
                error: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.render('client/pages/change-password', {
            email: req.session.user.email,
            success: 'Đổi mật khẩu thành công.'
        });
    } catch (error) {
        console.log(error);
        res.render('client/pages/change-password', {
            email: req.session.user.email,
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
});


module.exports = router;
