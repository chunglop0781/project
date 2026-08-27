const path = require('path');
const fs = require('fs');
const axios = require('axios');
const News = require('../../models/news.model');
const User = require('../../models/user.model');

const PAGE_SIZE = 10;

const STATUS_LABELS = {
    draft: 'Nháp',
    published: 'Đã đăng'
};

// =============================================================
// CẤU HÌNH GITHUB
// =============================================================

const GITHUB_CONFIG = {
    owner: process.env.GITHUB_OWNER || 'chunglop0781',
    repo: process.env.GITHUB_REPO || 'project-cache',
    token: process.env.GITHUB_TOKEN,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: 'project-nodejs/project-1/public/uploads/news/'
};

// =============================================================
// UPLOAD ẢNH LÊN GITHUB
// =============================================================

async function uploadToGitHub(filePath, fileName) {
    try {
        if (!process.env.GITHUB_TOKEN) {
            console.warn('⚠️ GITHUB_TOKEN not found. Skipping GitHub upload.');
            return null;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const contentBase64 = fileBuffer.toString('base64');
        
        const githubPath = `${GITHUB_CONFIG.path}${fileName}`;
        
        const response = await axios.put(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${githubPath}`,
            {
                message: `Upload news image: ${fileName}`,
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
        
        console.log('✅ Uploaded news image to GitHub:', response.data.content.download_url);
        return response.data.content.download_url || response.data.content.html_url;
        
    } catch (error) {
        console.error('❌ Upload to GitHub failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// =============================================================
// HELPER FUNCTIONS
// =============================================================

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

function normalizeIds(ids) {
    if (!ids) return [];
    return Array.isArray(ids) ? ids : [ids];
}

// =============================================================
// DANH SÁCH BÀI VIẾT
// =============================================================

exports.index = async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const status = req.query.status || '';
        const page = parseInt(req.query.page) || 1;

        const filter = {};
        
        if (keyword) {
            filter.title = { $regex: keyword, $options: 'i' };
        }
        
        if (status && (status === 'draft' || status === 'published')) {
            filter.status = status;
        }

        const totalPosts = await News.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalPosts / PAGE_SIZE), 1);
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        const postsRaw = await News.find(filter)
            .populate('author')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const posts = postsRaw.map(function (post) {
            return {
                id: post._id,
                thumbnail: post.thumbnail || '/admin/image/no-image.png',
                title: post.title,
                category: post.category || 'Chưa phân loại',
                author: post.author ? post.author.fullName : 'N/A',
                status: post.status,
                statusLabel: STATUS_LABELS[post.status] || post.status,
                publishedAt: post.publishedAt
                    ? post.publishedAt.toLocaleDateString('vi-VN')
                    : '—',
                createdAt: post.createdAt ? post.createdAt.toLocaleDateString('vi-VN') : ''
            };
        });

        let baseUrl = '/admin/news?';
        if (keyword) baseUrl += 'keyword=' + encodeURIComponent(keyword) + '&';
        if (status) baseUrl += 'status=' + encodeURIComponent(status) + '&';

        res.render('admin/pages/news/news-list', {
            posts,
            currentPage,
            totalPages,
            baseUrl,
            filter: { keyword, status },
            pageTitle: 'Quản Lý Tin Tức',
            activeMenu: 'news'
        });

    } catch (error) {
        console.error('❌ NEWS INDEX ERROR:', error);
        res.render('admin/pages/news/news-list', {
            posts: [],
            currentPage: 1,
            totalPages: 1,
            baseUrl: '/admin/news?',
            filter: {},
            pageTitle: 'Quản Lý Tin Tức',
            activeMenu: 'news'
        });
    }
};

// =============================================================
// TRANG TẠO BÀI VIẾT MỚI
// =============================================================

exports.createPage = async (req, res) => {
    try {
        res.render('admin/pages/news/news-form', {
            pageTitle: 'Viết Bài Mới',
            activeMenu: 'news'
        });
    } catch (error) {
        console.error('❌ CREATE PAGE ERROR:', error);
        res.render('admin/pages/news/news-form', {
            pageTitle: 'Viết Bài Mới',
            activeMenu: 'news'
        });
    }
};

// =============================================================
// TẠO BÀI VIẾT MỚI (CÓ UPLOAD ẢNH LÊN GITHUB)
// =============================================================

exports.create = async (req, res) => {
    try {
        console.log('========================================');
        console.log('📝 CREATE NEWS - REQUEST RECEIVED');
        console.log('  - Body:', req.body);
        console.log('  - File:', req.file);
        console.log('  - Session user:', req.session.user);
        console.log('========================================');

        // Kiểm tra dữ liệu
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.render('admin/pages/news/news-form', {
                error: 'Không nhận được dữ liệu từ form. Vui lòng thử lại.',
                pageTitle: 'Viết Bài Mới',
                activeMenu: 'news'
            });
        }

        const title = (req.body.title || '').trim();
        const content = req.body.content || '';
        const excerpt = req.body.excerpt || '';
        const category = req.body.category || '';
        const status = req.body.status || 'draft';
        const publishedAt = req.body.publishedAt;

        // Validate
        if (!title) {
            return res.render('admin/pages/news/news-form', {
                error: 'Vui lòng nhập tiêu đề bài viết.',
                pageTitle: 'Viết Bài Mới',
                activeMenu: 'news',
                post: req.body
            });
        }

        // Tạo slug
        let slug = toSlug(title);
        const existingSlug = await News.findOne({ slug: slug });
        if (existingSlug) {
            slug = slug + '-' + Date.now();
        }

        // Xử lý ảnh thumbnail
        let thumbnailUrl = null;
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            
            console.log('📤 Uploading news thumbnail to GitHub:', fileName);
            
            // Upload lên GitHub
            thumbnailUrl = await uploadToGitHub(localPath, fileName);
            
            if (thumbnailUrl) {
                console.log('✅ Uploaded thumbnail to GitHub:', thumbnailUrl);
                
                // Xóa ảnh local sau khi upload thành công
                try {
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                        console.log('🗑️ Deleted local thumbnail:', localPath);
                    }
                } catch (unlinkError) {
                    console.warn('⚠️ Cannot delete local thumbnail:', unlinkError.message);
                }
            } else {
                // Fallback: giữ ảnh local
                thumbnailUrl = '/uploads/news/' + fileName;
                console.warn('⚠️ GitHub upload failed, keeping local image.');
            }
        }

        // Tạo bài viết mới
        const newsData = {
            title: title,
            slug: slug,
            excerpt: excerpt,
            content: content,
            category: category,
            thumbnail: thumbnailUrl,
            status: status,
            author: req.session.user?._id || null,
            publishedAt: status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : undefined
        };

        const newPost = await News.create(newsData);
        console.log('✅ News created successfully:', newPost._id);

        req.session.success = 'Tạo bài viết thành công!';
        res.redirect('/admin/news');

    } catch (error) {
        console.error('❌ CREATE NEWS ERROR:', error);
        res.render('admin/pages/news/news-form', {
            error: 'Có lỗi xảy ra: ' + (error.message || 'Vui lòng thử lại.'),
            pageTitle: 'Viết Bài Mới',
            activeMenu: 'news',
            post: req.body
        });
    }
};

// =============================================================
// TRANG SỬA BÀI VIẾT
// =============================================================

exports.editPage = async (req, res) => {
    try {
        const postRaw = await News.findById(req.params.id);

        if (!postRaw) {
            return res.redirect('/admin/news');
        }

        const post = {
            id: postRaw._id,
            title: postRaw.title,
            slug: postRaw.slug,
            excerpt: postRaw.excerpt,
            content: postRaw.content,
            thumbnail: postRaw.thumbnail,
            category: postRaw.category,
            status: postRaw.status,
            publishedAt: postRaw.publishedAt
                ? postRaw.publishedAt.toISOString().slice(0, 10)
                : ''
        };

        res.render('admin/pages/news/news-form', {
            post,
            pageTitle: 'Sửa Bài Viết',
            activeMenu: 'news'
        });

    } catch (error) {
        console.error('❌ EDIT PAGE ERROR:', error);
        res.redirect('/admin/news');
    }
};

// =============================================================
// CẬP NHẬT BÀI VIẾT (CÓ UPLOAD ẢNH LÊN GITHUB)
// =============================================================

exports.edit = async (req, res) => {
    try {
        console.log('========================================');
        console.log('📝 EDIT NEWS - REQUEST RECEIVED');
        console.log('  - Body:', req.body);
        console.log('  - File:', req.file);
        console.log('========================================');

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.redirect('/admin/news/' + req.params.id + '/edit');
        }

        const title = (req.body.title || '').trim();
        const content = req.body.content || '';
        const excerpt = req.body.excerpt || '';
        const category = req.body.category || '';
        const status = req.body.status || 'draft';
        const publishedAt = req.body.publishedAt;

        if (!title) {
            return res.redirect('/admin/news/' + req.params.id + '/edit');
        }

        const updateData = {
            title: title,
            excerpt: excerpt,
            content: content,
            category: category,
            status: status,
            publishedAt: status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : undefined,
            updatedBy: req.session.user?._id || null
        };

        // Xử lý ảnh thumbnail mới
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            
            console.log('📤 Uploading new thumbnail to GitHub:', fileName);
            
            // Upload lên GitHub
            const thumbnailUrl = await uploadToGitHub(localPath, fileName);
            
            if (thumbnailUrl) {
                updateData.thumbnail = thumbnailUrl;
                console.log('✅ Updated thumbnail to GitHub:', thumbnailUrl);
                
                // Xóa ảnh local
                try {
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                        console.log('🗑️ Deleted local thumbnail:', localPath);
                    }
                } catch (unlinkError) {
                    console.warn('⚠️ Cannot delete local thumbnail:', unlinkError.message);
                }
            } else {
                // Fallback: giữ ảnh local
                updateData.thumbnail = '/uploads/news/' + fileName;
                console.warn('⚠️ GitHub upload failed, keeping local image.');
            }
        }

        await News.findByIdAndUpdate(req.params.id, updateData);
        console.log('✅ News updated successfully:', req.params.id);

        req.session.success = 'Cập nhật bài viết thành công!';
        res.redirect('/admin/news');

    } catch (error) {
        console.error('❌ EDIT NEWS ERROR:', error);
        res.redirect('/admin/news/' + req.params.id + '/edit');
    }
};

// =============================================================
// XÓA BÀI VIẾT
// =============================================================

exports.delete = async (req, res) => {
    try {
        await News.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ DELETE NEWS ERROR:', error);
        res.status(500).json({ success: false });
    }
};

// =============================================================
// HÀNH ĐỘNG HÀNG LOẠT
// =============================================================

exports.bulkAction = async (req, res) => {
    try {
        const bulkAction = req.body.bulkAction;
        const ids = normalizeIds(req.body.ids);

        if (ids.length) {
            if (bulkAction === 'publish') {
                await News.updateMany(
                    { _id: { $in: ids } },
                    { 
                        status: 'published',
                        publishedAt: new Date()
                    }
                );
            } else if (bulkAction === 'draft') {
                await News.updateMany(
                    { _id: { $in: ids } },
                    { status: 'draft' }
                );
            } else if (bulkAction === 'delete') {
                await News.deleteMany({ _id: { $in: ids } });
            }
        }

        res.redirect('/admin/news');
    } catch (error) {
        console.error('❌ BULK ACTION ERROR:', error);
        res.redirect('/admin/news');
    }
};

// =============================================================
// API LẤY CHI TIẾT BÀI VIẾT
// =============================================================

exports.getDetail = async (req, res) => {
    try {
        const post = await News.findById(req.params.id)
            .populate('author')
            .populate('updatedBy');

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        res.json({
            success: true,
            data: {
                id: post._id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                category: post.category,
                thumbnail: post.thumbnail,
                status: post.status,
                publishedAt: post.publishedAt,
                author: post.author ? post.author.fullName : 'N/A',
                createdAt: post.createdAt,
                updatedAt: post.updatedAt
            }
        });
    } catch (error) {
        console.error('❌ GET DETAIL ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra'
        });
    }
};