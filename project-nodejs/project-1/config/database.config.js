// =============================================================
// DATABASE CONFIG
// =============================================================

const mongoose = require('mongoose');

let isConnected = false;

// =============================================================
// KẾT NỐI DATABASE
// =============================================================

const connect = async () => {
    try {
        // Lấy URI từ env - ưu tiên MONGODB_URI_1 trước
        const mongoUri = process.env.MONGODB_URI_1 || process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MONGODB_URI_1 hoặc MONGODB_URI không được cấu hình trong .env');
        }

        if (isConnected && mongoose.connection.readyState === 1) {
            console.log('📡 Database đã được kết nối trước đó');
            return mongoose.connection;
        }

        console.log('📡 Đang kết nối đến MongoDB Atlas...');
        
        // Ẩn password khi log
        const hiddenUri = mongoUri.replace(/\/\/.*@/, '//***:***@');
        console.log(`🔗 URI: ${hiddenUri}`);
        
        // =====================================================
        // ✅ QUAN TRỌNG: Với mongoose 9.x, connect TRỰC TIẾP
        // KHÔNG có options useNewUrlParser và useUnifiedTopology
        // =====================================================
        await mongoose.connect(mongoUri);

        isConnected = true;
        
        console.log('✅ Database connected successfully');
        console.log(`📦 Database name: ${mongoose.connection.name}`);
        console.log(`🔗 Host: ${mongoose.connection.host}`);
        console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
        
        // =====================================================
        // XỬ LÝ SỰ KIỆN KẾT NỐI
        // =====================================================
        
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connected');
            isConnected = true;
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
            isConnected = true;
        });

        // Bắt sự kiện khi process kết thúc
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed through app termination');
            process.exit(0);
        });

        return mongoose.connection;
        
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        
        // Debug chi tiết hơn
        if (error.name === 'MongoServerSelectionError') {
            console.error('\n💡 KIỂM TRA:');
            console.error('  1. Internet connection');
            console.error('  2. MongoDB Atlas IP whitelist (thêm IP của bạn)');
            console.error('  3. Username/password đúng');
            console.error('  4. Database name đúng');
            console.error('  5. Cluster đang hoạt động');
        }
        
        if (error.name === 'MongoParseError') {
            console.error('\n💡 KIỂM TRA:');
            console.error('  1. Connection string đúng định dạng');
            console.error('  2. Không có dấu cách thừa');
            console.error('  3. Special characters đã được encode');
        }
        
        throw error;
    }
};

// =============================================================
// LẤY CONNECTION
// =============================================================

const getDb = () => {
    if (!isConnected || mongoose.connection.readyState !== 1) {
        throw new Error('DATABASE chưa được kết nối. ReadyState: ' + mongoose.connection.readyState);
    }
    return mongoose.connection;
};

// =============================================================
// KIỂM TRA KẾT NỐI
// =============================================================

const isConnectedToDb = () => {
    return isConnected && mongoose.connection.readyState === 1;
};

// =============================================================
// NGẮT KẾT NỐI
// =============================================================

const disconnect = async () => {
    try {
        if (isConnected || mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            isConnected = false;
            console.log('✅ Database disconnected successfully');
        }
    } catch (error) {
        console.error('❌ Database disconnection error:', error.message);
        throw error;
    }
};

// =============================================================
// EXPORT
// =============================================================

module.exports = {
    connect,
    getDb,
    isConnectedToDb,
    disconnect,
    mongoose,
    get connection() {
        return getDb();
    }
};