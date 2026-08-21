const bcrypt = require('bcryptjs');
const User = require('../../models/user.model');
const { generateOtp, sendOtpEmail } = require('../../utils/mailer');
const { loginSchema, registerSchema } = require('../../validates/account.validate');


// =============================================================
// ĐĂNG NHẬP
// =============================================================

exports.loginPage = (req, res) => {
    res.render('client/pages/login');
};


// =============================================================
// ĐĂNG NHẬP
// =============================================================

exports.login = async (req, res) => {
    try {

        // =============================================================
        // VALIDATE DỮ LIỆU
        // =============================================================

        const { error, value } = loginSchema.validate(req.body);

        if (error) {
            return res.render('client/pages/login', {
                error: error.details[0].message
            });
        }

        const { email, password } = value;


        // =============================================================
        // TÌM TÀI KHOẢN
        // =============================================================

        const user = await User.findOne({ email });

        if (!user) {
            return res.render('client/pages/login', {
                error: 'Email không tồn tại.'
            });
        }


        // =============================================================
        // KIỂM TRA MẬT KHẨU
        // =============================================================

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.render('client/pages/login', {
                error: 'Mật khẩu không đúng.'
            });
        }


        // =============================================================
        // LƯU THÔNG TIN USER VÀO SESSION
        // =============================================================

        req.session.user = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        };


        // =============================================================
        // ĐIỀU HƯỚNG THEO ROLE
        // =============================================================

        if (user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }

        return res.redirect('/');

    } catch (error) {

        console.log(error);

        return res.render('client/pages/login', {
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// ĐĂNG KÝ
// =============================================================

exports.registerPage = (req, res) => {
    res.render('client/pages/register');
};


exports.register = async (req, res) => {
    try {

        console.log('🔥🔥🔥 CONTROLLER REGISTER ĐÃ CHẠY');

        // =============================================================
        // DEBUG - KIỂM TRA DỮ LIỆU FORM
        // =============================================================

        console.log('=================================');
        console.log('REQ BODY REGISTER:');
        console.log(req.body);
        console.log('=================================');


        // =============================================================
        // VALIDATE DỮ LIỆU BẰNG JOI
        // =============================================================

        const { error, value } = registerSchema.validate(req.body);

        console.log('JOI ERROR:');
        console.log(error);

        console.log('JOI VALUE:');
        console.log(value);


        if (error) {
            return res.render('client/pages/register', {
                error: error.details[0].message
            });
        }


        const {
            fullName,
            email,
            phone,
            password,
            confirmPassword
        } = value;


        // =============================================================
        // KIỂM TRA MẬT KHẨU XÁC NHẬN
        // =============================================================

        if (password !== confirmPassword) {
            return res.render('client/pages/register', {
                error: 'Mật khẩu xác nhận không khớp.'
            });
        }


        // =============================================================
        // KIỂM TRA EMAIL ĐÃ TỒN TẠI
        // =============================================================

        const existingUser = await User.findOne({
            email
        });

        if (existingUser) {
            return res.render('client/pages/register', {
                error: 'Email đã được sử dụng.'
            });
        }


        // =============================================================
        // MÃ HÓA MẬT KHẨU
        // =============================================================

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // =============================================================
        // TẠO TÀI KHOẢN
        // =============================================================

        await User.create({
            fullName,
            email,
            phone,
            password: hashedPassword
        });


        // =============================================================
        // ĐĂNG KÝ THÀNH CÔNG
        // =============================================================

        return res.redirect('/login');


    } catch (error) {

        console.log(error);

        return res.render('client/pages/register', {
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// QUÊN MẬT KHẨU
// =============================================================

exports.forgotPasswordPage = (req, res) => {
    res.render('client/pages/forgot-password');
};


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.render('client/pages/forgot-password', {
                error: 'Email không tồn tại trong hệ thống.'
            });
        }

        // Tạo OTP
        const otp = generateOtp();

        // Lưu thông tin reset password vào session
        req.session.resetEmail = email;
        req.session.otpCode = otp;
        req.session.otpExpires = Date.now() + 5 * 60 * 1000;
        req.session.otpVerified = false;

        // Gửi OTP qua email
        await sendOtpEmail(email, otp);

        return res.redirect('/verify-otp');

    } catch (error) {
        console.log(error);

        return res.render('client/pages/forgot-password', {
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// XÁC MINH OTP
// =============================================================

exports.verifyOtpPage = (req, res) => {

    if (!req.session.resetEmail) {
        return res.redirect('/forgot-password');
    }

    res.render('client/pages/verify-otp', {
        email: req.session.resetEmail
    });
};


exports.verifyOtp = (req, res) => {
    const { otp } = req.body;

    // Không có session reset password
    if (
        !req.session.resetEmail ||
        !req.session.otpCode
    ) {
        return res.redirect('/forgot-password');
    }

    // Kiểm tra hết hạn
    if (Date.now() > req.session.otpExpires) {
        return res.render('client/pages/verify-otp', {
            email: req.session.resetEmail,
            error: 'Mã OTP đã hết hạn.'
        });
    }

    // Kiểm tra OTP
    if (otp !== req.session.otpCode) {
        return res.render('client/pages/verify-otp', {
            email: req.session.resetEmail,
            error: 'Mã OTP không đúng.'
        });
    }

    // OTP chính xác
    req.session.otpVerified = true;

    return res.redirect('/otp-password');
};


// =============================================================
// ĐẶT MẬT KHẨU MỚI SAU KHI XÁC MINH OTP
// =============================================================

exports.otpPasswordPage = (req, res) => {

    if (
        !req.session.resetEmail ||
        !req.session.otpVerified
    ) {
        return res.redirect('/forgot-password');
    }

    res.render('client/pages/otp-password', {
        email: req.session.resetEmail
    });
};


exports.otpPassword = async (req, res) => {
    try {

        if (
            !req.session.resetEmail ||
            !req.session.otpVerified
        ) {
            return res.redirect('/forgot-password');
        }

        const {
            password,
            confirmPassword
        } = req.body;

        // Kiểm tra xác nhận mật khẩu
        if (password !== confirmPassword) {
            return res.render('client/pages/otp-password', {
                email: req.session.resetEmail,
                error: 'Mật khẩu xác nhận không khớp.'
            });
        }

        // Kiểm tra độ dài
        if (password.length < 6) {
            return res.render('client/pages/otp-password', {
                email: req.session.resetEmail,
                error: 'Mật khẩu phải có ít nhất 6 ký tự.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Cập nhật password
        await User.findOneAndUpdate(
            {
                email: req.session.resetEmail
            },
            {
                password: hashedPassword
            }
        );

        // Xóa session tạm
        delete req.session.resetEmail;
        delete req.session.otpCode;
        delete req.session.otpExpires;
        delete req.session.otpVerified;

        return res.redirect('/login');

    } catch (error) {
        console.log(error);

        return res.render('client/pages/otp-password', {
            email: req.session.resetEmail,
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// ĐỔI MẬT KHẨU - CLIENT
// =============================================================

exports.changePasswordPage = (req, res) => {
    res.render('client/pages/change-password', {
        email: req.session.user.email
    });
};


// =============================================================
// ĐĂNG XUẤT
// =============================================================

exports.logout = (req, res) => {

    req.session.destroy((error) => {

        if (error) {
            console.log(error);
        }

        return res.redirect('/login');
    });
};


