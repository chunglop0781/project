// =============================================================
// APP / INDEX
// =============================================================

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const fs = require('fs');

require('dotenv').config();

// Import config
const database = require('./config/database.config');
const User = require('./models/user.model');
const Category = require('./models/category.model'); // ✅ THÊM DÒNG NÀY

const app = express();
const port = process.env.PORT || 3000;

// =============================================================
// APP LOCALS
// =============================================================

app.locals.header = 'Website Du Lịch';
app.locals.footer = '© 2026 Website Du lịch';
app.locals.title = 'Website Du Lịch';

// =============================================================
// PUG TEMPLATE ENGINE
// =============================================================

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// =============================================================
// STATIC FILES
// =============================================================

app.use(express.static(path.join(__dirname, 'public')));

// ✅ THÊM: Phục vụ file uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ✅ THÊM: Phục vụ file admin assets
app.use('/admin/assets', express.static(path.join(__dirname, 'public/admin/assets')));

// =============================================================
// REQUEST BODY PARSER
// =============================================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =============================================================
// METHOD OVERRIDE
// =============================================================

app.use(methodOverride('_method'));

// =============================================================
// COOKIE PARSER
// =============================================================

app.use(cookieParser());

// =============================================================
// SESSION
// =============================================================

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        }
    })
);

// =============================================================
// ✅ FIX: CURRENT USER - Đồng bộ session với database
// =============================================================

app.use(async (req, res, next) => {
    // Đặt mặc định
    res.locals.currentUser = null;
    res.locals.isAuthenticated = false;
    res.locals.path = req.path;
    res.locals.isAdmin = false;
    res.locals.adminUser = null;
    
    // Nếu có session user
    if (req.session.user && req.session.user.id) {
        try {
            // ✅ Lấy user mới nhất từ database
            const user = await User.findById(req.session.user.id).lean();
            
            if (user) {
                // ✅ Cập nhật session với dữ liệu mới từ database
                const avatar = user.avatar || '/admin/image/avatar-default.png';
                
                req.session.user.fullName = user.fullName;
                req.session.user.avatar = avatar;
                req.session.user.phone = user.phone || '';
                req.session.user.role = user.role || 'admin';
                req.session.user.email = user.email;
                
                // Lưu session
                req.session.save();
                
                // Gán vào res.locals
                res.locals.currentUser = req.session.user;
                res.locals.isAuthenticated = true;
                res.locals.isAdmin = user.role === 'admin';
                res.locals.adminUser = {
                    id: user._id,
                    fullName: user.fullName,
                    avatar: avatar,
                    role: user.role || 'admin',
                    email: user.email
                };
                
                console.log('✅ Session synced with database - Avatar:', avatar);
            } else {
                // User không tồn tại -> xóa session
                req.session.destroy();
            }
        } catch (error) {
            console.error('❌ Session sync error:', error);
        }
    }
    
    next();
});

// =============================================================
// ✅ THÊM: DEBUG MIDDLEWARE CHO CATEGORY
// =============================================================

app.use(async (req, res, next) => {
    // Chỉ debug khi vào route /admin/categories
    if (req.path.startsWith('/admin/categories')) {
        console.log('========================================');
        console.log('🔍 CATEGORY DEBUG - REQUEST:', req.method, req.path);
        console.log('  - Query:', req.query);
        console.log('  - Session user:', req.session.user?.fullName || 'No user');
        console.log('========================================');
        
        // Nếu là GET /admin/categories (danh sách)
        if (req.method === 'GET' && req.path === '/admin/categories') {
            try {
                const total = await Category.countDocuments();
                const active = await Category.countDocuments({ isDeleted: false });
                const deleted = await Category.countDocuments({ isDeleted: true });
                const hasData = await Category.findOne().lean();
                
                console.log('📊 CATEGORY DATABASE STATUS:');
                console.log(`  - Total categories: ${total}`);
                console.log(`  - Active (isDeleted: false): ${active}`);
                console.log(`  - Deleted (isDeleted: true): ${deleted}`);
                console.log(`  - Sample data exists: ${!!hasData}`);
                if (hasData) {
                    console.log(`  - Sample: ${hasData.name} (isDeleted: ${hasData.isDeleted})`);
                }
                console.log('========================================');
            } catch (error) {
                console.error('❌ Debug error:', error.message);
            }
        }
        
        // Nếu là GET /admin/categories/:id/edit
        if (req.method === 'GET' && req.path.includes('/edit')) {
            const id = req.path.split('/')[2]; // Lấy ID từ URL
            console.log('🔍 EDIT CATEGORY - ID:', id);
            try {
                const category = await Category.findById(id).lean();
                if (category) {
                    console.log(`  - Found: ${category.name}`);
                    console.log(`  - isDeleted: ${category.isDeleted}`);
                    console.log(`  - status: ${category.status}`);
                } else {
                    console.log('  - ❌ Category not found!');
                }
                console.log('========================================');
            } catch (error) {
                console.error('❌ Debug error:', error.message);
            }
        }
    }
    next();
});

