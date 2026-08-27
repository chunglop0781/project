// =============================================================
// CATEGORY CONTROLLER
// =============================================================

const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const Category = require('../../models/category.model');

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
        // ✅ Tạo tên file ngẫu nhiên: timestamp + random + extension
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
// ✅ UPLOAD ẢNH LÊN GITHUB (MẶC ĐỊNH DÙNG CÁCH NÀY)
// =============================================================

async function uploadToGitHub(filePath, fileName) {
    try {
        // Kiểm tra token
        if (!process.env.GITHUB_TOKEN) {
            console.warn('⚠️ GITHUB_TOKEN not found. Skipping GitHub upload.');
            return null;
        }

        // Đọc file
        const fileBuffer = fs.readFileSync(filePath);
        const contentBase64 = fileBuffer.toString('base64');
        
        // Đường dẫn trên GitHub
        const githubPath = `${GITHUB_CONFIG.path}${fileName}`;
        
        // Gửi request lên GitHub API
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
        
        console.log('✅ Uploaded to GitHub:', response.data.content.html_url);
        
        // Trả về URL ảnh trên GitHub
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
        // Kiểm tra token
        if (!process.env.GITHUB_TOKEN) {
            console.warn('⚠️ GITHUB_TOKEN not found. Skipping GitHub Issue upload.');
            return null;
        }

        // Đọc file
        const fileBuffer = fs.readFileSync(filePath);
        const contentBase64 = fileBuffer.toString('base64');
        
        // Tạo issue mới
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
        // Kiểm tra token
        if (!process.env.GITHUB_TOKEN) {
            console.warn('⚠️ GITHUB_TOKEN not found. Skipping Gist upload.');
            return null;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const contentBase64 = fileBuffer.toString('base64');
        
        const response = await axios.post(
            'https://api.github.com/gists',
            {
                description: `Image: ${fileName}`,
                public: false,
                files: {
                    [fileName]: {
                        content: contentBase64
                    }
                }
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

// =============================================================
// ✅ HÀM UPLOAD - MẶC ĐỊNH LÀ 'GITHUB' (CÁCH 1)
// =============================================================

async function uploadImage(filePath, fileName, method = 'github') {
    // method: 'github' | 'issue' | 'gist'
    // Mặc định dùng 'github' (upload trực tiếp lên repository)
    switch (method) {
        case 'issue':
            return await uploadToGitHubIssue(filePath, fileName);
        case 'gist':
            return await uploadToGist(filePath, fileName);
        case 'github':
        default:
            return await uploadToGitHub(filePath, fileName);
    }
}

// =============================================================
// DANH SÁCH DANH MỤC
// =============================================================

exports.index = async (req, res) => {
    try {
        const { status, creator, dateFrom, dateTo } = req.query;
        const keyword = (req.query.keyword || '').trim();
        const page = parseInt(req.query.page) || 1;

        const filter = {};

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
                position: cat.position,
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
        const parentCategories = await Category.find().sort({ position: 1 });
        console.log('🔍 CREATE PAGE - Rendering category-form');
        console.log('  - parentCategories:', parentCategories.length);
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
// TẠO DANH MỤC - FIX LỖI req.body + UPLOAD LÊN GITHUB + XÓA LOCAL
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

        // ✅ KIỂM TRA req.body TỒN TẠI
        if (!req.body || Object.keys(req.body).length === 0) {
            console.warn('⚠️ req.body rỗng! Kiểm tra form submit.');
            
            console.log('🔍 DEBUG - Request details:');
            console.log('  - Content-Type:', req.headers['content-type']);
            console.log('  - Content-Length:', req.headers['content-length']);
            
            const parentCategories = await Category.find().sort({ position: 1 });
            
            return res.render('admin/pages/category/category-form', {
                parentCategories,
                error: 'Không nhận được dữ liệu từ form. Vui lòng thử lại.',
                pageTitle: 'Tạo Danh Mục',
                activeMenu: 'categories',
                category: {}
            });
        }

        // ✅ LẤY DỮ LIỆU TỪ FORM
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

        // ✅ VALIDATE DỮ LIỆU BẮT BUỘC
        if (!name) {
            const parentCategories = await Category.find().sort({ position: 1 });
            return res.render('admin/pages/category/category-form', {
                parentCategories,
                error: 'Vui lòng nhập tên danh mục.',
                pageTitle: 'Tạo Danh Mục',
                activeMenu: 'categories',
                category: req.body || {}
            });
        }

        // ✅ TẠO SLUG
        let slug = toSlug(name);
        const existingSlug = await Category.findOne({ slug: slug });
        if (existingSlug) {
            slug = slug + '-' + Date.now();
        }

        // ✅ LƯU VÀO DATABASE
        const newCategory = await Category.create({
            name: name,
            slug: slug,
            parent: parent || null,
            position: position || 1,
            status: status === 'inactive' ? 'inactive' : 'active',
            description: description || '',
            image: req.file ? '/uploads/categories/' + req.file.filename : undefined,
            createdBy: req.session.user?._id || null
        });

        console.log('✅ Tạo danh mục thành công:', newCategory._id);

        // ✅ BỔ SUNG: UPLOAD ẢNH LÊN GITHUB VÀ XÓA LOCAL
        let githubImageUrl = null;
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            
            console.log('📤 Uploading to GitHub repository:', fileName);
            console.log('📁 Local path:', localPath);
            
            // Upload lên GitHub
            githubImageUrl = await uploadImage(localPath, fileName, 'github');
            
            if (githubImageUrl) {
                // ✅ CẬP NHẬT URL ẢNH TỪ GITHUB VÀO DATABASE
                await Category.findByIdAndUpdate(newCategory._id, {
                    image: githubImageUrl
                });
                console.log('✅ Updated image URL to GitHub:', githubImageUrl);
                
                // ✅ XÓA ẢNH LOCAL SAU KHI UPLOAD THÀNH CÔNG
                try {
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                        console.log('🗑️ Đã xóa ảnh local:', localPath);
                    }
                } catch (unlinkError) {
                    console.warn('⚠️ Không thể xóa ảnh local:', unlinkError.message);
                }
            } else {
                // Nếu upload GitHub thất bại, vẫn giữ ảnh local
                console.warn('⚠️ GitHub upload failed, keeping local image.');
            }
        }

        req.session.success = 'Tạo danh mục thành công!';
        res.redirect('/admin/categories');

    } catch (error) {
        console.error('❌ CREATE CATEGORY ERROR:', error);
        console.error('  - Error name:', error.name);
        console.error('  - Error message:', error.message);
        console.error('  - Error stack:', error.stack);
        
        const parentCategories = await Category.find().sort({ position: 1 });
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
// BULK ACTION
// =============================================================

exports.bulkAction = async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);

        if (ids.length) {
            if (bulkAction === 'activate') {
                await Category.updateMany({ _id: { $in: ids } }, { status: 'active' });
            } else if (bulkAction === 'deactivate') {
                await Category.updateMany({ _id: { $in: ids } }, { status: 'inactive' });
            } else if (bulkAction === 'delete') {
                await Category.deleteMany({ _id: { $in: ids } });
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
        const categoryRaw = await Category.findById(req.params.id);

        if (!categoryRaw) {
            return res.redirect('/admin/categories');
        }

        const parentCategories = await Category.find({ _id: { $ne: categoryRaw._id } }).sort({ position: 1 });

        const category = {
            id: categoryRaw._id,
            name: categoryRaw.name,
            parent: categoryRaw.parent ? categoryRaw.parent.toString() : '',
            position: categoryRaw.position,
            status: categoryRaw.status,
            image: categoryRaw.image,
            description: categoryRaw.description
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
// SỬA DANH MỤC - UPLOAD ẢNH MỚI + XÓA LOCAL
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

        const updateData = {
            name: name,
            parent: parent || null,
            position: position || 1,
            status: status === 'inactive' ? 'inactive' : 'active',
            description: description || '',
            updatedBy: req.session.user?._id || null
        };

        // ✅ NẾU CÓ UPLOAD ẢNH MỚI
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            
            console.log('📤 Uploading new image to GitHub:', fileName);
            console.log('📁 Local path:', localPath);
            
            // Upload lên GitHub
            const githubImageUrl = await uploadImage(localPath, fileName, 'github');
            
            if (githubImageUrl) {
                updateData.image = githubImageUrl;
                console.log('✅ Updated image URL to GitHub:', githubImageUrl);
                
                // ✅ XÓA ẢNH LOCAL
                try {
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                        console.log('🗑️ Đã xóa ảnh local:', localPath);
                    }
                } catch (unlinkError) {
                    console.warn('⚠️ Không thể xóa ảnh local:', unlinkError.message);
                }
            } else {
                // Fallback: giữ ảnh local
                updateData.image = '/uploads/categories/' + fileName;
                console.warn('⚠️ GitHub upload failed, keeping local image.');
            }
        }

        await Category.findByIdAndUpdate(req.params.id, updateData);

        req.session.success = 'Cập nhật danh mục thành công!';
        res.redirect('/admin/categories');

    } catch (error) {
        console.error('❌ UPDATE CATEGORY ERROR:', error);
        res.redirect('/admin/categories/' + req.params.id + '/edit');
    }
};

// =============================================================
// XÓA DANH MỤC
// =============================================================

exports.delete = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// API LẤY CHI TIẾT DANH MỤC
// =============================================================

exports.getDetail = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('createdBy')
            .populate('updatedBy');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        res.json({
            success: true,
            data: {
                id: category._id,
                name: category.name,
                slug: category.slug,
                parent: category.parent,
                position: category.position,
                status: category.status,
                image: category.image,
                description: category.description,
                createdBy: category.createdBy ? category.createdBy.fullName : 'N/A',
                createdAt: category.createdAt,
                updatedBy: category.updatedBy ? category.updatedBy.fullName : 'N/A',
                updatedAt: category.updatedAt
            }
        });
    } catch (error) {
        console.error('❌ GET CATEGORY ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra'
        });
    }
};

// =============================================================
// API LẤY TẤT CẢ DANH MỤC
// =============================================================

exports.getAll = async (req, res) => {
    try {
        const categories = await Category.find({ status: 'active' })
            .sort({ position: 1, name: 1 });

        res.json({
            success: true,
            data: categories.map(cat => ({
                id: cat._id,
                name: cat.name,
                slug: cat.slug,
                parent: cat.parent
            }))
        });
    } catch (error) {
        console.error('❌ GET ALL CATEGORIES ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra'
        });
    }
};

// =============================================================
// EXPORT UPLOAD
// =============================================================

exports.upload = upload;