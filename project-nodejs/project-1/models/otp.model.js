const mongoose = require('mongoose');


// =============================================================
// OTP MODEL
// =============================================================

const otpSchema = new mongoose.Schema(
    {

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
        // THỜI GIAN TẠO OTP
        // MongoDB sẽ tự động xóa document sau 300 giây
        // =============================================================

        createdAt: {
            type: Date,
            default: Date.now,
            expires: 300
        }

    }
);


module.exports = mongoose.model('Otp', otpSchema);