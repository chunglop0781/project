// =============================================================
// ACCOUNT CONTROLLER
// =============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../../models/user.model');
const ForgotPassword = require('../../models/forgot-password.model');

// Import helper
const { generateHelper } = require('../../helpers/generate.helper');
const { sendOtpEmail } = require('../../helpers/mail.helper');

// =============================================================
// CHECK IF REQUEST IS AJAX
// =============================================================

const isAjaxRequest = (req) => {
    return req.xhr || 
           req.headers.accept?.includes('application/json') ||
           req.headers['content-type']?.includes('application/json');
};

// =============================================================
// TRANG ĐĂNG NHẬP
// =============================================================

module.exports.loginPage = async (req, res) => {
    try {
        if (req.session.user) {
            return res.redirect('/');
        }

        return res.render('client/pages/login', {
            pageTitle: 'Đăng Nhập',
            validationErrors: [],
            error: null,
            formData: {}
        });
    } catch (error) {
        console.error('LOGIN PAGE ERROR:', error);
        return res.status(500).send('Lỗi máy chủ.');
    }
};

// =============================================================
// ĐĂNG NHẬP - HỖ TRỢ CẢ HTML VÀ JSON
// =============================================================

module.exports.login = async (req, res) => {
    try {
        const isAjax = isAjaxRequest(req);

        // Validation errors từ middleware
        if (req.validationErrors && req.validationErrors.length) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    details: req.validationErrors
                });
            }

            return res.status(400).render('client/pages/login', {
                pageTitle: 'Đăng Nhập',
                validationErrors: req.validationErrors,
                error: null,
                formData: {
                    email: req.body.email || '',
                    rememberPassword: req.body.rememberPassword || false
                }
            });
        }

        const { email, password, rememberPassword } = req.body;
        const normalizedEmail = email ? email.trim().toLowerCase() : '';

        if (!normalizedEmail || !password) {
            const error = 'Vui lòng nhập đầy đủ email và mật khẩu.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/login', {
                pageTitle: 'Đăng Nhập',
                validationErrors: [],
                error: error,
                formData: { email, rememberPassword }
            });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            const error = 'Email hoặc mật khẩu không chính xác.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/login', {
                pageTitle: 'Đăng Nhập',
                validationErrors: [],
                error: error,
                formData: { email, rememberPassword }
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            const error = 'Email hoặc mật khẩu không chính xác.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/login', {
                pageTitle: 'Đăng Nhập',
                validationErrors: [],
                error: error,
                formData: { email, rememberPassword }
            });
        }

        if (user.status && user.status !== 'active') {
            const error = 'Tài khoản của bạn hiện không hoạt động. Vui lòng liên hệ hỗ trợ.';
            
            if (isAjax) {
                return res.status(403).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(403).render('client/pages/login', {
                pageTitle: 'Đăng Nhập',
                validationErrors: [],
                error: error,
                formData: { email, rememberPassword }
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'default-secret-key',
            {
                expiresIn: rememberPassword ? '30d' : '1d'
            }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: rememberPassword ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
        });

        req.session.user = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            role: user.role
        };

        const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/';

        if (isAjax) {
            return res.json({
                code: 'success',
                redirect: redirectUrl
            });
        }

        return res.redirect(redirectUrl);

    } catch (error) {
        console.error('LOGIN ERROR:', error);
        
        if (isAjaxRequest(req)) {
            return res.status(500).json({
                code: 'error',
                message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
            });
        }

        return res.status(500).render('client/pages/login', {
            pageTitle: 'Đăng Nhập',
            validationErrors: [],
            error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
            formData: {
                email: req.body?.email || '',
                rememberPassword: req.body?.rememberPassword || false
            }
        });
    }
};

// =============================================================
// TRANG ĐĂNG KÝ
// =============================================================

