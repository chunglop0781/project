const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },

    quantity: { type: Number, default: 1 },
    total: { type: Number, required: true },

    passengers: [{
        label: { type: String },
        quantity: { type: Number },
        price: { type: Number }
    }],

    paymentMethod: {
        type: String,
        enum: ['cash', 'bank'],
        default: 'cash'
    },

    note: { type: String },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },

    // =============================================================
    // Trường xóa mềm (thêm mới)
    // =============================================================
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);