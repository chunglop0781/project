const mongoose = require('mongoose');


// =============================================================
// FORGOT PASSWORD SCHEMA
// =============================================================

const forgotPasswordSchema = new mongoose.Schema({

    // =============================================================
    // EMAIL
    // =============================================================

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },


    // =============================================================
    // MÃ OTP
    // =============================================================

    otp: {
        type: String,
        required: true
    },


    // =============================================================
    // THỜI GIAN HẾT HẠN
    // MongoDB sẽ tự động xóa document khi expireAt đến thời gian
    // =============================================================

    expireAt: {
        type: Date,
        required: true,
        expires: 0
    }

}, {

    // =============================================================
    // TỰ ĐỘNG TẠO createdAt + updatedAt
    // =============================================================

    timestamps: true

});


// =============================================================
// TẠO MODEL
// Collection MongoDB: forgot-password
// =============================================================

const ForgotPassword = mongoose.model(
    'ForgotPassword',
    forgotPasswordSchema,
    'forgot-password'
);


// =============================================================
// EXPORT
// =============================================================

module.exports = ForgotPassword;