module.exports.registerPage = async (req, res) => {
    try {
        if (req.session.user) {
            return res.redirect('/');
        }

        return res.render('client/pages/register', {
            pageTitle: 'Đăng Ký',
            validationErrors: [],
            error: null,
            formData: {}
        });
    } catch (error) {
        console.error('REGISTER PAGE ERROR:', error);
        return res.status(500).send('Lỗi máy chủ.');
    }
};

// =============================================================
// ĐĂNG KÝ - HỖ TRỢ CẢ HTML VÀ JSON
// =============================================================

module.exports.register = async (req, res) => {
    try {
        const isAjax = isAjaxRequest(req);

        // Validation errors
        if (req.validationErrors && req.validationErrors.length) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    details: req.validationErrors
                });
            }

            return res.status(400).render('client/pages/register', {
                pageTitle: 'Đăng Ký',
                validationErrors: req.validationErrors,
                error: null,
                formData: {
                    fullName: req.body.fullName || '',
                    email: req.body.email || '',
                    phone: req.body.phone || '',
                    agreeTerms: req.body.agreeTerms || ''
                }
            });
        }

        const { fullName, email, phone, password, confirmPassword, agreeTerms } = req.body;
        const normalizedEmail = email ? email.trim().toLowerCase() : '';

        if (!fullName || !normalizedEmail || !password || !confirmPassword) {
            const error = 'Vui lòng điền đầy đủ thông tin.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/register', {
                pageTitle: 'Đăng Ký',
                validationErrors: [],
                error: error,
                formData: { fullName, email, phone, agreeTerms }
            });
        }

        if (password !== confirmPassword) {
            const error = 'Mật khẩu xác nhận không khớp.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/register', {
                pageTitle: 'Đăng Ký',
                validationErrors: [],
                error: error,
                formData: { fullName, email, phone, agreeTerms }
            });
        }

        if (password.length < 6) {
            const error = 'Mật khẩu phải có ít nhất 6 ký tự.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/register', {
                pageTitle: 'Đăng Ký',
                validationErrors: [],
                error: error,
                formData: { fullName, email, phone, agreeTerms }
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            const error = 'Email này đã được sử dụng.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/register', {
                pageTitle: 'Đăng Ký',
                validationErrors: [],
                error: error,
                formData: { fullName, email, phone, agreeTerms }
            });
        }

        if (!agreeTerms) {
            const error = 'Vui lòng đồng ý với điều khoản và điều kiện.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/register', {
                pageTitle: 'Đăng Ký',
                validationErrors: [],
                error: error,
                formData: { fullName, email, phone, agreeTerms }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            fullName: fullName.trim(),
            email: normalizedEmail,
            phone: phone ? phone.trim() : '',
            password: hashedPassword,
            role: 'customer',
            status: 'active'
        });

        await user.save();

        if (isAjax) {
            return res.json({
                code: 'success',
                redirect: '/login'
            });
        }

        req.session.success = 'Đăng ký thành công! Vui lòng đăng nhập.';
        return res.redirect('/login');

    } catch (error) {
        console.error('REGISTER ERROR:', error);
        
        if (isAjaxRequest(req)) {
            return res.status(500).json({
                code: 'error',
                message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
            });
        }

        return res.status(500).render('client/pages/register', {
            pageTitle: 'Đăng Ký',
            validationErrors: [],
            error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
            formData: {
                fullName: req.body?.fullName || '',
                email: req.body?.email || '',
                phone: req.body?.phone || '',
                agreeTerms: req.body?.agreeTerms || ''
            }
        });
    }
};

// =============================================================
// ĐĂNG XUẤT
// =============================================================

module.exports.logout = async (req, res) => {
    try {
        res.clearCookie('token');

        req.session.destroy((err) => {
            if (err) {
                console.error('LOGOUT SESSION ERROR:', err);
            }
            return res.redirect('/login');
        });
    } catch (error) {
        console.error('LOGOUT ERROR:', error);
        return res.redirect('/login');
    }
};

