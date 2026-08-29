// =============================================================
// UPLOAD WITH MODERATION - Cloudinary (dùng flash)
// =============================================================

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('☁️ Cloudinary Moderation Middleware loaded');

const TEMP_DIR = path.join(__dirname, '../tmp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, TEMP_DIR),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload file ảnh (jpg, png, gif, webp)'), false);
    }
};

const uploadMiddleware = multer({
    storage: multerStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFileFilter
});

const moderateAndUpload = (destinationDir, fieldName = 'avatar') => {
    return [
        (req, res, next) => {
            uploadMiddleware.single(fieldName)(req, res, (err) => {
                if (err) {
                    console.error('❌ Multer error:', err.message);
                    req.flash('error', err.message);
                    return res.redirect('/info');
                }
                if (!req.body) req.body = {};
                next();
            });
        },
        async (req, res, next) => {
            if (!req.file) {
                console.log('ℹ️ No file uploaded, continue');
                return next();
            }

            console.log('🔍 moderateAndUpload called');
            console.log('   - fieldName:', fieldName);
            console.log('   - destinationDir:', destinationDir);

            try {
                const tempFilePath = req.file.path;
                console.log(`📁 File tạm: ${tempFilePath}`);

                const cloudinaryFolder = destinationDir.replace('public/', '');
                const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
                    moderation: 'aws_rek',
                    folder: cloudinaryFolder,
                    resource_type: 'image'
                });

                console.log('📊 Kết quả kiểm duyệt Cloudinary:');
                console.log(`  - Public ID: ${uploadResult.public_id}`);
                console.log(`  - Moderation status: ${uploadResult.moderation?.[0]?.status || 'unknown'}`);
                console.log(`  - URL: ${uploadResult.secure_url}`);

                const moderationStatus = uploadResult.moderation && uploadResult.moderation[0]?.status;
                
                if (moderationStatus === 'rejected') {
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }
                    req.flash('error', 'Ảnh không phù hợp (chứa nội dung nhạy cảm). Vui lòng chọn ảnh khác.');
                    return res.redirect('/info');
                }

                req.file.secure_url = uploadResult.secure_url;
                req.file.public_id = uploadResult.public_id;

                console.log(`✅ Ảnh đã được duyệt và upload lên Cloudinary`);

                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
                next();
            } catch (uploadError) {
                console.error('❌ Lỗi upload lên Cloudinary:', uploadError);
                if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                req.flash('error', 'Lỗi xử lý ảnh: ' + (uploadError.message || 'Unknown error'));
                return res.redirect('/info');
            }
        }
    ];
};

module.exports = { moderateAndUpload };