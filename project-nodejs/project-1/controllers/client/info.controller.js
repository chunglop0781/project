const path = require('path');
const fs = require('fs');
const axios = require('axios');
const bcrypt = require('bcrypt');
const User = require('../../models/user.model');

// =============================================================
// CẤU HÌNH GITHUB
// =============================================================

const GITHUB_CONFIG = {
    owner: process.env.GITHUB_OWNER || 'chunglop0781',
    repo: process.env.GITHUB_REPO || 'project-cache',
    token: process.env.GITHUB_TOKEN,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: 'project-nodejs/project-1/public/uploads/profiles/'
};

// =============================================================
// UPLOAD ẢNH LÊN GITHUB (CÓ KIỂM TRA FILE TỒN TẠI)
// =============================================================

async function uploadToGitHub(filePath, fileName) {
    try {
        // Kiểm tra file tồn tại
        if (!fs.existsSync(filePath)) {
            console.warn('⚠️ File not found at path:', filePath);
            return null;
        }

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
                message: `Upload profile avatar: ${fileName}`,
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
        
        console.log('✅ Uploaded avatar to GitHub:', response.data.content.download_url);
        return response.data.content.download_url || response.data.content.html_url;
        
    } catch (error) {
        console.error('❌ Upload to GitHub failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// =============================================================
// TRANG THÔNG TIN CÁ NHÂN (CLIENT)
// =============================================================

exports.detail = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);

        if (!user) {
            return req.session.destroy(() => res.redirect('/login'));
        }

        res.render('client/pages/info', {
            user,
            pageTitle: 'Thông tin cá nhân',
            activeMenu: 'info'
        });

    } catch (error) {
        console.log(error);

        res.render('client/pages/info', {
            user: req.session.user,
            pageTitle: 'Thông tin cá nhân',
            activeMenu: 'info',
            error: 'Có lỗi xảy ra, vui lòng thử lại.'
        });
    }
};

// =============================================================
// CẬP NHẬT THÔNG TIN (CLIENT) - CÓ UPLOAD ẢNH LÊN GITHUB
// =============================================================

exports.update = async (req, res) => {
    try {
        const { fullName, phone, address } = req.body;

        console.log('========================================');
        console.log('📝 UPDATE CLIENT INFO - DỮ LIỆU NHẬN ĐƯỢC:');
        console.log('  - fullName:', fullName);
        console.log('  - phone:', phone);
        console.log('  - address:', address);
        console.log('  - File:', req.file);
        console.log('========================================');

        // Validate dữ liệu
        if (!fullName || fullName.trim() === '') {
            const user = await User.findById(req.session.user.id);
            return res.render('client/pages/info', {
                user,
                pageTitle: 'Thông tin cá nhân',
                activeMenu: 'info',
                error: 'Vui lòng nhập họ và tên.'
            });
        }

        const updateData = {
            fullName: fullName.trim(),
            phone: phone || '',
            address: address || ''
        };

        // Xử lý upload ảnh đại diện
        let avatarUrl = null;
        if (req.file) {
            const localPath = req.file.path;
            const fileName = req.file.filename;
            
            console.log('📤 Uploading avatar to GitHub:', fileName);
            console.log('📁 Local path:', localPath);
            
            // Kiểm tra file tồn tại trước khi upload
            if (fs.existsSync(localPath)) {
                // Upload lên GitHub
                avatarUrl = await uploadToGitHub(localPath, fileName);
                
                if (avatarUrl) {
                    updateData.avatar = avatarUrl;
                    console.log('✅ Updated avatar URL to GitHub:', avatarUrl);
                    
                    // Xóa ảnh local sau khi upload thành công
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
                    updateData.avatar = '/uploads/profiles/' + fileName;
                    console.warn('⚠️ GitHub upload failed, keeping local avatar.');
                }
            } else {
                console.warn('⚠️ File not found, skipping upload:', localPath);
            }
        }

        const user = await User.findByIdAndUpdate(
            req.session.user.id,
            updateData,
            { new: true }
        );

        // Đồng bộ lại session để header hiển thị tên và avatar mới ngay
        req.session.user.fullName = user.fullName;
        if (user.avatar) {
            req.session.user.avatar = user.avatar;
        }

        res.render('client/pages/info', {
            user,
            pageTitle: 'Thông tin cá nhân',
            activeMenu: 'info',
            success: 'Cập nhật thông tin thành công.'
        });

    } catch (error) {
        console.error('❌ UPDATE ERROR:', error);

        const user = await User.findById(req.session.user.id);

        res.render('client/pages/info', {
            user,
            pageTitle: 'Thông tin cá nhân',
            activeMenu: 'info',
            error: 'Có lỗi xảy ra: ' + (error.message || 'Vui lòng thử lại.')
        });
    }
};

// =============================================================
// ĐỔI MẬT KHẨU (CLIENT)
// =============================================================

exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        const user = await User.findById(req.session.user.id);

        if (!user) {
            return res.redirect('/login');
        }

        // Validate
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.render('client/pages/info', {
                user,
                pageTitle: 'Thông tin cá nhân',
                activeMenu: 'info',
                error: 'Vui lòng điền đầy đủ thông tin.'
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.render('client/pages/info', {
                user,
                pageTitle: 'Thông tin cá nhân',
                activeMenu: 'info',
                error: 'Mật khẩu hiện tại không đúng.'
            });
        }

        // Kiểm tra mật khẩu mới và xác nhận
        if (newPassword !== confirmPassword) {
            return res.render('client/pages/info', {
                user,
                pageTitle: 'Thông tin cá nhân',
                activeMenu: 'info',
                error: 'Mật khẩu xác nhận không khớp.'
            });
        }

        if (newPassword.length < 6) {
            return res.render('client/pages/info', {
                user,
                pageTitle: 'Thông tin cá nhân',
                activeMenu: 'info',
                error: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
            });
        }

        // Hash mật khẩu mới
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.render('client/pages/info', {
            user,
            pageTitle: 'Thông tin cá nhân',
            activeMenu: 'info',
            success: 'Đổi mật khẩu thành công.'
        });

    } catch (error) {
        console.error('❌ PASSWORD ERROR:', error);

        const user = await User.findById(req.session.user.id);

        res.render('client/pages/info', {
            user,
            pageTitle: 'Thông tin cá nhân',
            activeMenu: 'info',
            error: 'Có lỗi xảy ra: ' + (error.message || 'Vui lòng thử lại.')
        });
    }
};