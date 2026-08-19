
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: '',
            trim: true
        },

        permissions: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Role', roleSchema);

