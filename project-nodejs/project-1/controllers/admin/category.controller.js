// =============================================================
// CATEGORY CONTROLLER
// =============================================================

const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { exec } = require('child_process');
const Category = require('../../models/category.model');
const User = require('../../models/user.model');

// ✅ BỔ SUNG: Octokit cho GitHub Issue
const { Octokit } = require('@octokit/rest');

const PAGE_SIZE = 10;

const STATUS_LABELS = {
    active: 'Hoạt động',
    inactive: 'Tạm dừng'
};

// =============================================================
// CẤU HÌNH GITHUB
// =============================================================

const GITHUB_CONFIG = {
    owner: process.env.GITHUB_OWNER || 'chunglop0781',
    repo: process.env.GITHUB_REPO || 'project-cache',
    token: process.env.GITHUB_TOKEN,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: 'project-nodejs/project-1/public/uploads/categories/'
};

// ✅ BỔ SUNG: Khởi tạo Octokit
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

// =============================================================
// UPLOAD ẢNH - TÊN FILE NGẪU NHIÊN
// =============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/categories'));
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const uniqueName = `${timestamp}-${random}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// =============================================================
// HELPER FUNCTIONS
// =============================================================

function normalizeIds(ids) {
    if (!ids) return [];
    return Array.isArray(ids) ? ids : [ids];
}

function toSlug(str) {
    return (str || '')
        .toString()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function parseVNDate(str, endOfDay) {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    const date = endOfDay
        ? new Date(y, m - 1, d, 23, 59, 59, 999)
        : new Date(y, m - 1, d, 0, 0, 0, 0);
    return isNaN(date.getTime()) ? null : date;
}

// =============================================================
// ✅ HÀM TỰ ĐỘNG CHẠY SCRIPT FIX
// =============================================================

function runFixScript() {
    console.log('🔄 Đang chạy script fix-category-updatedBy.js...');
    exec('yarn node scripts/fix-category-updatedBy.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Lỗi khi chạy script fix: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`❌ Script fix stderr: ${stderr}`);
            return;
        }
        console.log(`✅ Script fix output: ${stdout}`);
    });
}

// =============================================================
// ✅ UPLOAD ẢNH LÊN GITHUB
// =============================================================

async function uploadToGitHub(filePath, fileName) {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn('⚠️ File not found at path:', filePath);
            return null;
        }

        if (!process.env.GITHUB_TOKEN) {
            console.warn('⚠️ GITHUB_TOKEN not found.');
            return null;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const contentBase64 = fileBuffer.toString('base64');
        const githubPath = `${GITHUB_CONFIG.path}${fileName}`;
        
        const response = await axios.put(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${githubPath}`,
            {
                message: `Upload image: ${fileName}`,
                content: contentBase64,
                branch: GITHUB_CONFIG.branch
            },
            {
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        console.log('✅ Uploaded to GitHub:', response.data.content.download_url);
        return response.data.content.download_url || response.data.content.html_url;
        
    } catch (error) {
        console.error('❌ Upload to GitHub failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// =============================================================
// ✅ UPLOAD ẢNH LÊN GITHUB ISSUE (DỰ PHÒNG)
// =============================================================

async function uploadToGitHubIssue(filePath, fileName) {
    try {
        if (!process.env.GITHUB_TOKEN) {
            console.warn('⚠️ GITHUB_TOKEN not found.');
            return null;
        }
        const fileBuffer = fs.readFileSync(filePath);
        const contentBase64 = fileBuffer.toString('base64');
        const issue = await octokit.issues.create({
            owner: GITHUB_CONFIG.owner,
            repo: GITHUB_CONFIG.repo,
            title: `Image: ${fileName}`,
            body: `![${fileName}](data:image/png;base64,${contentBase64})`
        });
        console.log('✅ Uploaded to GitHub Issue:', issue.data.html_url);
        return issue.data.html_url;
    } catch (error) {
        console.error('❌ Upload to GitHub Issue failed:', error.message);
        return null;
    }
}

// =============================================================
// ✅ UPLOAD ẢNH LÊN GITHUB GIST (DỰ PHÒNG)
// =============================================================

async function uploadToGist(filePath, fileName) {
    try {
        if (!process.env.GITHUB_TOKEN) {
            console.warn('⚠️ GITHUB_TOKEN not found.');
            return null;
        }
        const fileBuffer = fs.readFileSync(filePath);
        const contentBase64 = fileBuffer.toString('base64');
        const response = await axios.post(
            'https://api.github.com/gists',
            {
                description: `Image: ${fileName}`,
                public: false,
                files: { [fileName]: { content: contentBase64 } }
            },
            {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        console.log('✅ Uploaded to Gist:', response.data.html_url);
        return response.data.html_url;
    } catch (error) {
        console.error('❌ Upload to Gist failed:', error.response?.data?.message || error.message);
        return null;
    }
}

async function uploadImage(filePath, fileName, method = 'github') {
    switch (method) {
        case 'issue': return await uploadToGitHubIssue(filePath, fileName);
        case 'gist': return await uploadToGist(filePath, fileName);
        default: return await uploadToGitHub(filePath, fileName);
    }
}

// =============================================================
// DANH SÁCH DANH MỤC (GIỮ NGUYÊN LOGIC CŨ)
// =============================================================

exports.index = async (req, res) => {
    try {
        const { status, creator, dateFrom, dateTo } = req.query;
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = { isDeleted: false };

        if (status === 'active' || status === 'inactive') filter.status = status;
        if (creator) filter.createdBy = creator;

        const fromDate = parseVNDate(dateFrom, false);
        const toDate = parseVNDate(dateTo, true);
        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = fromDate;
            if (toDate) filter.createdAt.$lte = toDate;
        }

        if (keyword) {
            filter.name = { $regex: keyword, $options: 'i' };
        }

        const totalCategories = await Category.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalCategories / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const categoriesRaw = await Category.find(filter)
            .populate('createdBy')
            .populate('updatedBy')
            .sort({ position: 1, createdAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const categories = categoriesRaw.map(function (cat) {
            return {
                id: cat._id,
                name: cat.name,
                image: cat.image || '/admin/image/no-image.png',
                position: cat.position || 1,
                status: cat.status,
                statusLabel: STATUS_LABELS[cat.status] || cat.status,
                createdByName: cat.createdBy ? cat.createdBy.fullName : 'N/A',
                createdAt: cat.createdAt ? cat.createdAt.toLocaleString('vi-VN') : '',
                updatedByName: cat.updatedBy ? cat.updatedBy.fullName : 'N/A',
                updatedAt: cat.updatedAt ? cat.updatedAt.toLocaleString('vi-VN') : ''
            };
        });

        let baseUrl = '/admin/categories?';
        if (status) baseUrl += 'status=' + status + '&';
        if (creator) baseUrl += 'creator=' + creator + '&';
        if (dateFrom) baseUrl += 'dateFrom=' + encodeURIComponent(dateFrom) + '&';
        if (dateTo) baseUrl += 'dateTo=' + encodeURIComponent(dateTo) + '&';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';

        res.render('admin/pages/category/category-list', {
            categories,
            creators: [],
            filter: { status, creator, dateFrom, dateTo, keyword },
            currentPage,
            totalPages,
            baseUrl,
            pageTitle: 'Quản Lý Danh Mục',
            activeMenu: 'categories'
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/category/category-list', {
            categories: [],
            creators: [],
            filter: {},
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/categories?',
            pageTitle: 'Quản Lý Danh Mục',
            activeMenu: 'categories'
        });
    }
};

// =============================================================
// TRANG TẠO DANH MỤC
// =============================================================

exports.createPage = async (req, res) => {
    try {
        const parentCategories = await Category.find({ isDeleted: false }).sort({ position: 1 });
        console.log('🔍 CREATE PAGE - parentCategories:', parentCategories.length);
        res.render('admin/pages/category/category-form', {
            parentCategories,
            pageTitle: 'Tạo Danh Mục',
            activeMenu: 'categories'
        });
    } catch (error) {
        console.log('❌ CREATE PAGE ERROR:', error);
        res.render('admin/pages/category/category-form', {
            parentCategories: [],
            pageTitle: 'Tạo Danh Mục',
            activeMenu: 'categories'
        });
    }
};

// =============================================================
// TẠO DANH MỤC (GIỮ NGUYÊN LOGIC CŨ - req.session.user._id)
// =============================================================

exports.create = async (req, res) => {
    try {
        console.log('========================================');
        console.log('🔍 CONTROLLER CREATE - REQUEST RECEIVED');
        console.log('  - Method:', req.method);
        console.log('  - URL:', req.url);
        console.log('  - Content-Type:', req.headers['content-type']);
        console.log('  - Body:', req.body);
        console.log('  - File:', req.file);
        console.log('  - Session user:', req.session.user);
        console.log('========================================');

        if (!req.body || Object.keys(req.body).length === 0) {
            console.warn('⚠️ req.body rỗng! Kiểm tra form submit.');
            
            const parentCategories = await Category.find({ isDeleted: false }).sort({ position: 1 });
            
            return res.render('admin/pages/category/category-form', {
                parentCategories,
                error: 'Không nhận được dữ liệu từ form. Vui lòng thử lại.',
                pageTitle: 'Tạo Danh Mục',
                activeMenu: 'categories',
                category: {}
            });
        }

        const name = (req.body.name || '').trim();
        const parent = req.body.parent || null;
        const position = parseInt(req.body.position) || 1;
        const status = req.body.status || 'active';
        const description = req.body.description || '';

        console.log('📝 TẠO DANH MỤC - DỮ LIỆU NHẬN ĐƯỢC:');
        console.log('  - name:', name);
        console.log('  - parent:', parent);
        console.log('  - position:', position);
        console.log('  - status:', status);
        console.log('  - description (TinyMCE):', description);
        console.log('  - description length:', description?.length || 0);
        console.log('========================================');

        if (!name) {
            const parentCategories = await Category.find({ isDeleted: false }).sort({ position: 1 });
            return res.render('admin/pages/category/category-form', {
                parentCategories,
                error: 'Vui lòng nhập tên danh mục.',
                pageTitle: 'Tạo Danh Mục',
                activeMenu: 'categories',
                category: req.body || {}
            });
        }

        let slug = toSlug(name);
        const existingSlug = await Category.findOne({ slug: slug, isDeleted: false });
        if (existingSlug) {
            slug = slug + '-' + Date.now();
        }

        const userId = req.session.user?._id || null;

        const newCategory = await Category.create({
            name: name,
            slug: slug,
            parent: parent || null,
            position: position || 1,
            status: status === 'inactive' ? 'inactive' : 'active',
            description: description || '',
            image: req.file ? '/uploads/categories/' + req.file.filename : undefined,
            createdBy: userId,
            updatedBy: userId,
            isDeleted: false
        });

        console.log('✅ Tạo danh mục thành công:', newCategory._id);

        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            
            console.log('📤 Uploading to GitHub repository:', fileName);
            console.log('📁 Local path:', localPath);
            
            if (fs.existsSync(localPath)) {
                const githubImageUrl = await uploadImage(localPath, fileName, 'github');
                
                if (githubImageUrl) {
                    await Category.findByIdAndUpdate(newCategory._id, {
                        image: githubImageUrl
                    });
                    console.log('✅ Updated image URL to GitHub:', githubImageUrl);
                    
                    try {
                        if (fs.existsSync(localPath)) {
                            fs.unlinkSync(localPath);
                            console.log('🗑️ Đã xóa ảnh local:', localPath);
                        }
                    } catch (unlinkError) {
                        console.warn('⚠️ Không thể xóa ảnh local:', unlinkError.message);
                    }
                } else {
                    console.warn('⚠️ GitHub upload failed, keeping local image.');
                }
            } else {
                console.warn('⚠️ File not found, skipping upload:', localPath);
            }
        }

        req.session.success = 'Tạo danh mục thành công!';
        res.redirect('/admin/categories');

    } catch (error) {
        console.error('❌ CREATE CATEGORY ERROR:', error);
        
        const parentCategories = await Category.find({ isDeleted: false }).sort({ position: 1 });
        res.render('admin/pages/category/category-form', {
            parentCategories,
            error: 'Có lỗi xảy ra: ' + (error.message || 'Vui lòng thử lại.'),
            pageTitle: 'Tạo Danh Mục',
            activeMenu: 'categories',
            category: req.body || {}
        });
    }
};

// =============================================================
// BULK ACTION - DANH SÁCH CHÍNH
// =============================================================

exports.bulkAction = async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);

        const userId = req.session.user?._id || null;

        if (ids.length) {
            if (bulkAction === 'activate') {
                await Category.updateMany({ _id: { $in: ids } }, { status: 'active', updatedBy: userId });
            } else if (bulkAction === 'deactivate') {
                await Category.updateMany({ _id: { $in: ids } }, { status: 'inactive', updatedBy: userId });
            } else if (bulkAction === 'delete') {
                await Category.updateMany(
                    { _id: { $in: ids } },
                    {
                        isDeleted: true,
                        deletedAt: new Date(),
                        deletedBy: userId
                    }
                );
            }
        }

        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error);
        res.redirect('/admin/categories');
    }
};

