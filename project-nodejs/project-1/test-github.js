// test-github.js
require('dotenv').config();
const axios = require('axios');

(async () => {
    const owner  = process.env.GITHUB_OWNER  || 'chunglop0781';
    const repo   = process.env.GITHUB_REPO   || 'project-cache';
    const token  = process.env.GITHUB_TOKEN;
    const branch = process.env.GITHUB_BRANCH || 'main';
    const dir    = process.env.GITHUB_WEBSITE_PATH || 'project-nodejs/project-1/public/uploads/website/';

    console.log('\n========== KIỂM TRA GITHUB ==========');
    console.log('Owner  :', owner);
    console.log('Repo   :', repo);
    console.log('Branch :', branch);
    console.log('Dir    :', dir);
    console.log('Token  :', token ? token.slice(0, 15) + '...' : '❌ KHÔNG CÓ');
    console.log('======================================\n');

    if (!token) {
        console.log('❌ DỪNG: .env không có GITHUB_TOKEN');
        console.log('   → Thêm dòng sau vào file .env ở root project:');
        console.log('   GITHUB_TOKEN=ghp_xxxxxxxxxxxxx');
        console.log('   → Restart server (Ctrl+C rồi npm start)\n');
        return;
    }

    // 1. Token có hợp lệ không?
    try {
        const me = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${token}` }
        });
        console.log('✅ Token hợp lệ — user:', me.data.login);
    } catch (e) {
        console.log('❌ TOKEN SAI:', e.response?.status, e.response?.data?.message);
        console.log('   → Vào https://github.com/settings/tokens tạo token mới\n');
        return;
    }

    // 2. Repo có tồn tại không? Branch là gì?
    try {
        const r = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { Authorization: `token ${token}` }
        });
        console.log('✅ Repo OK — branch mặc định:', r.data.default_branch);
        console.log('   Quyền push:', r.data.permissions?.push ? '✅ có' : '❌ KHÔNG');

        if (r.data.default_branch !== branch) {
            console.log(`\n⚠️  CẢNH BÁO: .env đặt GITHUB_BRANCH="${branch}"`);
            console.log(`   nhưng repo dùng branch "${r.data.default_branch}"`);
            console.log(`   → Sửa .env: GITHUB_BRANCH=${r.data.default_branch}\n`);
        }

        if (!r.data.permissions?.push) {
            console.log('\n❌ Token thiếu quyền GHI (Contents: write)');
            console.log('   → Vào token settings, cấp quyền Contents: Read and write\n');
            return;
        }
    } catch (e) {
        console.log('❌ Không truy cập được repo:', e.response?.status, e.response?.data?.message);
        return;
    }

    // 3. Thử upload 1 file test
    const testPath = `${dir}test-${Date.now()}.txt`;
    const content = Buffer.from('test').toString('base64');

    try {
        const res = await axios.put(
            `https://api.github.com/repos/${owner}/${repo}/contents/${testPath}`,
            { message: 'Test', content, branch },
            {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        console.log('\n✅✅✅ UPLOAD GITHUB THÀNH CÔNG!');
        console.log('    URL:', res.data.content.download_url);
        console.log('\n👉 GitHub OK — vấn đề nằm ở controller, xem Bước 2.\n');
    } catch (e) {
        console.log('\n❌ UPLOAD FAILED:');
        console.log('   Status :', e.response?.status);
        console.log('   Message:', e.response?.data?.message);
        console.log('\n👉 Tra bảng dưới để fix.\n');
    }
})();