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
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
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
    next();
});

// =============================================================
// FLASH MESSAGES
// =============================================================

app.use((req, res, next) => {
    res.locals.success = req.session.success || null;
    res.locals.error = req.session.error || null;
    // Clear flash messages after render
    req.session.success = null;
    req.session.error = null;
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
        // =====================================================
        // KẾT NỐI DATABASE TRƯỚC
        // =====================================================
        await database.connect();
        console.log('✅ Database connected successfully');

        // =====================================================
        // IMPORT ROUTES SAU KHI DB ĐÃ KẾT NỐI
        // =====================================================
        const clientRoutes = require('./routes/client/index.route');
        const adminRoutes = require('./routes/admin/index.route');
        const errorRoutes = require('./routes/error.route');

        // =====================================================
        // REGISTER ROUTES
        // =====================================================
        app.use('/', clientRoutes);
        app.use('/admin', adminRoutes);
        app.use(errorRoutes);

        // =====================================================
        // START SERVER
        // =====================================================
        app.listen(port, () => {
            console.log('==========================================');
            console.log(`🚀 Website đang chạy trên http://localhost:${port}`);
            console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📦 Database: Connected`);
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

// =============================================================
// HANDLE UNHANDLED REJECTIONS & EXCEPTIONS
// =============================================================

process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION:', err);
    // Don't exit immediately, log for debugging
});

process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION:', err);
    // Exit to avoid inconsistent state
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// =============================================================
// GRACEFUL SHUTDOWN
// =============================================================

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