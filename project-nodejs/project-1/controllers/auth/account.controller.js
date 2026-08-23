const bcrypt = require('bcryptjs');
const User = require('../../models/user.model');
const { generateOtp, sendOtpEmail } = require('../../utils/mailer');
const {
    loginSchema,
    registerSchema
} = require('../../validates/account.validate');
const jwt = require('jsonwebtoken');


// =============================================================
// ĐĂNG NHẬP PAGE
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

        const user = await User.findOne({
            email: email
        });

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
        // KIỂM TRA JWT SECRET
        // =============================================================

        if (!process.env.JWT_SECRET) {

            console.error(
                '❌ JWT_SECRET chưa được cấu hình trong file .env'
            );

            return res.render('client/pages/login', {
                error: 'Lỗi cấu hình hệ thống. Vui lòng thử lại sau.'
            });
        }


        // =============================================================
        // TẠO JWT
        // =============================================================

        const token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );


        // =============================================================
        // LƯU JWT VÀO COOKIE
        // =============================================================

        res.cookie('token', token, {
            maxAge: 24 * 60 * 60 * 1000, // 1 ngày
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });


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

        console.error('❌ LOGIN ERROR:', error);

        return res.render('client/pages/login', {
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// ĐĂNG KÝ PAGE
// =============================================================

exports.registerPage = (req, res) => {
    res.render('client/pages/register');
};


// =============================================================
// ĐĂNG KÝ
// =============================================================

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
            email: email
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

        console.error('❌ REGISTER ERROR:', error);

        return res.render('client/pages/register', {
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// QUÊN MẬT KHẨU PAGE
// =============================================================

exports.forgotPasswordPage = (req, res) => {
    res.render('client/pages/forgot-password');
};


// =============================================================
// QUÊN MẬT KHẨU
// =============================================================

exports.forgotPassword = async (req, res) => {
    try {

        const { email } = req.body;

        const user = await User.findOne({
            email: email
        });

        if (!user) {
            return res.render('client/pages/forgot-password', {
                error: 'Email không tồn tại trong hệ thống.'
            });
        }


        // =============================================================
        // TẠO OTP
        // =============================================================

        const otp = generateOtp();


        // =============================================================
        // LƯU OTP VÀO SESSION
        // =============================================================

        req.session.resetEmail = email;
        req.session.otpCode = otp;
        req.session.otpExpires = Date.now() + 5 * 60 * 1000;
        req.session.otpVerified = false;


        // =============================================================
        // GỬI OTP QUA EMAIL
        // =============================================================

        await sendOtpEmail(email, otp);


        // =============================================================
        // CHUYỂN SANG TRANG XÁC MINH OTP
        // =============================================================

        return res.redirect('/verify-otp');

    } catch (error) {

        console.error('❌ FORGOT PASSWORD ERROR:', error);

        return res.render('client/pages/forgot-password', {
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// XÁC MINH OTP PAGE
// =============================================================

exports.verifyOtpPage = (req, res) => {

    if (!req.session.resetEmail) {
        return res.redirect('/forgot-password');
    }

    res.render('client/pages/verify-otp', {
        email: req.session.resetEmail
    });
};


// =============================================================
// XÁC MINH OTP
// =============================================================

exports.verifyOtp = (req, res) => {

    const { otp } = req.body;


    // =============================================================
    // KIỂM TRA SESSION
    // =============================================================

    if (
        !req.session.resetEmail ||
        !req.session.otpCode
    ) {
        return res.redirect('/forgot-password');
    }


    // =============================================================
    // KIỂM TRA HẾT HẠN
    // =============================================================

    if (Date.now() > req.session.otpExpires) {

        return res.render('client/pages/verify-otp', {
            email: req.session.resetEmail,
            error: 'Mã OTP đã hết hạn.'
        });
    }


    // =============================================================
    // KIỂM TRA OTP
    // =============================================================

    if (otp !== req.session.otpCode) {

        return res.render('client/pages/verify-otp', {
            email: req.session.resetEmail,
            error: 'Mã OTP không đúng.'
        });
    }


    // =============================================================
    // OTP CHÍNH XÁC
    // =============================================================

    req.session.otpVerified = true;

    return res.redirect('/otp-password');
};


// =============================================================
// ĐẶT MẬT KHẨU MỚI PAGE
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


// =============================================================
// ĐẶT MẬT KHẨU MỚI
// =============================================================

exports.otpPassword = async (req, res) => {
    try {

        // =============================================================
        // KIỂM TRA SESSION
        // =============================================================

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


        // =============================================================
        // KIỂM TRA MẬT KHẨU XÁC NHẬN
        // =============================================================

        if (password !== confirmPassword) {

            return res.render('client/pages/otp-password', {
                email: req.session.resetEmail,
                error: 'Mật khẩu xác nhận không khớp.'
            });
        }


        // =============================================================
        // KIỂM TRA ĐỘ DÀI MẬT KHẨU
        // =============================================================

        if (!password || password.length < 6) {

            return res.render('client/pages/otp-password', {
                email: req.session.resetEmail,
                error: 'Mật khẩu phải có ít nhất 6 ký tự.'
            });
        }


        // =============================================================
        // HASH PASSWORD
        // =============================================================

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // =============================================================
        // CẬP NHẬT PASSWORD
        // =============================================================

        await User.findOneAndUpdate(
            {
                email: req.session.resetEmail
            },
            {
                password: hashedPassword
            }
        );


        // =============================================================
        // XÓA SESSION TẠM
        // =============================================================

        delete req.session.resetEmail;
        delete req.session.otpCode;
        delete req.session.otpExpires;
        delete req.session.otpVerified;


        // =============================================================
        // CHUYỂN VỀ LOGIN
        // =============================================================

        return res.redirect('/login');

    } catch (error) {

        console.error('❌ OTP PASSWORD ERROR:', error);

        return res.render('client/pages/otp-password', {
            email: req.session.resetEmail,
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// ĐỔI MẬT KHẨU - CLIENT PAGE
// =============================================================

exports.changePasswordPage = (req, res) => {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    return res.render('client/pages/change-password', {
        email: req.session.user.email
    });
};


// =============================================================
// ĐĂNG XUẤT
// =============================================================

exports.logout = (req, res) => {

    // =============================================================
    // XÓA JWT COOKIE
    // =============================================================

    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
    });


    // =============================================================
    // XÓA SESSION
    // =============================================================

    req.session.destroy((error) => {

        if (error) {
            console.error('❌ LOGOUT ERROR:', error);
        }

        return res.redirect('/login');
    });
};