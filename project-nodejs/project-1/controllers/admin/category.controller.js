// controllers/admin/category.controller.js

const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { Octokit } = require('@octokit/rest');
const Category = require('../../models/category.model');
const User = require('../../models/user.model');
const categoryHelper = require('../../helpers/category.helper');

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

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// =============================================================
// CẤU HÌNH UPLOAD
// =============================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads/categories'));
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}-${random}${ext}`);
    }
});

const upload = multer({ storage });

// =============================================================
// HELPER FUNCTIONS (nội bộ)
// =============================================================

function normalizeIds(ids) {
    if (!ids) return [];
    return Array.isArray(ids) ? ids : [ids];
}

function toSlug(str) {
    return (str || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
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
// UPLOAD ẢNH LÊN GITHUB
// =============================================================

async function uploadToGitHub(filePath, fileName) {
    if (!fs.existsSync(filePath)) {
        console.warn('⚠️ File not found:', filePath);
        return null;
    }
    if (!process.env.GITHUB_TOKEN) {
        console.warn('⚠️ GITHUB_TOKEN not set.');
        return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const contentBase64 = fileBuffer.toString('base64');
    const githubPath = `${GITHUB_CONFIG.path}${fileName}`;

    try {
        const response = await axios.put(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${githubPath}`,
            {
                message: `Upload image: ${fileName}`,
                content: contentBase64,
                branch: GITHUB_CONFIG.branch
            },
            {
                headers: {
                    Authorization: `token ${GITHUB_CONFIG.token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        console.log('✅ Uploaded to GitHub:', response.data.content.download_url);
        return response.data.content.download_url || response.data.content.html_url;
    } catch (error) {
        console.error('❌ GitHub upload failed:', error.response?.data?.message || error.message);
        return null;
    }
}

async function uploadImage(filePath, fileName) {
    return await uploadToGitHub(filePath, fileName);
}

// =============================================================
// 1. DANH SÁCH DANH MỤC (có filter, phân trang)
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

        const categories = categoriesRaw.map(cat => ({
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
        }));

        // Xây dựng baseUrl để giữ filter khi phân trang
        const queryParams = [];
        if (status) queryParams.push(`status=${status}`);
        if (creator) queryParams.push(`creator=${creator}`);
        if (dateFrom) queryParams.push(`dateFrom=${encodeURIComponent(dateFrom)}`);
        if (dateTo) queryParams.push(`dateTo=${encodeURIComponent(dateTo)}`);
        if (keyword) queryParams.push(`keyword=${encodeURIComponent(keyword)}`);
        const baseUrl = '/admin/categories?' + queryParams.join('&');

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
        console.error('❌ INDEX ERROR:', error);
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
// 2. TRANG TẠO DANH MỤC (SỬA DÙNG HELPER)
// =============================================================

exports.createPage = async (req, res) => {
    try {
        const allCategories = await Category.find({ isDeleted: false })
            .sort({ position: 1, name: 1 });

        const flatCategories = allCategories.map(cat => ({
            id: cat._id,
            parent: cat.parent ? cat.parent.toString() : null,
            name: cat.name
        }));

        // Tạo options có phân cấp (không có excludeId)
        const categoryOptions = categoryHelper.getParentOptions(flatCategories);

        // Tạo parentCategories từ options để view dùng (đã có indent)
        const parentCategories = categoryOptions.map(opt => ({
            id: opt.value,
            name: opt.label
        }));

        // Cây danh mục (có thể dùng sau)
        const categoryTree = categoryHelper.buildCategoryTree(flatCategories);

        res.render('admin/pages/category/category-form', {
            category: null,
            parentCategories,       // view sẽ dùng biến này
            categoryOptions,        // giữ lại nếu cần
            categoryTree,
            pageTitle: 'Tạo Danh Mục',
            activeMenu: 'categories',
            error: null,
            success: null
        });
    } catch (error) {
        console.error('❌ CREATE PAGE ERROR:', error);
        res.render('admin/pages/category/category-form', {
            category: null,
            parentCategories: [],
            categoryOptions: [],
            categoryTree: [],
            pageTitle: 'Tạo Danh Mục',
            activeMenu: 'categories',
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};

// =============================================================
// 3. XỬ LÝ TẠO DANH MỤC
// =============================================================

exports.create = async (req, res) => {
    try {
        const { name, parent, position, status, description } = req.body;
        const trimmedName = (name || '').trim();

        if (!trimmedName) {
            return res.redirect('/admin/categories/new');
        }

        let slug = toSlug(trimmedName);
        const existingSlug = await Category.findOne({ slug, isDeleted: false });
        if (existingSlug) slug += '-' + Date.now();

        const userId = req.session.user?._id || null;

        const newCategory = await Category.create({
            name: trimmedName,
            slug,
            parent: parent || null,
            position: parseInt(position) || 1,
            status: status === 'inactive' ? 'inactive' : 'active',
            description: description || '',
            createdBy: userId,
            updatedBy: userId,
            isDeleted: false
        });

        // Xử lý upload ảnh nếu có
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            const githubUrl = await uploadImage(localPath, fileName);
            if (githubUrl) {
                await Category.findByIdAndUpdate(newCategory._id, { image: githubUrl });
                fs.unlinkSync(localPath);
            } else {
                // giữ ảnh local
                await Category.findByIdAndUpdate(newCategory._id, {
                    image: '/uploads/categories/' + fileName
                });
            }
        }

        req.session.success = 'Tạo danh mục thành công!';
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('❌ CREATE ERROR:', error);
        req.session.error = 'Có lỗi xảy ra khi tạo danh mục.';
        res.redirect('/admin/categories/new');
    }
};

// =============================================================
// 4. TRANG SỬA DANH MỤC (SỬA DÙNG HELPER)
// =============================================================

exports.editPage = async (req, res) => {
    try {
        const category = await Category.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!category) {
            return res.redirect('/admin/categories');
        }

        // Lấy tất cả danh mục (không loại trừ) để xây dựng options
        const allCategories = await Category.find({ isDeleted: false })
            .sort({ position: 1, name: 1 });

        const flatCategories = allCategories.map(cat => ({
            id: cat._id,
            parent: cat.parent ? cat.parent.toString() : null,
            name: cat.name
        }));

        // Tạo options có phân cấp, loại bỏ chính nó và các con
        const categoryOptions = categoryHelper.getParentOptions(
            flatCategories,
            category._id   // excludeId
        );

        // Tạo parentCategories từ options để view dùng (đã có indent)
        const parentCategories = categoryOptions.map(opt => ({
            id: opt.value,
            name: opt.label
        }));

        const categoryTree = categoryHelper.buildCategoryTree(flatCategories);

        const categoryData = {
            id: category._id,
            name: category.name,
            slug: category.slug,
            parent: category.parent ? category.parent.toString() : '',
            position: category.position || 1,
            status: category.status || 'active',
            image: category.image || '/admin/image/no-image.png',
            description: category.description || ''
        };

        res.render('admin/pages/category/category-form', {
            category: categoryData,
            parentCategories,    // view sẽ dùng biến này
            categoryOptions,     // giữ lại nếu cần
            categoryTree,
            pageTitle: 'Sửa Danh Mục',
            activeMenu: 'categories',
            error: null,
            success: null
        });
    } catch (error) {
        console.error('❌ EDIT PAGE ERROR:', error);
        res.redirect('/admin/categories');
    }
};

// =============================================================
// 5. XỬ LÝ CẬP NHẬT DANH MỤC
// =============================================================

exports.edit = async (req, res) => {
    try {
        const { name, parent, position, status, description } = req.body;
        const trimmedName = (name || '').trim();

        if (!trimmedName) {
            return res.redirect('/admin/categories/' + req.params.id + '/edit');
        }

        const category = await Category.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!category) {
            return res.redirect('/admin/categories');
        }

        let slug = toSlug(trimmedName);
        const existingSlug = await Category.findOne({
            slug,
            _id: { $ne: category._id },
            isDeleted: false
        });
        if (existingSlug) slug += '-' + Date.now();

        const userId = req.session.user?._id || null;

        const updateData = {
            name: trimmedName,
            slug,
            parent: parent || null,
            position: parseInt(position) || 1,
            status: status === 'inactive' ? 'inactive' : 'active',
            description: description || '',
            updatedBy: userId
        };

        // Xử lý ảnh nếu có upload mới
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            const githubUrl = await uploadImage(localPath, fileName);
            if (githubUrl) {
                updateData.image = githubUrl;
                fs.unlinkSync(localPath);
            } else {
                updateData.image = '/uploads/categories/' + fileName;
            }
        }

        await Category.findByIdAndUpdate(req.params.id, updateData);

        req.session.success = 'Cập nhật danh mục thành công!';
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('❌ EDIT ERROR:', error);
        req.session.error = 'Có lỗi xảy ra khi cập nhật.';
        res.redirect('/admin/categories/' + req.params.id + '/edit');
    }
};

// =============================================================
// 6. XÓA MỀM (Đưa vào thùng rác)
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
        console.error('❌ DELETE ERROR:', error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// 7. THÙNG RÁC - DANH SÁCH
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

        const baseUrl = keyword ? '/admin/categories/trash?keyword=' + encodeURIComponent(keyword) : '/admin/categories/trash?';

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
        console.error('❌ TRASH ERROR:', error);
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
// 8. KHÔI PHỤC TỪ THÙNG RÁC
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
            return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('❌ RESTORE ERROR:', error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// 9. XÓA VĨNH VIỄN
// =============================================================

exports.forceDelete = async (req, res) => {
    try {
        await Category.deleteOne({ _id: req.params.id, isDeleted: true });
        res.json({ success: true });
    } catch (error) {
        console.error('❌ FORCE DELETE ERROR:', error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// 10. HÀNH ĐỘNG HÀNG LOẠT TRÊN DANH SÁCH CHÍNH
// =============================================================

exports.bulkAction = async (req, res) => {
    try {
        const { bulkAction, ids } = req.body;
        const idArray = normalizeIds(ids);
        const userId = req.session.user?._id || null;

        if (idArray.length === 0) {
            return res.redirect('/admin/categories');
        }

        switch (bulkAction) {
            case 'activate':
                await Category.updateMany(
                    { _id: { $in: idArray } },
                    { status: 'active', updatedBy: userId }
                );
                break;
            case 'deactivate':
                await Category.updateMany(
                    { _id: { $in: idArray } },
                    { status: 'inactive', updatedBy: userId }
                );
                break;
            case 'delete':
                await Category.updateMany(
                    { _id: { $in: idArray } },
                    { isDeleted: true, deletedAt: new Date(), deletedBy: userId }
                );
                break;
            default:
                break;
        }

        res.redirect('/admin/categories');
    } catch (error) {
        console.error('❌ BULK ACTION ERROR:', error);
        res.redirect('/admin/categories');
    }
};

// =============================================================
// 11. HÀNH ĐỘNG HÀNG LOẠT TRONG THÙNG RÁC
// =============================================================

exports.bulkTrashAction = async (req, res) => {
    try {
        const { bulkAction, ids } = req.body;
        const idArray = normalizeIds(ids);

        if (idArray.length === 0) {
            return res.redirect('/admin/categories/trash');
        }

        if (bulkAction === 'restore') {
            await Category.updateMany(
                { _id: { $in: idArray } },
                { $set: { isDeleted: false }, $unset: { deletedAt: '', deletedBy: '' } }
            );
        } else if (bulkAction === 'delete') {
            await Category.deleteMany({ _id: { $in: idArray } });
        }

        res.redirect('/admin/categories/trash');
    } catch (error) {
        console.error('❌ BULK TRASH ACTION ERROR:', error);
        res.redirect('/admin/categories/trash');
    }
};

// =============================================================
// 12. API - LẤY CHI TIẾT MỘT DANH MỤC
// =============================================================

exports.getDetail = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('createdBy')
            .populate('updatedBy');

        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy' });
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
        console.error('❌ GET DETAIL ERROR:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
    }
};

// =============================================================
// 13. API - LẤY TẤT CẢ DANH MỤC (active)
// =============================================================

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
        console.error('❌ GET ALL ERROR:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
    }
};

// =============================================================
// EXPORT MIDDLEWARE UPLOAD
// =============================================================

exports.upload = upload;