// =============================================================
// TRANG SỬA DANH MỤC
// =============================================================

exports.editPage = async (req, res) => {
    try {
        const categoryRaw = await Category.findOne({ _id: req.params.id, isDeleted: false });

        if (!categoryRaw) {
            return res.redirect('/admin/categories');
        }

        const parentCategories = await Category.find({ _id: { $ne: categoryRaw._id }, isDeleted: false }).sort({ position: 1 });

        const category = {
            id: categoryRaw._id,
            name: categoryRaw.name,
            slug: categoryRaw.slug,
            parent: categoryRaw.parent ? categoryRaw.parent.toString() : '',
            position: categoryRaw.position || 1,
            status: categoryRaw.status || 'active',
            image: categoryRaw.image || '/admin/image/no-image.png',
            description: categoryRaw.description || '',
            createdBy: categoryRaw.createdBy,
            updatedBy: categoryRaw.updatedBy
        };

        res.render('admin/pages/category/category-form', {
            category,
            parentCategories,
            pageTitle: 'Sửa Danh Mục',
            activeMenu: 'categories'
        });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/categories');
    }
};

// =============================================================
// SỬA DANH MỤC (GIỮ NGUYÊN LOGIC CŨ - req.session.user._id)
// =============================================================

exports.edit = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            console.warn('⚠️ req.body rỗng! Kiểm tra form submit.');
            return res.redirect('/admin/categories/' + req.params.id + '/edit');
        }

        const name = (req.body.name || '').trim();
        const parent = req.body.parent || null;
        const position = parseInt(req.body.position) || 1;
        const status = req.body.status || 'active';
        const description = req.body.description || '';

        console.log('========================================');
        console.log('📝 SỬA DANH MỤC - DỮ LIỆU NHẬN ĐƯỢC:');
        console.log('  - name:', name);
        console.log('  - parent:', parent);
        console.log('  - position:', position);
        console.log('  - status:', status);
        console.log('  - description (TinyMCE):', description);
        console.log('  - description length:', description?.length || 0);
        console.log('========================================');
        console.log('🔍 SESSION USER:', req.session.user);

        if (!name) {
            return res.redirect('/admin/categories/' + req.params.id + '/edit');
        }

        let slug = toSlug(name);
        const existingSlug = await Category.findOne({ slug: slug, _id: { $ne: req.params.id }, isDeleted: false });
        if (existingSlug) {
            slug = slug + '-' + Date.now();
        }

        const userId = req.session.user?._id || null;

        const updateData = {
            name: name,
            slug: slug,
            parent: parent || null,
            position: position || 1,
            status: status === 'inactive' ? 'inactive' : 'active',
            description: description || '',
            updatedBy: userId
        };

        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            
            console.log('📤 Uploading new image to GitHub:', fileName);
            console.log('📁 Local path:', localPath);
            
            if (fs.existsSync(localPath)) {
                const githubImageUrl = await uploadImage(localPath, fileName, 'github');
                
                if (githubImageUrl) {
                    updateData.image = githubImageUrl;
                    console.log('✅ Updated image URL to GitHub:', githubImageUrl);
                    
                    try {
                        if (fs.existsSync(localPath)) {
                            fs.unlinkSync(localPath);
                            console.log('🗑️ Đã xóa ảnh local:', localPath);
                        }
                    } catch (unlinkError) {
                        console.warn('⚠️ Không thể xóa ảnh local:', unlinkError.message);
                    }
                } else {
                    updateData.image = '/uploads/categories/' + fileName;
                    console.warn('⚠️ GitHub upload failed, keeping local image.');
                }
            } else {
                console.warn('⚠️ File not found, skipping upload:', localPath);
            }
        }

        console.log('📝 UPDATE DATA:', JSON.stringify(updateData, null, 2));

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('updatedBy');

        console.log('✅ Updated category:');
        console.log('  - ID:', updatedCategory._id);
        console.log('  - Name:', updatedCategory.name);
        console.log('  - UpdatedBy Name:', updatedCategory.updatedBy?.fullName);

        req.session.success = 'Cập nhật danh mục thành công!';
        res.redirect('/admin/categories');

    } catch (error) {
        console.error('❌ UPDATE CATEGORY ERROR:', error);
        res.redirect('/admin/categories/' + req.params.id + '/edit');
    }
};

