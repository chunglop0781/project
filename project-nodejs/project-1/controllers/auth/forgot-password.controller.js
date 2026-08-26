// =============================================================
// FORGOT PASSWORD CONTROLLER
// =============================================================

const bcrypt = require('bcryptjs');

const User = require('../../models/user.model');
const ForgotPassword = require('../../models/forgot-password.model');

const { sendOtpEmail } = require('../../helpers/mail.helper');
const { generateHelper } = require('../../helpers/generate.helper');

// =============================================================
// CHECK IF REQUEST IS AJAX
// =============================================================

const isAjaxRequest = (req) => {
    return req.xhr || 
           req.headers.accept?.includes('application/json') ||
           req.headers['content-type']?.includes('application/json');
};

// =============================================================
// TRANG QUÊN MẬT KHẨU
// =============================================================

exports.forgotPasswordPage = (req, res) => {
    return res.render('client/pages/forgot-password', {
        pageTitle: 'Quên Mật Khẩu',
        error: null,
        success: null,
        validationErrors: [],
        formData: {}
    });
};

// =============================================================
// GỬI OTP QUÊN MẬT KHẨU - HỖ TRỢ CẢ HTML VÀ JSON
// =============================================================

exports.forgotPassword = async (req, res) => {
    try {
        const isAjax = isAjaxRequest(req);
        const { email } = req.body || {};
        const normalizedEmail = email ? email.trim().toLowerCase() : '';

        if (!normalizedEmail) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Vui lòng nhập email.'
                });
            }
            
            return res.render('client/pages/forgot-password', {
                pageTitle: 'Quên Mật Khẩu',
                error: 'Vui lòng nhập email.',
                success: null,
                validationErrors: [],
                formData: {}
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Email không đúng định dạng.'
                });
            }
            
            return res.render('client/pages/forgot-password', {
                pageTitle: 'Quên Mật Khẩu',
                error: 'Email không đúng định dạng.',
                success: null,
                validationErrors: [],
                formData: { email: normalizedEmail }
            });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            if (isAjax) {
                return res.status(404).json({
                    code: 'error',
                    message: 'Email không tồn tại trong hệ thống.'
                });
            }
            
            return res.render('client/pages/forgot-password', {
                pageTitle: 'Quên Mật Khẩu',
                error: 'Email không tồn tại trong hệ thống.',
                success: null,
                validationErrors: [],
                formData: { email: normalizedEmail }
            });
        }

        // Xóa OTP cũ
        await ForgotPassword.deleteMany({ email: normalizedEmail });

        // Tạo OTP
        const otp = generateHelper.generateRandomNumber(6);
        const expireAt = new Date(Date.now() + 5 * 60 * 1000);

        // Lưu OTP
        await ForgotPassword.create({
            email: normalizedEmail,
            otp: otp.toString(),
            expireAt: expireAt
        });

        // Gửi email
        await sendOtpEmail(normalizedEmail, otp);

        // Lưu session
        req.session.passwordReset = {
            email: normalizedEmail,
            otpVerified: false,
            otpExpireAt: expireAt
        };

        if (isAjax) {
            return res.json({
                code: 'success',
                redirect: '/verify-otp'
            });
        }

        return res.redirect('/verify-otp');

    } catch (error) {
        console.error('❌ FORGOT PASSWORD ERROR:', error);
        
        if (isAjaxRequest(req)) {
            return res.status(500).json({
                code: 'error',
                message: 'Không thể gửi OTP. Vui lòng thử lại.'
            });
        }
        
        return res.render('client/pages/forgot-password', {
            pageTitle: 'Quên Mật Khẩu',
            error: 'Không thể gửi OTP. Vui lòng thử lại.',
            success: null,
            validationErrors: [],
            formData: { email: req.body?.email || '' }
        });
    }
};

// =============================================================
// TRANG VERIFY OTP
// =============================================================

exports.verifyOtpPage = (req, res) => {
    if (!req.session.passwordReset || !req.session.passwordReset.email) {
        return res.redirect('/forgot-password');
    }

    return res.render('client/pages/verify-otp', {
        pageTitle: 'Xác Minh OTP',
        email: req.session.passwordReset.email,
        error: null,
        success: null
    });
};

// =============================================================
// VERIFY OTP - HỖ TRỢ CẢ HTML VÀ JSON
// =============================================================

