const User = require('../../models/user.model');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cấu hình GitHub
const GITHUB_CONFIG = {
    owner: process.env.GITHUB_OWNER || 'chunglop0781',
    repo: process.env.GITHUB_REPO || 'project-cache',
    token: process.env.GITHUB_TOKEN,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: 'project-nodejs/project-1/public/uploads/profiles/'
};

async function uploadToGitHub(fileUrl, fileName) {
    try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const contentBase64 = buffer.toString('base64');

        const githubPath = `${GITHUB_CONFIG.path}${fileName}`;

        await axios.put(
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

        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${githubPath}`;
        console.log('✅ Uploaded to GitHub:', rawUrl);
        return rawUrl;
    } catch (error) {
        console.error('❌ GitHub upload error:', error.response?.data?.message || error.message);
        return null;
    }
}

// =============================================================
// TRANG THÔNG TIN CÁ NHÂN
// =============================================================

module.exports.detail = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user.id);
        if (!userData) {
            req.flash('error', 'Không tìm thấy người dùng');
            return res.redirect('/');
        }

        if (!userData.avatar) {
            userData.avatar = '/assets/image/avatar-default.png';
        }

        // Không gọi req.flash() ở đây vì middleware đã gán vào res.locals
        res.render('client/pages/info', {
            pageTitle: 'Thông Tin Cá Nhân',
            user: userData,
            error: res.locals.error,    // Lấy từ res.locals
            success: res.locals.success,
            validationErrors: [],
            activeMenu: 'info'
        });
    } catch (error) {
        console.error('❌ INFO PAGE ERROR:', error);
        req.flash('error', 'Lỗi tải trang thông tin');
        res.redirect('/');
    }
};

// =============================================================
// CẬP NHẬT THÔNG TIN (CÓ UPLOAD AVATAR + GITHUB)
// =============================================================

module.exports.update = async (req, res) => {
    try {
        const body = req.body || {};
        const { fullName, phone, address } = body;

        if (!fullName || fullName.trim() === '') {
            req.flash('error', 'Vui lòng nhập họ và tên.');
            return res.redirect('/info');
        }

        const userId = req.session.user.id;

        const updateData = {
            fullName: fullName.trim(),
            phone: phone ? phone.trim() : '',
            address: address ? address.trim() : ''
        };

        if (req.file && req.file.secure_url) {
            const cloudinaryUrl = req.file.secure_url;
            const fileName = req.file.filename || `${Date.now()}-${req.file.originalname || 'avatar.jpg'}`;
            
            console.log('📤 Upload avatar to GitHub from Cloudinary:', cloudinaryUrl);
            
            const githubUrl = await uploadToGitHub(cloudinaryUrl, fileName);
            
            if (githubUrl) {
                updateData.avatar = githubUrl;
                console.log('✅ Avatar stored on GitHub:', githubUrl);
            } else {
                updateData.avatar = cloudinaryUrl;
                console.log('⚠️ GitHub upload failed, using Cloudinary URL:', cloudinaryUrl);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        req.session.user.fullName = updatedUser.fullName;
        if (updateData.avatar) {
            req.session.user.avatar = updateData.avatar;
        }

        req.flash('success', 'Cập nhật thông tin thành công!');
        res.redirect('/info');
    } catch (error) {
        console.error('❌ UPDATE INFO ERROR:', error);
        req.flash('error', 'Lỗi cập nhật thông tin: ' + error.message);
        res.redirect('/info');
    }
};

// =============================================================
// ĐỔI MẬT KHẨU
// =============================================================

module.exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.user.id;

        if (!currentPassword || !newPassword || !confirmPassword) {
            req.flash('error', 'Vui lòng điền đầy đủ thông tin.');
            return res.redirect('/info');
        }

        if (newPassword !== confirmPassword) {
            req.flash('error', 'Mật khẩu xác nhận không khớp.');
            return res.redirect('/info');
        }

        if (newPassword.length < 6) {
            req.flash('error', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return res.redirect('/info');
        }

        const userData = await User.findById(userId);
        if (!userData) {
            req.flash('error', 'Không tìm thấy tài khoản');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(currentPassword, userData.password);
        if (!isMatch) {
            req.flash('error', 'Mật khẩu hiện tại không đúng.');
            return res.redirect('/info');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        userData.password = hashedPassword;
        await userData.save();

        req.flash('success', 'Đổi mật khẩu thành công!');
        res.redirect('/info');
    } catch (error) {
        console.error('❌ UPDATE PASSWORD ERROR:', error);
        req.flash('error', 'Lỗi đổi mật khẩu: ' + error.message);
        res.redirect('/info');
    }
};