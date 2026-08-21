const Joi = require('joi');



// =============================================================
// ĐĂNG NHẬP
// =============================================================

const loginSchema = Joi.object({

    email: Joi.string()
        .trim()
        .email()
        .required()
        .messages({
            'string.empty': 'Email không được để trống.',
            'string.email': 'Email không đúng định dạng.',
            'any.required': 'Vui lòng nhập email.'
        }),

    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Mật khẩu không được để trống.',
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự.',
            'any.required': 'Vui lòng nhập mật khẩu.'
        })

});



// =============================================================
// ĐĂNG KÝ
// =============================================================

const registerSchema = Joi.object({

    fullName: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Họ và tên không được để trống.',
            'string.min': 'Họ và tên phải có ít nhất 2 ký tự.',
            'string.max': 'Họ và tên không được vượt quá 100 ký tự.',
            'any.required': 'Vui lòng nhập họ và tên.'
        }),

    email: Joi.string()
        .trim()
        .email()
        .required()
        .messages({
            'string.empty': 'Email không được để trống.',
            'string.email': 'Email không đúng định dạng.',
            'any.required': 'Vui lòng nhập email.'
        }),

    phone: Joi.string()
        .trim()
        .pattern(/^(0|\+84)[0-9]{9}$/)
        .required()
        .messages({
            'string.empty': 'Số điện thoại không được để trống.',
            'string.pattern.base': 'Số điện thoại không đúng định dạng.',
            'any.required': 'Vui lòng nhập số điện thoại.'
        }),

    password: Joi.string()
        .min(6)
        .max(30)
        .required()
        .messages({
            'string.empty': 'Mật khẩu không được để trống.',
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự.',
            'string.max': 'Mật khẩu không được vượt quá 30 ký tự.',
            'any.required': 'Vui lòng nhập mật khẩu.'
        }),

    confirmPassword: Joi.string()
        .required()
        .valid(Joi.ref('password'))
        .messages({
            'string.empty': 'Vui lòng nhập lại mật khẩu.',
            'any.only': 'Mật khẩu xác nhận không khớp.',
            'any.required': 'Vui lòng nhập lại mật khẩu.'
        }),

    agreeTerms: Joi.any()
        .valid('on')
        .required()
        .messages({
            'any.only': 'Bạn phải đồng ý với điều khoản sử dụng.',
            'any.required': 'Bạn phải đồng ý với điều khoản sử dụng.'
        })

});



// =============================================================
// MIDDLEWARE VALIDATE
// =============================================================

const validate = (schema) => {

    return (req, res, next) => {

        const { error, value } = schema.validate(req.body, {
            abortEarly: false
        });

        // =========================================================
        // CÓ LỖI VALIDATION
        // =========================================================

        if (error) {

            console.log('================ VALIDATION ERROR ================');

            console.log(
                'Message:',
                error.details[0].message
            );

            console.log(
                'Field:',
                error.details[0].path.join('.')
            );

            console.log(
                'Type:',
                error.details[0].type
            );

            console.log(
                'Request body:',
                req.body
            );

            console.log('===================================================');

            return res.status(400).json({

                code: 'error',

                message: 'Lỗi xác thực dữ liệu.',

                details: error.details.map(
                    detail => detail.message
                )

            });

        }

        // =========================================================
        // VALIDATION THÀNH CÔNG
        // =========================================================

        req.body = value;

        next();

    };

};



// =============================================================
// EXPORT
// =============================================================

module.exports = {

    loginSchema,

    registerSchema,

    validate

};