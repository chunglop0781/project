const bcrypt = require('bcryptjs');


// =============================================================
// MODELS
// =============================================================

const User =
    require('../../models/user.model');

const ForgotPassword =
    require('../../models/forgot-password.model');


// =============================================================
// HELPERS
// =============================================================

const {
    sendOtpEmail
} =
    require('../../helpers/mail.helper');

const {
    generateHelper
} =
    require('../../helpers/generate.helper');


// =============================================================
// TRANG QUÊN MẬT KHẨU
// =============================================================

exports.forgotPasswordPage = (
    req,
    res
) => {

    return res.render(
        'client/pages/forgot-password',
        {
            pageTitle: 'Quên Mật Khẩu'
        }
    );

};


// =============================================================
// GỬI OTP QUÊN MẬT KHẨU
// =============================================================

exports.forgotPassword = async (
    req,
    res
) => {

    try {

        // =========================================================
        // LẤY EMAIL
        // =========================================================

        const {
            email
        } = req.body;


        console.log(
            '📧 FORGOT PASSWORD EMAIL:',
            email
        );


        // =========================================================
        // CHUẨN HÓA EMAIL
        // =========================================================

        const normalizedEmail =
            email
                ? email
                    .trim()
                    .toLowerCase()
                : '';


        // =========================================================
        // KIỂM TRA EMAIL
        // =========================================================

        if (!normalizedEmail) {

            return res.status(400).json({

                code: 'error',

                message:
                    'Vui lòng nhập email.'

            });

        }


        // =========================================================
        // KIỂM TRA EMAIL CÓ ĐÚNG ĐỊNH DẠNG KHÔNG
        // =========================================================

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(normalizedEmail)) {

            return res.status(400).json({

                code: 'error',

                message:
                    'Email không đúng định dạng.'

            });

        }


        // =========================================================
        // KIỂM TRA TÀI KHOẢN
        // =========================================================

        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(404).json({

                code: 'error',

                message:
                    'Email không tồn tại trong hệ thống.'

            });

        }


        // =========================================================
        // XÓA OTP CŨ
        //
        // Không để nhiều OTP cùng tồn tại.
        // =========================================================

        await ForgotPassword.deleteMany({

            email:
                normalizedEmail

        });


        // =========================================================
        // TẠO OTP 6 SỐ
        // =========================================================

        const otp =
            generateHelper
                .generateRandomNumber(6);


        console.log(
            '🔐 FORGOT PASSWORD OTP:',
            otp
        );


        // =========================================================
        // OTP HẾT HẠN SAU 5 PHÚT
        // =========================================================

        const expireAt =
            new Date(
                Date.now() +
                5 * 60 * 1000
            );


        // =========================================================
        // TẠO RECORD
        // =========================================================

        const forgotPassword =
            new ForgotPassword({

                email:
                    normalizedEmail,

                otp:
                    otp.toString(),

                expireAt:
                    expireAt

            });


        // =========================================================
        // LƯU DATABASE
        // =========================================================

        await forgotPassword.save();


        console.log(
            '✅ ĐÃ LƯU OTP VÀO DATABASE'
        );


        // =========================================================
        // LƯU SESSION
        // =========================================================

        req.session.resetEmail =
            normalizedEmail;

        req.session.otpVerified =
            false;


        // =========================================================
        // GỬI OTP EMAIL
        // =========================================================

        await sendOtpEmail(
            normalizedEmail,
            otp
        );


        console.log(
            '✅ ĐÃ GỬI OTP QUA EMAIL'
        );


        // =========================================================
        // RESPONSE JSON
        // =========================================================

        return res.json({

            code: 'success',

            message:
                'Đã gửi mã OTP qua email.',

            redirect:
                '/verify-otp'

        });


    } catch (error) {

        console.error(
            '=========================================='
        );

        console.error(
            '❌ FORGOT PASSWORD ERROR'
        );

        console.error(
            error
        );

        console.error(
            '=========================================='
        );


        return res.status(500).json({

            code: 'error',

            message:
                'Không thể gửi OTP. Vui lòng thử lại.'

        });

    }

};