exports.verifyOtp = async (req, res) => {
    try {
        const isAjax = isAjaxRequest(req);
        
        if (!req.session.passwordReset || !req.session.passwordReset.email) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Không tìm thấy email. Vui lòng thử lại.'
                });
            }
            return res.redirect('/forgot-password');
        }

        const { otp } = req.body || {};
        const normalizedOtp = otp ? otp.toString().trim() : '';

        if (!normalizedOtp) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Vui lòng nhập mã OTP.'
                });
            }
            
            return res.render('client/pages/verify-otp', {
                pageTitle: 'Xác Minh OTP',
                email: req.session.passwordReset.email,
                error: 'Vui lòng nhập mã OTP.'
            });
        }

        const otpRecord = await ForgotPassword.findOne({
            email: req.session.passwordReset.email,
            otp: normalizedOtp
        });

        if (!otpRecord) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Mã OTP không đúng hoặc đã hết hạn.'
                });
            }
            
            return res.render('client/pages/verify-otp', {
                pageTitle: 'Xác Minh OTP',
                email: req.session.passwordReset.email,
                error: 'Mã OTP không đúng hoặc đã hết hạn.'
            });
        }

        if (!otpRecord.expireAt || otpRecord.expireAt.getTime() < Date.now()) {
            await ForgotPassword.deleteOne({ _id: otpRecord._id });

            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Mã OTP đã hết hạn.'
                });
            }
            
            return res.render('client/pages/verify-otp', {
                pageTitle: 'Xác Minh OTP',
                email: req.session.passwordReset.email,
                error: 'Mã OTP đã hết hạn.'
            });
        }

        // Cập nhật session
        req.session.passwordReset.otpVerified = true;

        // Xóa OTP sau khi xác thực
        await ForgotPassword.deleteOne({ _id: otpRecord._id });

        if (isAjax) {
            return res.json({
                code: 'success',
                redirect: '/otp-password'
            });
        }

        return res.redirect('/otp-password');

    } catch (error) {
        console.error('❌ VERIFY OTP ERROR:', error);
        
        if (isAjaxRequest(req)) {
            return res.status(500).json({
                code: 'error',
                message: 'Có lỗi xảy ra, vui lòng thử lại.'
            });
        }
        
        return res.render('client/pages/verify-otp', {
            pageTitle: 'Xác Minh OTP',
            email: req.session.passwordReset?.email || '',
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};

// =============================================================
// TRANG OTP PASSWORD
// =============================================================

exports.otpPasswordPage = (req, res) => {
    if (!req.session.passwordReset || 
        !req.session.passwordReset.email || 
        !req.session.passwordReset.otpVerified) {
        return res.redirect('/forgot-password');
    }

    return res.render('client/pages/otp-password', {
        pageTitle: 'Đặt Mật Khẩu Mới',
        email: req.session.passwordReset.email,
        error: null,
        success: null
    });
};

// =============================================================
// ĐỔI PASSWORD SAU OTP - HỖ TRỢ CẢ HTML VÀ JSON
// =============================================================

exports.otpPassword = async (req, res) => {
    try {
        const isAjax = isAjaxRequest(req);
        
        if (!req.session.passwordReset || 
            !req.session.passwordReset.email || 
            !req.session.passwordReset.otpVerified) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Không tìm thấy email. Vui lòng thử lại.'
                });
            }
            return res.redirect('/forgot-password');
        }

        const { password, confirmPassword } = req.body || {};

        if (!password) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Vui lòng nhập mật khẩu mới.'
                });
            }
            
            return res.render('client/pages/otp-password', {
                pageTitle: 'Đặt Mật Khẩu Mới',
                email: req.session.passwordReset.email,
                error: 'Vui lòng nhập mật khẩu mới.'
            });
        }

        if (password.length < 6) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Mật khẩu phải có ít nhất 6 ký tự.'
                });
            }
            
            return res.render('client/pages/otp-password', {
                pageTitle: 'Đặt Mật Khẩu Mới',
                email: req.session.passwordReset.email,
                error: 'Mật khẩu phải có ít nhất 6 ký tự.'
            });
        }

        if (password !== confirmPassword) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: 'Mật khẩu xác nhận không khớp.'
                });
            }
            
            return res.render('client/pages/otp-password', {
                pageTitle: 'Đặt Mật Khẩu Mới',
                email: req.session.passwordReset.email,
                error: 'Mật khẩu xác nhận không khớp.'
            });
        }

        const user = await User.findOne({ email: req.session.passwordReset.email });

        if (!user) {
            if (isAjax) {
                return res.status(404).json({
                    code: 'error',
                    message: 'Không tìm thấy tài khoản.'
                });
            }
            
            return res.render('client/pages/otp-password', {
                pageTitle: 'Đặt Mật Khẩu Mới',
                email: req.session.passwordReset.email,
                error: 'Không tìm thấy tài khoản.'
            });
        }

        // Cập nhật password
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
            { email: req.session.passwordReset.email },
            { password: hashedPassword }
        );

        // Xóa OTP cũ
        await ForgotPassword.deleteMany({ email: req.session.passwordReset.email });

        // Xóa session
        const email = req.session.passwordReset.email;
        delete req.session.passwordReset;

        if (isAjax) {
            return res.json({
                code: 'success',
                redirect: '/login',
                message: 'Đổi mật khẩu thành công!'
            });
        }

        req.session.success = 'Đổi mật khẩu thành công! Vui lòng đăng nhập.';
        return res.redirect('/login');

    } catch (error) {
        console.error('❌ OTP PASSWORD ERROR:', error);
        
        if (isAjaxRequest(req)) {
            return res.status(500).json({
                code: 'error',
                message: 'Có lỗi xảy ra, vui lòng thử lại.'
            });
        }
        
        return res.render('client/pages/otp-password', {
            pageTitle: 'Đặt Mật Khẩu Mới',
            email: req.session.passwordReset?.email || '',
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};

// =============================================================
// RESEND OTP
// =============================================================

exports.resendOtp = async (req, res) => {
    try {
        if (!req.session.passwordReset || !req.session.passwordReset.email) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy email. Vui lòng thử lại.'
            });
        }

        const email = req.session.passwordReset.email;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email không tồn tại.'
            });
        }

        await ForgotPassword.deleteMany({ email });

        const otp = generateHelper.generateRandomNumber(6);
        const expireAt = new Date(Date.now() + 5 * 60 * 1000);

        await ForgotPassword.create({
            email,
            otp: otp.toString(),
            expireAt
        });

        await sendOtpEmail(email, otp);

        req.session.passwordReset.otpVerified = false;
        req.session.passwordReset.otpExpireAt = expireAt;

        return res.json({
            success: true,
            message: 'Đã gửi lại OTP thành công.'
        });

    } catch (error) {
        console.error('❌ RESEND OTP ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể gửi lại OTP. Vui lòng thử lại sau.'
        });
    }
};