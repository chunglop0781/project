// =============================================================
// APP / INDEX
// =============================================================

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

require('dotenv').config();

// Import config
const database = require('./config/database.config');

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
// CURRENT USER - Gán vào res.locals
// =============================================================

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.isAuthenticated = !!req.session.user;
    res.locals.path = req.path;
    res.locals.isAdmin = req.session.user?.role === 'admin';
    
    if (req.session.user) {
        res.locals.adminUser = {
            fullName: req.session.user.fullName,
            avatar: req.session.user.avatar || '/admin/image/avatar-default.png',
            role: req.session.user.role,
            email: req.session.user.email,
            id: req.session.user.id
        };
    } else {
        res.locals.adminUser = null;
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
        const fs = require('fs');
        const uploadDirs = [
            path.join(__dirname, 'public/uploads'),
            path.join(__dirname, 'public/uploads/tinymce'),
            path.join(__dirname, 'public/uploads/categories'),
            path.join(__dirname, 'public/uploads/tours')
        ];
        
        uploadDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Đã tạo thư mục: ${dir}`);
            }
            
            // ✅ BỔ SUNG: Tạo file .gitkeep trong mỗi thư mục uploads
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