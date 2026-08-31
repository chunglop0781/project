const tts = require('google-tts-api');
const { octokit, owner, repo, branch } = require('../config/github.config');

// ---- Hàm phát hiện ngôn ngữ từ text ----
function detectLanguage(text) {
    // Kiểm tra Tiếng Việt (có dấu)
    if (/[áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/i.test(text)) {
        return 'vi';
    }
    // Tiếng Nhật (Hiragana, Katakana, Kanji)
    if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(text)) {
        return 'ja';
    }
    // Tiếng Trung (Kanji)
    if (/[\u4E00-\u9FFF]/.test(text)) {
        return 'zh';
    }
    // Tiếng Hàn
    if (/[\uAC00-\uD7AF]/.test(text)) {
        return 'ko';
    }
    // Tiếng Pháp
    if (/[àâçéèêëîïôùûüÿ]/i.test(text)) {
        return 'fr';
    }
    // Tiếng Đức
    if (/[äöüß]/i.test(text)) {
        return 'de';
    }
    // Tiếng Tây Ban Nha
    if (/[ñáéíóúü]/i.test(text)) {
        return 'es';
    }
    // Mặc định tiếng Anh
    return 'en';
}

// ---- Hàm upload chung lên GitHub ----
const uploadToGithub = async (fileBuffer, fileName, subfolder = 'audio') => {
    const contentBase64 = fileBuffer.toString('base64');
    const githubPath = `project-nodejs/ai-generator/${subfolder}/${fileName}`;
    const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: githubPath,
        message: `Upload ${subfolder}: ${fileName}`,
        content: contentBase64,
        branch: branch
    });
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${githubPath}`;
    return { githubPath, rawUrl, sha: response.data.content.sha };
};

// ---- Tạo audio trực tiếp bằng API Google TTS ----
const generateAudioAndUpload = async (text, lang = 'vi', slow = false) => {
    const fileName = `audio_${Date.now()}.mp3`;
    try {
        const audioBase64 = await tts.getAudioBase64(text, {
            lang: lang,
            slow: slow,
            host: 'https://translate.google.com',
        });
        const buffer = Buffer.from(audioBase64, 'base64');
        const result = await uploadToGithub(buffer, fileName, 'audio');
        return { fileName, ...result };
    } catch (error) {
        throw new Error('Lỗi tạo audio: ' + error.message);
    }
};

// ---- Tạo ảnh placeholder (nếu cần) ----
const generateImageAndUpload = async (prompt) => {
    throw new Error('Chức năng tạo ảnh chưa được cấu hình');
};

// ---- Controller chính ----
exports.generate = async (req, res) => {
    try {
        const { prompt, type, lang: userLang, slow = false, text } = req.body;
        const content = prompt || text;

        console.log("========== GENERATE ==========");
        console.log("TYPE:", type);
        console.log("CONTENT:", content);
        console.log("==============================");

        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Thiếu nội dung (prompt hoặc text)"
            });
        }

        if (type === 'audio') {
            // Tự động phát hiện ngôn ngữ nếu không có userLang
            const lang = userLang || detectLanguage(content);
            console.log("🌐 Ngôn ngữ phát hiện:", lang);

            try {
                const data = await generateAudioAndUpload(content, lang, slow);
                return res.json({
                    success: true,
                    message: "Tạo audio thành công và upload lên GitHub",
                    data
                });
            } catch (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Lỗi tạo audio: " + err.message
                });
            }
        }

        if (type === 'image') {
            return res.status(501).json({ success: false, message: "Chức năng tạo ảnh chưa hỗ trợ" });
        }

        // Các loại khác
        res.json({
            success: true,
            message: "Server nhận prompt thành công!",
            data: { content, type }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra!"
        });
    }
};