// =============================================================
// ✅ THÙNG RÁC DANH MỤC
// =============================================================

exports.trash = async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = { isDeleted: true };
        if (keyword) {
            filter.name = { $regex: keyword, $options: 'i' };
        }

        const totalCategories = await Category.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalCategories / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const categoriesRaw = await Category.find(filter)
            .populate('createdBy')
            .populate('deletedBy')
            .sort({ deletedAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const categories = categoriesRaw.map(cat => ({
            id: cat._id,
            name: cat.name,
            image: cat.image || '/admin/image/no-image.png',
            position: cat.position || 1,
            status: cat.status,
            statusLabel: STATUS_LABELS[cat.status] || cat.status,
            createdByName: cat.createdBy ? cat.createdBy.fullName : 'N/A',
            createdAt: cat.createdAt ? cat.createdAt.toLocaleString('vi-VN') : '',
            deletedByName: cat.deletedBy ? cat.deletedBy.fullName : 'N/A',
            deletedAt: cat.deletedAt ? cat.deletedAt.toLocaleString('vi-VN') : ''
        }));

        let baseUrl = '/admin/categories/trash?';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';

        res.render('admin/pages/category/category-trash', {
            categories,
            filter: { keyword },
            currentPage,
            totalPages,
            baseUrl,
            pageTitle: 'Thùng Rác Danh Mục',
            activeMenu: 'categories'
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pages/category/category-trash', {
            categories: [],
            filter: {},
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/categories/trash?',
            pageTitle: 'Thùng Rác Danh Mục',
            activeMenu: 'categories'
        });
    }
};