// =============================================================
// FLASH MESSAGES
// =============================================================

app.use((req, res, next) => {
    res.locals.success = req.session.success || null;
    res.locals.error = req.session.error || null;
    req.session.success = null;
    req.session.error = null;
    next();
});

// =============================================================
// ✅ THÊM: DEBUG MIDDLEWARE - Log tất cả request POST
// =============================================================

app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log('========================================');
        console.log('📨 POST REQUEST:');
        console.log('  - URL:', req.url);
        console.log('  - Content-Type:', req.headers['content-type']);
        console.log('  - Body:', req.body);
        console.log('  - Files:', req.file);
        console.log('========================================');
    }
    next();
});

// =============================================================
// REQUEST LOGGING (Dev only)
// =============================================================

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// =============================================================
// RESET PASSWORD FLOW DEBUG
// =============================================================

if (process.env.DEBUG === 'true') {
    app.use((req, res, next) => {
        const resetPaths = ['/forgot-password', '/verify-otp', '/change-password'];
        if (resetPaths.includes(req.path)) {
            console.log('==========================================');
            console.log('🔐 RESET PASSWORD FLOW');
            console.log('METHOD:', req.method);
            console.log('URL:', req.originalUrl);
            console.log('BODY:', req.body);
            console.log('SESSION USER:', req.session.user);
            console.log('SESSION PASSWORD RESET:', req.session.passwordReset);
            console.log('==========================================');
        }
        next();
    });
}

// =============================================================
// START APP
// =============================================================

const startServer = async () => {
    try {
        await database.connect();
        console.log('✅ Database connected successfully');

        // ✅ THÊM: Kiểm tra thư mục uploads và tạo .gitkeep
        const uploadDirs = [
            path.join(__dirname, 'public/uploads'),
            path.join(__dirname, 'public/uploads/tinymce'),
            path.join(__dirname, 'public/uploads/categories'),
            path.join(__dirname, 'public/uploads/tours'),
            path.join(__dirname, 'public/uploads/news'),
            path.join(__dirname, 'public/uploads/profiles'),
            path.join(__dirname, 'public/uploads/customers')
        ];
        
        uploadDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Đã tạo thư mục: ${dir}`);
            }
            
            const gitkeepPath = path.join(dir, '.gitkeep');
            if (!fs.existsSync(gitkeepPath)) {
                fs.writeFileSync(gitkeepPath, '');
                console.log(`📄 Đã tạo file: ${gitkeepPath}`);
            }
        });

        const clientRoutes = require('./routes/client/index.route');
        const adminRoutes = require('./routes/admin/index.route');
        const errorRoutes = require('./routes/error.route');

        app.use('/', clientRoutes);
        app.use('/admin', adminRoutes);
        app.use(errorRoutes);

        app.listen(port, () => {
            console.log('==========================================');
            console.log(`🚀 Website đang chạy trên http://localhost:${port}`);
            console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📦 Database: Connected`);
            console.log(`📁 Uploads: /public/uploads`);
            console.log('==========================================');
        });

    } catch (error) {
        console.error('==========================================');
        console.error('❌ KHÔNG THỂ KHỞI ĐỘNG SERVER');
        console.error('==========================================');
        console.error('Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        console.error('==========================================');
        process.exit(1);
    }
};

// =============================================================
// RUN
// =============================================================

startServer();

process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION:', err);
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Đang tắt server...');
    try {
        if (database.disconnect) {
            await database.disconnect();
            console.log('✅ Đã ngắt kết nối database');
        }
    } catch (error) {
        console.error('❌ Lỗi khi ngắt kết nối:', error);
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Đang tắt server...');
    try {
        if (database.disconnect) {
            await database.disconnect();
            console.log('✅ Đã ngắt kết nối database');
        }
    } catch (error) {
        console.error('❌ Lỗi khi ngắt kết nối:', error);
    }
    process.exit(0);
});