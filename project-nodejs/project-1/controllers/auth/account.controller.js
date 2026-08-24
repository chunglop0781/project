const bcrypt = require('bcryptjs');
const User = require('../../models/user.model');
const ForgotPassword = require('../../models/forgot-password.model');

const {
    sendOtpEmail,
    sendRegisterOtpEmail
} = require('../../helpers/mail.helper');

const {
    generateHelper
} = require('../../helpers/generate.helper');

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

        const {
            email,
            password
        } = value;


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
            maxAge: 24 * 60 * 60 * 1000,
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
// ĐĂNG NHẬP ADMIN
// =============================================================

exports.adminLogin = async (req, res) => {
    try {

        // =============================================================
        // LẤY DỮ LIỆU
        // =============================================================

        const {
            email,
            password,
            rememberPassword
        } = req.body;


        // =============================================================
        // KIỂM TRA EMAIL + PASSWORD
        // =============================================================

        if (!email || !password) {
            return res.json({
                code: 'error',
                message: 'Vui lòng nhập đầy đủ email và mật khẩu.'
            });
        }


        // =============================================================
        // TÌM TÀI KHOẢN ADMIN
        // =============================================================

        const existAccount = await User.findOne({
            email: email,
            role: 'admin'
        });

        if (!existAccount) {
            return res.json({
                code: 'error',
                message: 'Email không tồn tại trong hệ thống!'
            });
        }


        // =============================================================
        // KIỂM TRA MẬT KHẨU
        // =============================================================

        const isPasswordValid = await bcrypt.compare(
            password,
            existAccount.password
        );

        if (!isPasswordValid) {
            return res.json({
                code: 'error',
                message: 'Mật khẩu không đúng!'
            });
        }


        // =============================================================
        // KIỂM TRA JWT SECRET
        // =============================================================

        if (!process.env.JWT_SECRET) {

            console.error(
                '❌ JWT_SECRET chưa được cấu hình trong file .env'
            );

            return res.json({
                code: 'error',
                message: 'Lỗi cấu hình hệ thống. Vui lòng thử lại sau.'
            });
        }


        // =============================================================
        // TẠO JWT ADMIN
        // =============================================================

        const token = jwt.sign(
            {
                id: existAccount._id.toString(),
                email: existAccount.email,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: rememberPassword ? '30d' : '1d'
            }
        );


        // =============================================================
        // LƯU JWT VÀO COOKIE
        // =============================================================

        res.cookie('token', token, {
            maxAge: rememberPassword
                ? (30 * 24 * 60 * 60 * 1000)
                : (24 * 60 * 60 * 1000),

            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });


        // =============================================================
        // LƯU ADMIN VÀO SESSION
        // =============================================================

        req.session.user = {
            _id: existAccount._id,
            fullName: existAccount.fullName,
            email: existAccount.email,
            role: 'admin'
        };


        // =============================================================
        // ĐĂNG NHẬP THÀNH CÔNG
        // =============================================================

        return res.json({
            code: 'success',
            message: 'Đăng nhập admin thành công!',
            redirect: '/admin/dashboard'
        });

    } catch (error) {

        console.error('❌ ADMIN LOGIN ERROR:', error);

        return res.status(500).json({
            code: 'error',
            message: 'Có lỗi xảy ra, vui lòng thử lại.'
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
// ĐĂNG KÝ → GỬI OTP
// Chưa tạo User cho đến khi OTP chính xác
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

        const {
            error,
            value
        } = registerSchema.validate(req.body);

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
        // CHUẨN HÓA EMAIL
        // =============================================================

        const normalizedEmail = email
            .trim()
            .toLowerCase();


        // =============================================================
        // KIỂM TRA EMAIL ĐÃ TỒN TẠI
        // =============================================================

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.render('client/pages/register', {
                error: 'Email đã được sử dụng.'
            });
        }


        // =============================================================
        // SINH OTP ĐĂNG KÝ
        // =============================================================

        const registerOtp =
            generateHelper.generateRandomNumber(6);

        console.log(
            '🔐 REGISTER OTP:',
            registerOtp
        );


        // =============================================================
        // OTP HẾT HẠN SAU 5 PHÚT
        // =============================================================

        const registerOtpExpireAt =
            Date.now() + (5 * 60 * 1000);


        // =============================================================
        // LƯU THÔNG TIN ĐĂNG KÝ TẠM VÀO SESSION
        // =============================================================

        req.session.registerData = {
            fullName,
            email: normalizedEmail,
            phone,
            password,
            confirmPassword,
            otp: registerOtp,
            expireAt: registerOtpExpireAt
        };


        // =============================================================
        // GỬI OTP ĐĂNG KÝ QUA EMAIL
        // =============================================================

        await sendRegisterOtpEmail(
            normalizedEmail,
            registerOtp
        );


        // =============================================================
        // CHUYỂN SANG TRANG NHẬP OTP ĐĂNG KÝ
        // =============================================================

        return res.redirect('/verify-register-otp');

    } catch (error) {

        console.error(
            '❌ REGISTER ERROR:',
            error
        );

        return res.render('client/pages/register', {
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// XÁC MINH OTP ĐĂNG KÝ PAGE
// =============================================================

exports.verifyRegisterOtpPage = (req, res) => {

    // =============================================================
    // KIỂM TRA CÓ DỮ LIỆU ĐĂNG KÝ TẠM KHÔNG
    // =============================================================

    if (!req.session.registerData) {
        return res.redirect('/register');
    }


    // =============================================================
    // LẤY EMAIL
    // =============================================================

    const email =
        req.session.registerData.email;


    // =============================================================
    // HIỂN THỊ TRANG OTP
    // =============================================================

    return res.render(
        'client/pages/verify-register-otp',
        {
            email: email
        }
    );
};


// =============================================================
// XÁC MINH OTP ĐĂNG KÝ
// =============================================================

exports.verifyRegisterOtp = async (req, res) => {
    try {

        // =============================================================
        // KIỂM TRA SESSION
        // =============================================================

        if (!req.session.registerData) {
            return res.redirect('/register');
        }


        // =============================================================
        // LẤY OTP NGƯỜI DÙNG NHẬP
        // =============================================================

        const {
            otp
        } = req.body;


        const normalizedOtp = otp
            ? otp.toString().trim()
            : '';


        // =============================================================
        // LẤY DỮ LIỆU ĐĂNG KÝ
        // =============================================================

        const registerData =
            req.session.registerData;


        // =============================================================
        // KIỂM TRA OTP
        // =============================================================

        if (
            !registerData.otp ||
            registerData.otp !== normalizedOtp
        ) {

            // =============================================================
            // THÔNG BÁO OTP ĐĂNG KÝ KHÔNG CHÍNH XÁC
            // =============================================================

            console.log('❌ REGISTER OTP KHÔNG CHÍNH XÁC');
            console.log(
                '📧 EMAIL:',
                registerData.email
            );
            console.log(
                '🔢 OTP NGƯỜI DÙNG NHẬP:',
                normalizedOtp
            );

            return res.render(
                'client/pages/verify-register-otp',
                {
                    email: registerData.email,
                    error: 'Mã OTP không đúng.'
                }
            );
        }


        // =============================================================
        // KIỂM TRA OTP HẾT HẠN
        // =============================================================

        if (
            !registerData.expireAt ||
            registerData.expireAt < Date.now()
        ) {

            // XÓA SESSION ĐĂNG KÝ HẾT HẠN
            delete req.session.registerData;


            return res.render(
                'client/pages/verify-register-otp',
                {
                    email: registerData.email,
                    error: 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.'
                }
            );
        }


        // =============================================================
        // KIỂM TRA EMAIL LẦN CUỐI
        // =============================================================

        const existingUser = await User.findOne({
            email: registerData.email
        });


        if (existingUser) {

            delete req.session.registerData;

            return res.render(
                'client/pages/register',
                {
                    error: 'Email đã được sử dụng.'
                }
            );
        }


        // =============================================================
        // MÃ HÓA MẬT KHẨU
        // =============================================================

        const hashedPassword = await bcrypt.hash(
            registerData.password,
            10
        );


        // =============================================================
        // TẠO TÀI KHOẢN SAU KHI OTP ĐÚNG
        // =============================================================

        const newUser = await User.create({
            fullName: registerData.fullName,
            email: registerData.email,
            phone: registerData.phone,
            password: hashedPassword
        });


        // =============================================================
        // XÓA SESSION ĐĂNG KÝ TẠM
        // =============================================================

        delete req.session.registerData;


        // =============================================================
        // ĐĂNG KÝ THÀNH CÔNG
        // =============================================================

        console.log(
            '✅ REGISTER SUCCESS:',
            newUser.email
        );


        // =============================================================
        // CHUYỂN VỀ LOGIN
        // =============================================================

        return res.redirect('/login');

    } catch (error) {

        console.error(
            '❌ VERIFY REGISTER OTP ERROR:',
            error
        );

        return res.render(
            'client/pages/verify-register-otp',
            {
                email: req.session.registerData
                    ? req.session.registerData.email
                    : '',
                error: 'Có lỗi xảy ra, vui lòng thử lại.'
            }
        );
    }
};


// =============================================================
// QUÊN MẬT KHẨU PAGE
// =============================================================

exports.forgotPasswordPage = (req, res) => {
    res.render('client/pages/forgot-password');
};


// =============================================================
// QUÊN MẬT KHẨU - GỬI OTP
// =============================================================

exports.forgotPasswordPost = async (req, res) => {
    try {

        // =============================================================
        // LẤY EMAIL
        // =============================================================

        const {
            email
        } = req.body;

        console.log('📧 FORGOT PASSWORD EMAIL:', email);


        // =============================================================
        // KIỂM TRA EMAIL
        // =============================================================

        if (!email) {
            return res.json({
                code: 'error',
                message: 'Vui lòng nhập email.'
            });
        }


        // =============================================================
        // CHUẨN HÓA EMAIL
        // =============================================================

        const normalizedEmail = email
            .trim()
            .toLowerCase();


        // =============================================================
        // KIỂM TRA EMAIL CÓ TỒN TẠI TRONG USER KHÔNG
        // =============================================================

        const existAccount = await User.findOne({
            email: normalizedEmail
        });

        if (!existAccount) {
            return res.json({
                code: 'error',
                message: 'Email không tồn tại trong hệ thống!'
            });
        }


        // =============================================================
        // KIỂM TRA EMAIL ĐÃ CÓ YÊU CẦU QUÊN MẬT KHẨU CHƯA
        // =============================================================

        const existEmailInForgotPassword =
            await ForgotPassword.findOne({
                email: normalizedEmail
            });

        if (existEmailInForgotPassword) {
            return res.json({
                code: 'error',
                message: 'Vui lòng gửi lại yêu cầu sau 5 phút!'
            });
        }


        // =============================================================
        // TẠO MÃ OTP
        // =============================================================

        const otp =
            generateHelper.generateRandomNumber(6);

        console.log('🔐 OTP:', otp);


        // =============================================================
        // THỜI GIAN HẾT HẠN OTP
        // 5 PHÚT
        // =============================================================

        const expireAt =
            new Date(Date.now() + 5 * 60 * 1000);


        // =============================================================
        // TẠO BẢN GHI FORGOT PASSWORD
        // =============================================================

        const newRecord = new ForgotPassword({
            email: normalizedEmail,
            otp: otp,
            expireAt: expireAt
        });


        // =============================================================
        // LƯU VÀO DATABASE
        // =============================================================

        await newRecord.save();


        // =============================================================
        // LƯU EMAIL VÀO SESSION
        // =============================================================

        req.session.resetEmail = normalizedEmail;
        req.session.otpVerified = false;


        // =============================================================
        // GỬI OTP QUA EMAIL
        // =============================================================

        await sendOtpEmail(
            normalizedEmail,
            otp
        );


        // =============================================================
        // TRẢ VỀ JSON
        // =============================================================

        return res.json({
            code: 'success',
            message: 'Đã gửi mã OTP qua email.',
            redirect: '/verify-otp'
        });

    } catch (error) {

        console.error(
            '❌ FORGOT PASSWORD POST ERROR:',
            error
        );

        return res.status(500).json({
            code: 'error',
            message: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};


// =============================================================
// QUÊN MẬT KHẨU
// =============================================================

exports.forgotPassword = async (req, res) => {
    try {

        const {
            email
        } = req.body;


        // =============================================================
        // CHUẨN HÓA EMAIL
        // =============================================================

        const normalizedEmail = email
            ? email.trim().toLowerCase()
            : '';


        // =============================================================
        // KIỂM TRA EMAIL
        // =============================================================

        if (!normalizedEmail) {
            return res.render('client/pages/forgot-password', {
                error: 'Vui lòng nhập email.'
            });
        }


        // =============================================================
        // KIỂM TRA TÀI KHOẢN
        // =============================================================

        const existAccount = await User.findOne({
            email: normalizedEmail
        });

        if (!existAccount) {
            return res.render('client/pages/forgot-password', {
                error: 'Email không tồn tại trong hệ thống!'
            });
        }


        // =============================================================
        // KIỂM TRA EMAIL ĐÃ CÓ YÊU CẦU QUÊN MẬT KHẨU CHƯA
        // =============================================================

        const existEmailInForgotPassword =
            await ForgotPassword.findOne({
                email: normalizedEmail
            });

        if (existEmailInForgotPassword) {
            return res.render('client/pages/forgot-password', {
                error: 'Vui lòng gửi lại yêu cầu sau 5 phút!'
            });
        }


        // =============================================================
        // TẠO MÃ OTP
        // =============================================================

        const otp =
            generateHelper.generateRandomNumber(6);

        console.log('🔐 OTP:', otp);


        // =============================================================
        // THỜI GIAN HẾT HẠN OTP
        // 5 PHÚT
        // =============================================================

        const expireAt =
            new Date(Date.now() + 5 * 60 * 1000);


        // =============================================================
        // TẠO BẢN GHI FORGOT PASSWORD
        // =============================================================

        const newRecord = new ForgotPassword({
            email: normalizedEmail,
            otp: otp,
            expireAt: expireAt
        });


        // =============================================================
        // LƯU VÀO DATABASE
        // =============================================================

        await newRecord.save();


        // =============================================================
        // LƯU EMAIL VÀO SESSION
        // =============================================================

        req.session.resetEmail = normalizedEmail;
        req.session.otpVerified = false;


        // =============================================================
        // GỬI OTP QUA EMAIL
        // =============================================================

        await sendOtpEmail(
            normalizedEmail,
            otp
        );


        // =============================================================
        // CHUYỂN SANG TRANG XÁC MINH OTP
        // =============================================================

        return res.redirect('/verify-otp');

    } catch (error) {

        console.error(
            '❌ FORGOT PASSWORD ERROR:',
            error
        );

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

    return res.render('client/pages/verify-otp', {
        email: req.session.resetEmail
    });
};


// =============================================================
// XÁC MINH OTP
// =============================================================

exports.verifyOtp = async (req, res) => {
    try {

        const {
            otp
        } = req.body;


        // =============================================================
        // KIỂM TRA SESSION
        // =============================================================

        if (!req.session.resetEmail) {
            return res.redirect('/forgot-password');
        }


        // =============================================================
        // CHUẨN HÓA OTP
        // =============================================================

        const normalizedOtp = otp
            ? otp.toString().trim()
            : '';


        // =============================================================
        // TÌM OTP TRONG DATABASE
        // =============================================================

        const otpRecord = await ForgotPassword.findOne({
            email: req.session.resetEmail,
            otp: normalizedOtp
        });


        // =============================================================
        // OTP KHÔNG TỒN TẠI / ĐÃ HẾT HẠN
        // =============================================================

        if (!otpRecord) {

            // =============================================================
            // THÔNG BÁO OTP QUÊN MẬT KHẨU KHÔNG CHÍNH XÁC
            // =============================================================

            console.log('❌ FORGOT PASSWORD OTP KHÔNG CHÍNH XÁC');
            console.log(
                '📧 EMAIL:',
                req.session.resetEmail
            );
            console.log(
                '🔢 OTP NGƯỜI DÙNG NHẬP:',
                normalizedOtp
            );

            return res.render('client/pages/verify-otp', {
                email: req.session.resetEmail,
                error: 'Mã OTP không đúng hoặc đã hết hạn.'
            });
        }


        // =============================================================
        // KIỂM TRA OTP CÒN HẠN KHÔNG
        // =============================================================

        if (
            !otpRecord.expireAt ||
            otpRecord.expireAt.getTime() < Date.now()
        ) {

            console.log('⏰ FORGOT PASSWORD OTP ĐÃ HẾT HẠN');
            console.log(
                '📧 EMAIL:',
                req.session.resetEmail
            );

            await ForgotPassword.deleteOne({
                _id: otpRecord._id
            });

            return res.render('client/pages/verify-otp', {
                email: req.session.resetEmail,
                error: 'Mã OTP đã hết hạn.'
            });
        }


        // =============================================================
        // OTP CHÍNH XÁC
        // =============================================================

        console.log('✅ FORGOT PASSWORD OTP CHÍNH XÁC');
        console.log(
            '📧 EMAIL:',
            req.session.resetEmail
        );


        req.session.otpVerified = true;


        // =============================================================
        // XÓA OTP KHỎI DATABASE
        // Không cho sử dụng lại OTP
        // =============================================================

        await ForgotPassword.deleteOne({
            _id: otpRecord._id
        });


        // =============================================================
        // CHUYỂN SANG TRANG ĐẶT MẬT KHẨU
        // =============================================================

        return res.redirect('/otp-password');

    } catch (error) {

        console.error(
            '❌ VERIFY OTP ERROR:',
            error
        );

        return res.render('client/pages/verify-otp', {
            email: req.session.resetEmail,
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
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

    return res.render('client/pages/otp-password', {
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

        if (
            !password ||
            password.length < 6
        ) {

            return res.render('client/pages/otp-password', {
                email: req.session.resetEmail,
                error: 'Mật khẩu phải có ít nhất 6 ký tự.'
            });
        }


        // =============================================================
        // HASH PASSWORD BẰNG BCRYPTJS
        // =============================================================

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // =============================================================
        // CẬP NHẬT PASSWORD
        // =============================================================

        const updatedUser = await User.findOneAndUpdate(
            {
                email: req.session.resetEmail
            },
            {
                password: hashedPassword
            }
        );


        // =============================================================
        // KIỂM TRA USER
        // =============================================================

        if (!updatedUser) {

            return res.render('client/pages/otp-password', {
                email: req.session.resetEmail,
                error: 'Không tìm thấy tài khoản.'
            });
        }


        // =============================================================
        // XÓA OTP CÒN LẠI CỦA EMAIL
        // =============================================================

        await ForgotPassword.deleteMany({
            email: req.session.resetEmail
        });


        // =============================================================
        // XÓA SESSION TẠM
        // =============================================================

        delete req.session.resetEmail;
        delete req.session.otpVerified;


        // =============================================================
        // CHUYỂN VỀ LOGIN
        // =============================================================

        return res.redirect('/login');

    } catch (error) {

        console.error(
            '❌ OTP PASSWORD ERROR:',
            error
        );

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
            console.error(
                '❌ LOGOUT ERROR:',
                error
            );
        }

        return res.redirect('/login');
    });
};