// =============================================================
// ✅ XÓA MỀM (Chuyển vào thùng rác) - GIỮ NGUYÊN LOGIC
// =============================================================

exports.delete = async (req, res) => {
    try {
        const userId = req.session.user?._id || null;
        
        await Category.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId
        });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// ✅ KHÔI PHỤC TỪ THÙNG RÁC
// =============================================================

exports.restore = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            {
                $set: { isDeleted: false },
                $unset: { deletedAt: '', deletedBy: '' }
            },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// ✅ XÓA VĨNH VIỄN
// =============================================================

exports.forceDelete = async (req, res) => {
    try {
        await Category.deleteOne({ _id: req.params.id, isDeleted: true });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// ✅ BULK ACTION CHO THÙNG RÁC
// =============================================================

exports.bulkTrashAction = async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);

        if (ids.length) {
            if (bulkAction === 'restore') {
                await Category.updateMany(
                    { _id: { $in: ids } },
                    {
                        $set: { isDeleted: false },
                        $unset: { deletedAt: '', deletedBy: '' }
                    }
                );
            } else if (bulkAction === 'delete') {
                await Category.deleteMany({ _id: { $in: ids } });
            }
        }

        res.redirect('/admin/categories/trash');
    } catch (error) {
        console.log(error);
        res.redirect('/admin/categories/trash');
    }
};

