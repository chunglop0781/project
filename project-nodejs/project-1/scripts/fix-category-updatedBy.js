// scripts/fix-category-updatedBy.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Category = require('../models/category.model');
const User = require('../models/user.model');

async function fixCategories() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error('❌ MONGODB_URI not found in .env');
            return;
        }
        
        console.log('📡 Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected');

        // ✅ Tìm admin đầu tiên trong database
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ Không tìm thấy admin trong database!');
            return;
        }

        const adminId = admin._id;
        console.log('🔍 Admin found:');
        console.log('  - ID:', adminId);
        console.log('  - Name:', admin.fullName);
        console.log('  - Email:', admin.email);

        // ✅ Cập nhật cả createdBy và updatedBy nếu null
        const resultUpdated = await Category.updateMany(
            { updatedBy: null },
            { $set: { updatedBy: adminId } }
        );

        const resultCreated = await Category.updateMany(
            { createdBy: null },
            { $set: { createdBy: adminId } }
        );

        console.log('========================================');
        console.log(`✅ Updated updatedBy: ${resultUpdated.modifiedCount} categories`);
        console.log(`✅ Updated createdBy: ${resultCreated.modifiedCount} categories`);
        console.log(`📊 Matched updatedBy: ${resultUpdated.matchedCount}`);
        console.log(`📊 Matched createdBy: ${resultCreated.matchedCount}`);
        console.log('========================================');

        // Kiểm tra lại
        const categories = await Category.find({}, { name: 1, createdBy: 1, updatedBy: 1 }).lean();
        console.log('📋 Categories after fix:');
        categories.forEach(cat => {
            console.log(`  - ${cat.name}:`);
            console.log(`    createdBy = ${cat.createdBy || 'null'}`);
            console.log(`    updatedBy = ${cat.updatedBy || 'null'}`);
        });

        console.log('========================================');
        console.log('✅ FIX COMPLETED!');
        
        await mongoose.disconnect();
        console.log('✅ Disconnected');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
    }
}

fixCategories();