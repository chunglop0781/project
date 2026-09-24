// =============================================================
// APP / INDEX
// =============================================================

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const fs = require('fs');
const flash = require('connect-flash');
const flash2 = require('express-flash');

require('dotenv').config();

// =============================================================
// 🆕 ĐĂNG KÝ MONGOOSE-SLUG-UPDATER
// =============================================================
const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

// =============================================================

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'gudhionc',
    api_key: process.env.CLOUDINARY_API_KEY || '693733693196627',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret_here'
});

console.log('☁️ Cloudinary configured:', {
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key ? '✅ Set' : '❌ Missing'
});

const database = require('./config/database.config');
const User = require('./models/user.model');
const Category = require('./models/category.model');
const Website = require('./models/website.model');   // 🆕 THÊM

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
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
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

app.use(cookieParser('keyboard cat'));

// =============================================================
// SESSION
// =============================================================
// ⚠️ TRƯỚC ĐÂY có 2 lần app.use(session(...)) chồng lên nhau:
//    - 1 lần maxAge=60000 (1 phút, không có secret) chỉ để dùng cho flash2
//    - 1 lần maxAge=24h là session thật
//    => cả 2 cùng ghi đè cookie "connect.sid" khiến session bị hết hạn
//       thất thường dù user vẫn đang thao tác. Đã gộp lại thành 1 session
//       duy nhất, và bật "rolling: true" để mỗi request (tức là mỗi lần
//       user còn tương tác) sẽ RESET lại thời gian đếm ngược logout.
//       Chỉ khi nào user ngừng thao tác lâu hơn maxAge thì mới bị đăng xuất.
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        rolling: true, // 🔑 mỗi request hợp lệ sẽ reset lại maxAge của cookie
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 24h không hoạt động mới bị logout
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        }
    })
);

// Nhúng flash2 middleware để sử dụng flash messages (dùng chung session ở trên, không tạo session riêng nữa)
app.use(flash2());

// ✅ FLASH MIDDLEWARE
app.use(flash());

// =============================================================
// CURRENT USER
// =============================================================

app.use(async (req, res, next) => {
    res.locals.currentUser = null;
    res.locals.isAuthenticated = false;
    res.locals.path = req.path;
    res.locals.isAdmin = false;
    res.locals.adminUser = null;
    
    if (req.session.user && req.session.user.id) {
        try {
            const user = await User.findById(req.session.user.id).lean();
            if (user) {
                const avatar = user.avatar || '/admin/image/avatar-default.png';
                req.session.user.fullName = user.fullName;
                req.session.user.avatar = avatar;
                req.session.user.phone = user.phone || '';
                req.session.user.role = user.role || 'admin';
                req.session.user.email = user.email;
                req.session.save();
                
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
                req.session.destroy();
            }
        } catch (error) {
            console.error('❌ Session sync error:', error);
        }
    }
    next();
});

// ✅ FLASH MESSAGES - LẤY VÀ GẮN VÀO res.locals
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// =============================================================
// 🆕 BỔ SUNG ALIAS CHO flash2 VÀ GẮN messages VÀO VIEW
// =============================================================
app.use((req, res, next) => {
    // Alias để controller gọi req.flash2('type', 'message')
    req.flash2 = req.flash;

    // Đưa tất cả flash messages vào res.locals.messages
    // (sẽ dùng trong view: messages.info, messages.success, messages.error, ...)
    res.locals.messages = req.flash();

    next();
});

// =============================================================
// 🆕 LOAD WEBSITE INFO (logo, phone, email, address) CHO MỌI VIEW
// =============================================================
// Load 1 lần, cache 60 giây để tránh query DB mỗi request.
// Admin có thể gọi req.app.locals.resetWebsiteCache() để xoá cache
// ngay sau khi cập nhật website (để header hiển thị logo mới lập tức).
// =============================================================

const __websiteCache = {
    data: null,
    time: 0
};
const WEBSITE_CACHE_TTL = 60 * 1000; // 60 giây

// Hàm reset cache — controller có thể gọi qua req.app.locals.resetWebsiteCache()
app.locals.resetWebsiteCache = function () {
    __websiteCache.data = null;
    __websiteCache.time = 0;
    console.log('🔄 Website cache đã được reset');
};

app.use(async (req, res, next) => {
    try {
        const now = Date.now();

        // Nếu cache còn hạn → dùng luôn
        if (__websiteCache.data && (now - __websiteCache.time) < WEBSITE_CACHE_TTL) {
            res.locals.website = __websiteCache.data;
            return next();
        }

        // Hết hạn → query DB
        const website = await Website.findOne().lean();

        // Fallback nếu DB chưa có data
        __websiteCache.data = website || {
            name: 'Website Du Lịch',
            phone: '',
            email: '',
            address: '',
            logo: '',
            favicon: ''
        };
        __websiteCache.time = now;

        res.locals.website = __websiteCache.data;
    } catch (error) {
        console.error('❌ Load website info error:', error.message);
        res.locals.website = {
            name: 'Website Du Lịch',
            phone: '',
            email: '',
            address: '',
            logo: '',
            favicon: ''
        };
    }
    next();
});

// =============================================================
// DEBUG MIDDLEWARE
// =============================================================

app.use(async (req, res, next) => {
    if (req.path.startsWith('/admin/categories')) {
        console.log('========================================');
        console.log('🔍 CATEGORY DEBUG - REQUEST:', req.method, req.path);
        console.log('  - Query:', req.query);
        console.log('  - Session user:', req.session.user?.fullName || 'No user');
        console.log('========================================');
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
        if (req.method === 'GET' && req.path.includes('/edit')) {
            const id = req.path.split('/')[2];
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

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

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

        try {
            const testResult = await cloudinary.uploader.upload(
                'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
                { public_id: 'test-connection' }
            );
            console.log('✅ Cloudinary connected successfully');
            console.log(`   - Test upload: ${testResult.secure_url}`);
            await cloudinary.uploader.destroy('test-connection');
            console.log('   - Test cleanup: done');
        } catch (cloudinaryError) {
            console.error('⚠️ Cloudinary connection warning:', cloudinaryError.message);
            console.log('   - Upload sẽ vẫn hoạt động nhưng không có moderation');
        }

        const uploadDirs = [
            path.join(__dirname, 'public/uploads'),
            path.join(__dirname, 'public/uploads/tinymce'),
            path.join(__dirname, 'public/uploads/categories'),
            path.join(__dirname, 'public/uploads/tours'),
            path.join(__dirname, 'public/uploads/news'),
            path.join(__dirname, 'public/uploads/profiles'),
            path.join(__dirname, 'public/uploads/customers'),
            path.join(__dirname, 'public/uploads/website')
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
            console.log(`☁️ Cloudinary: ${cloudinary.config().cloud_name ? 'Configured' : 'Not configured'}`);
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