// =============================================================
// API
// =============================================================

exports.getDetail = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('createdBy')
            .populate('updatedBy');
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
        res.json({
            success: true,
            data: {
                id: category._id,
                name: category.name,
                slug: category.slug,
                parent: category.parent,
                position: category.position || 1,
                status: category.status || 'active',
                image: category.image || '/admin/image/no-image.png',
                description: category.description || '',
                createdBy: category.createdBy ? category.createdBy.fullName : 'N/A',
                createdAt: category.createdAt,
                updatedBy: category.updatedBy ? category.updatedBy.fullName : 'N/A',
                updatedAt: category.updatedAt
            }
        });
    } catch (error) {
        console.error('❌ GET CATEGORY ERROR:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
    }
};

exports.getAll = async (req, res) => {
    try {
        const categories = await Category.find({ status: 'active', isDeleted: false })
            .sort({ position: 1, name: 1 });
        res.json({
            success: true,
            data: categories.map(cat => ({
                id: cat._id,
                name: cat.name,
                slug: cat.slug,
                parent: cat.parent,
                position: cat.position || 1,
                status: cat.status || 'active',
                image: cat.image || '/admin/image/no-image.png'
            }))
        });
    } catch (error) {
        console.error('❌ GET ALL CATEGORIES ERROR:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
    }
};

// =============================================================
// EXPORT UPLOAD
// =============================================================

exports.upload = upload;