// =============================================================
// TRANG XÁC MINH OTP
// =============================================================

exports.verifyOtpPage = (
    req,
    res
) => {

    // =========================================================
    // KHÔNG CÓ SESSION EMAIL
    // =========================================================

    if (!req.session.resetEmail) {

        return res.redirect(
            '/forgot-password'
        );

    }


    // =========================================================
    // RENDER
    // =========================================================

    return res.render(
        'client/pages/verify-otp',
        {

            pageTitle:
                'Xác Minh OTP',

            email:
                req.session.resetEmail

        }
    );

};


// =============================================================
// XÁC MINH OTP
// =============================================================

exports.verifyOtp = async (
    req,
    res
) => {

    try {

        // =========================================================
        // KIỂM TRA SESSION
        // =========================================================

        if (!req.session.resetEmail) {

            return res.redirect(
                '/forgot-password'
            );

        }


        // =========================================================
        // LẤY OTP
        // =========================================================

        const {
            otp
        } = req.body;


        const normalizedOtp =
            otp
                ? otp
                    .toString()
                    .trim()
                : '';


        console.log(
            '🔢 OTP USER NHẬP:',
            normalizedOtp
        );


        // =========================================================
        // KIỂM TRA OTP RỖNG
        // =========================================================

        if (!normalizedOtp) {

            return res.status(400).render(
                'client/pages/verify-otp',
                {

                    pageTitle:
                        'Xác Minh OTP',

                    email:
                        req.session.resetEmail,

                    error:
                        'Vui lòng nhập mã OTP.'

                }
            );

        }


        // =========================================================
        // TÌM OTP
        // =========================================================

        const otpRecord =
            await ForgotPassword.findOne({

                email:
                    req.session.resetEmail,

                otp:
                    normalizedOtp

            });


        // =========================================================
        // KHÔNG TÌM THẤY OTP
        // =========================================================

        if (!otpRecord) {

            console.log(
                '❌ OTP KHÔNG ĐÚNG'
            );


            return res.status(400).render(
                'client/pages/verify-otp',
                {

                    pageTitle:
                        'Xác Minh OTP',

                    email:
                        req.session.resetEmail,

                    error:
                        'Mã OTP không đúng hoặc đã hết hạn.'

                }
            );

        }


        // =========================================================
        // KIỂM TRA EXPIRE
        // =========================================================

        if (
            !otpRecord.expireAt ||
            otpRecord.expireAt.getTime() <
                Date.now()
        ) {

            console.log(
                '⏰ OTP ĐÃ HẾT HẠN'
            );


            await ForgotPassword.deleteOne({

                _id:
                    otpRecord._id

            });


            return res.status(400).render(
                'client/pages/verify-otp',
                {

                    pageTitle:
                        'Xác Minh OTP',

                    email:
                        req.session.resetEmail,

                    error:
                        'Mã OTP đã hết hạn.'

                }
            );

        }


        // =========================================================
        // OTP ĐÚNG
        // =========================================================

        console.log(
            '✅ OTP CHÍNH XÁC'
        );


        req.session.otpVerified =
            true;


        // =========================================================
        // XÓA OTP
        //
        // OTP chỉ được dùng một lần.
        // =========================================================

        await ForgotPassword.deleteOne({

            _id:
                otpRecord._id

        });


        // =========================================================
        // CHUYỂN SANG ĐẶT PASSWORD
        // =========================================================

        return res.redirect(
            '/otp-password'
        );


    } catch (error) {

        console.error(
            '=========================================='
        );

        console.error(
            '❌ VERIFY OTP ERROR'
        );

        console.error(
            error
        );

        console.error(
            '=========================================='
        );


        return res.status(500).render(
            'client/pages/verify-otp',
            {

                pageTitle:
                    'Xác Minh OTP',

                email:
                    req.session.resetEmail || '',

                error:
                    'Có lỗi xảy ra, vui lòng thử lại.'

            }
        );

    }

};


// =============================================================
// TRANG ĐẶT MẬT KHẨU MỚI
// =============================================================

