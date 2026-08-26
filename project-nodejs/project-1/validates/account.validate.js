const Joi = require('joi');

// =============================================================
// LOGIN SCHEMA
// =============================================================

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập email.',
            'string.email': 'Email không đúng định dạng.',
            'any.required': 'Vui lòng nhập email.'
        }),
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập mật khẩu.',
            'any.required': 'Vui lòng nhập mật khẩu.'
        }),
    rememberPassword: Joi.boolean()
        .default(false)
});

// =============================================================
// REGISTER SCHEMA
// =============================================================

const registerSchema = Joi.object({
    fullName: Joi.string()
        .trim()
        .min(2)
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập họ tên.',
            'string.min': 'Họ tên phải có ít nhất 2 ký tự.',
            'any.required': 'Vui lòng nhập họ tên.'
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập email.',
            'string.email': 'Email không đúng định dạng.',
            'any.required': 'Vui lòng nhập email.'
        }),
    phone: Joi.string()
        .trim()
        .allow('')  // ✅ Cho phép trống
        .pattern(/^[0-9]{10,11}$/)
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ (phải có 10-11 chữ số).'
        }),
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập mật khẩu.',
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự.',
            'any.required': 'Vui lòng nhập mật khẩu.'
        }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Mật khẩu xác nhận không khớp.',
            'any.required': 'Vui lòng xác nhận mật khẩu.'
        }),
    agreeTerms: Joi.string()
        .valid('on')
        .required()
        .messages({
            'any.only': 'Bạn phải đồng ý với điều khoản và điều kiện.',
            'any.required': 'Bạn phải đồng ý với điều khoản và điều kiện.'
        })
});

// =============================================================
// CHANGE PASSWORD SCHEMA
// =============================================================

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập mật khẩu hiện tại.',
            'any.required': 'Vui lòng nhập mật khẩu hiện tại.'
        }),
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập mật khẩu mới.',
            'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự.',
            'any.required': 'Vui lòng nhập mật khẩu mới.'
        }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Mật khẩu xác nhận không khớp.',
            'any.required': 'Vui lòng xác nhận mật khẩu mới.'
        })
});

// =============================================================
// FORGOT PASSWORD SCHEMA
// =============================================================

const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập email.',
            'string.email': 'Email không đúng định dạng.',
            'any.required': 'Vui lòng nhập email.'
        })
});

// =============================================================
// VERIFY OTP SCHEMA
// =============================================================

const verifyOtpSchema = Joi.object({
    otp: Joi.string()
        .length(6)
        .pattern(/^[0-9]{6}$/)
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập mã OTP.',
            'string.length': 'Mã OTP phải có 6 chữ số.',
            'string.pattern.base': 'Mã OTP phải là 6 chữ số.',
            'any.required': 'Vui lòng nhập mã OTP.'
        })
});

// =============================================================
// VALIDATE MIDDLEWARE
// =============================================================

const validate = (schema) => {
    // ✅ KIỂM TRA SCHEMA CÓ TỒN TẠI KHÔNG
    if (!schema) {
        throw new Error('Schema is required for validation');
    }

    return (req, res, next) => {
        // ✅ KIỂM TRA req.body TỒN TẠI
        if (!req.body) {
            req.body = {};
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: true
        });

        // Validation error
        if (error) {
            console.log('❌ VALIDATION ERROR:', error.details);

            const errors = error.details.map(detail => detail.message);
            const message = errors.join(', ');

            // ✅ LƯU LỖI VÀO req.validationErrors CHO CONTROLLER
            req.validationErrors = errors;
            req.body = value;

            // ✅ CHO CONTROLLER TIẾP TỤC XỬ LÝ
            return next();
        }

        // Validation thành công
        req.body = value;
        req.validationErrors = [];
        next();
    };
};

// =============================================================
// EXPORT - ĐẢM BẢO EXPORT ĐÚNG
// =============================================================

module.exports = {
    validate,
    loginSchema,
    registerSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    verifyOtpSchema
};