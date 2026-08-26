const mongoose = require('mongoose');

// =============================================================
// FORGOT PASSWORD SCHEMA
// =============================================================

const forgotPasswordSchema = new mongoose.Schema(
    {
        // =====================================================
        // EMAIL
        // =====================================================
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },

        // =====================================================
        // OTP
        // =====================================================
        otp: {
            type: String,
            required: true,
            trim: true
        },

        // =====================================================
        // THỜI GIAN HẾT HẠN
        // =====================================================
        expireAt: {
            type: Date,
            required: true,
            index: true
        },

        // =====================================================
        // SỐ LẦN THỬ (tùy chọn - thêm để bảo mật)
        // =====================================================
        attempts: {
            type: Number,
            default: 0
        },

        // =====================================================
        // ĐÃ SỬ DỤNG CHƯA
        // =====================================================
        isUsed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: 'forgot-passwords' // Đổi tên collection cho chuẩn
    }
);

// =============================================================
// TTL INDEX - MongoDB tự động xóa sau expireAt
// =============================================================

forgotPasswordSchema.index(
    { expireAt: 1 },
    { expireAfterSeconds: 0 }
);

// =============================================================
// COMPOUND INDEX - Tìm nhanh theo email và OTP
// =============================================================

forgotPasswordSchema.index(
    { email: 1, otp: 1 },
    { unique: true }
);

// =============================================================
// INSTANCE METHODS
// =============================================================

// Kiểm tra OTP còn hiệu lực không
forgotPasswordSchema.methods.isValid = function() {
    return !this.isUsed && this.expireAt > new Date();
};

// Đánh dấu OTP đã sử dụng
forgotPasswordSchema.methods.markAsUsed = async function() {
    this.isUsed = true;
    return await this.save();
};

// Tăng số lần thử
forgotPasswordSchema.methods.incrementAttempts = async function() {
    this.attempts += 1;
    return await this.save();
};

// =============================================================
// STATIC METHODS
// =============================================================

// Tìm và xác thực OTP
forgotPasswordSchema.statics.findAndVerify = async function(email, otp) {
    const record = await this.findOne({
        email: email.toLowerCase().trim(),
        otp: otp.toString().trim()
    });

    if (!record) {
        return null;
    }

    if (!record.isValid()) {
        return null;
    }

    return record;
};

// Xóa OTP cũ của email
forgotPasswordSchema.statics.deleteOldOtps = async function(email) {
    return await this.deleteMany({
        email: email.toLowerCase().trim(),
        expireAt: { $lt: new Date() }
    });
};

// =============================================================
// MODEL
// =============================================================

const ForgotPassword = mongoose.model('ForgotPassword', forgotPasswordSchema);

module.exports = ForgotPassword;