// =============================================================
// CHANGE PASSWORD PAGE
// =============================================================

module.exports.changePasswordPage = async (req, res) => {
    try {
        return res.render('client/pages/change-password', {
            pageTitle: 'Đổi Mật Khẩu',
            error: null,
            success: null,
            validationErrors: [],
            formData: {}
        });
    } catch (error) {
        console.error('CHANGE PASSWORD PAGE ERROR:', error);
        return res.status(500).send('Lỗi máy chủ.');
    }
};

// =============================================================
// CHANGE PASSWORD - HỖ TRỢ CẢ HTML VÀ JSON
// =============================================================

module.exports.changePassword = async (req, res) => {
    try {
        const isAjax = isAjaxRequest(req);

        // Validation errors
        if (req.validationErrors && req.validationErrors.length) {
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    details: req.validationErrors
                });
            }

            return res.status(400).render('client/pages/change-password', {
                pageTitle: 'Đổi Mật Khẩu',
                error: null,
                success: null,
                validationErrors: req.validationErrors,
                formData: {
                    currentPassword: req.body.currentPassword || '',
                    newPassword: req.body.newPassword || '',
                    confirmPassword: req.body.confirmPassword || ''
                }
            });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.user.id;

        if (!currentPassword || !newPassword || !confirmPassword) {
            const error = 'Vui lòng điền đầy đủ thông tin.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/change-password', {
                pageTitle: 'Đổi Mật Khẩu',
                error: error,
                success: null,
                validationErrors: [],
                formData: {
                    currentPassword: currentPassword || '',
                    newPassword: newPassword || '',
                    confirmPassword: confirmPassword || ''
                }
            });
        }

        if (newPassword !== confirmPassword) {
            const error = 'Mật khẩu xác nhận không khớp.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/change-password', {
                pageTitle: 'Đổi Mật Khẩu',
                error: error,
                success: null,
                validationErrors: [],
                formData: {
                    currentPassword: currentPassword || '',
                    newPassword: newPassword || '',
                    confirmPassword: confirmPassword || ''
                }
            });
        }

        if (newPassword.length < 6) {
            const error = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/change-password', {
                pageTitle: 'Đổi Mật Khẩu',
                error: error,
                success: null,
                validationErrors: [],
                formData: {
                    currentPassword: currentPassword || '',
                    newPassword: newPassword || '',
                    confirmPassword: confirmPassword || ''
                }
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            const error = 'Không tìm thấy tài khoản.';
            
            if (isAjax) {
                return res.status(404).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(404).render('client/pages/change-password', {
                pageTitle: 'Đổi Mật Khẩu',
                error: error,
                success: null,
                validationErrors: [],
                formData: {}
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            const error = 'Mật khẩu hiện tại không đúng.';
            
            if (isAjax) {
                return res.status(400).json({
                    code: 'error',
                    message: error
                });
            }

            return res.status(400).render('client/pages/change-password', {
                pageTitle: 'Đổi Mật Khẩu',
                error: error,
                success: null,
                validationErrors: [],
                formData: {
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        console.log('✅ Password updated successfully');

        if (isAjax) {
            return res.json({
                code: 'success',
                message: 'Đổi mật khẩu thành công!'
            });
        }

        return res.render('client/pages/change-password', {
            pageTitle: 'Đổi Mật Khẩu',
            error: null,
            success: 'Đổi mật khẩu thành công!',
            validationErrors: [],
            formData: {}
        });

    } catch (error) {
        console.error('❌ CHANGE PASSWORD ERROR:', error);
        
        if (isAjaxRequest(req)) {
            return res.status(500).json({
                code: 'error',
                message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
            });
        }

        return res.status(500).render('client/pages/change-password', {
            pageTitle: 'Đổi Mật Khẩu',
            error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
            success: null,
            validationErrors: [],
            formData: {}
        });
    }
};