exports.otpPasswordPage = (
    req,
    res
) => {

    // =========================================================
    // KIỂM TRA FLOW
    // =========================================================

    if (
        !req.session.resetEmail ||
        !req.session.otpVerified
    ) {

        return res.redirect(
            '/forgot-password'
        );

    }


    // =========================================================
    // RENDER
    // =========================================================

    return res.render(
        'client/pages/otp-password',
        {

            pageTitle:
                'Đặt Mật Khẩu Mới',

            email:
                req.session.resetEmail

        }
    );

};


// =============================================================
// ĐẶT MẬT KHẨU MỚI
// =============================================================

exports.otpPassword = async (
    req,
    res
) => {

    try {

        // =========================================================
        // KIỂM TRA SESSION
        // =========================================================

        if (
            !req.session.resetEmail ||
            !req.session.otpVerified
        ) {

            return res.redirect(
                '/forgot-password'
            );

        }


        // =========================================================
        // LẤY PASSWORD
        // =========================================================

        const {
            password,
            confirmPassword
        } = req.body;


        // =========================================================
        // KIỂM TRA PASSWORD
        // =========================================================

        if (!password) {

            return res.status(400).render(
                'client/pages/otp-password',
                {

                    pageTitle:
                        'Đặt Mật Khẩu Mới',

                    email:
                        req.session.resetEmail,

                    error:
                        'Vui lòng nhập mật khẩu mới.'

                }
            );

        }


        // =========================================================
        // KIỂM TRA ĐỘ DÀI
        // =========================================================

        if (password.length < 6) {

            return res.status(400).render(
                'client/pages/otp-password',
                {

                    pageTitle:
                        'Đặt Mật Khẩu Mới',

                    email:
                        req.session.resetEmail,

                    error:
                        'Mật khẩu phải có ít nhất 6 ký tự.'

                }
            );

        }


        // =========================================================
        // KIỂM TRA CONFIRM PASSWORD
        // =========================================================

        if (
            password !==
            confirmPassword
        ) {

            return res.status(400).render(
                'client/pages/otp-password',
                {

                    pageTitle:
                        'Đặt Mật Khẩu Mới',

                    email:
                        req.session.resetEmail,

                    error:
                        'Mật khẩu xác nhận không khớp.'

                }
            );

        }


        // =========================================================
        // TÌM USER
        // =========================================================

        const user =
            await User.findOne({

                email:
                    req.session.resetEmail

            });


        if (!user) {

            return res.status(404).render(
                'client/pages/otp-password',
                {

                    pageTitle:
                        'Đặt Mật Khẩu Mới',

                    email:
                        req.session.resetEmail,

                    error:
                        'Không tìm thấy tài khoản.'

                }
            );

        }


        // =========================================================
        // HASH PASSWORD
        //
        // DÙNG BCRYPTJS
        // =========================================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // =========================================================
        // UPDATE USER
        // =========================================================

        user.password =
            hashedPassword;


        await user.save();


        console.log(
            '✅ ĐỔI MẬT KHẨU THÀNH CÔNG:',
            req.session.resetEmail
        );


        // =========================================================
        // XÓA TẤT CẢ OTP CÒN LẠI
        // =========================================================

        await ForgotPassword.deleteMany({

            email:
                req.session.resetEmail

        });


        // =========================================================
        // XÓA SESSION RESET PASSWORD
        // =========================================================

        delete req.session.resetEmail;

        delete req.session.otpVerified;


        // =========================================================
        // CHUYỂN VỀ LOGIN
        // =========================================================

        return res.redirect(
            '/login'
        );


    } catch (error) {

        console.error(
            '=========================================='
        );

        console.error(
            '❌ OTP PASSWORD ERROR'
        );

        console.error(
            error
        );

        console.error(
            '=========================================='
        );


        return res.status(500).render(
            'client/pages/otp-password',
            {

                pageTitle:
                    'Đặt Mật Khẩu Mới',

                email:
                    req.session.resetEmail || '',

                error:
                    'Có lỗi xảy ra, vui lòng thử lại.'

            }
        );

    }

};