// =============================================================
// USER MODEL
// =============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// =============================================================
// ĐỊNH NGHĨA SCHEMA
// =============================================================

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'tour-manager', 'order-manager'],
        default: 'customer'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'active'
    },
    resetPasswordOTP: {
        type: String
    },
    resetPasswordOTPExpires: {
        type: Date
    }
}, {
    timestamps: true
});

// =============================================================
// MIDDLEWARE - Hash password trước khi save
// =============================================================

// ✅ CÁCH ĐÚNG CHO MONGOSE 6+ (Không dùng next)
userSchema.pre('save', async function() {
    // Chỉ hash nếu password bị thay đổi
    if (!this.isModified('password')) {
        return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// =============================================================
// INSTANCE METHODS
// =============================================================

// So sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// =============================================================
// STATIC METHODS
// =============================================================

// Tìm user bằng email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase().trim() });
};

// Tìm user bằng email và kiểm tra OTP
userSchema.statics.findByEmailAndOtp = function(email, otp) {
    return this.findOne({
        email: email.toLowerCase().trim(),
        resetPasswordOTP: otp,
        resetPasswordOTPExpires: { $gt: new Date() }
    });
};

// =============================================================
// TẠO MODEL
// =============================================================

const User = mongoose.models.User || mongoose.model('User', userSchema);

// =============================================================
// EXPORT
// =============================================================

module.exports = User;