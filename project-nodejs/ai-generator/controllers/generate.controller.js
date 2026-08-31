
const tts = require('google-tts-api');

const {
    getOctokit,
    owner,
    repo,
    branch
} = require('../config/github.config');



// =========================================================
// HÀM PHÁT HIỆN NGÔN NGỮ TỪ TEXT
// =========================================================
function detectLanguage(text) {
    if (!text || typeof text !== 'string') {
        return 'en';
    }

    // -----------------------------------------------------
    // Tiếng Việt
    // -----------------------------------------------------
    if (
        /[ăắằẳẵặâấầẩẫậđêếềểễệôốồổỗộơớờởỡợưứừửữự]/i
            .test(text)
    ) {
        return 'vi';
    }

    // -----------------------------------------------------
    // Tiếng Hàn
    // -----------------------------------------------------
    if (/[\uAC00-\uD7AF]/.test(text)) {
        return 'ko';
    }

    // -----------------------------------------------------
    // Tiếng Nhật
    // -----------------------------------------------------
    if (/[\u3040-\u30FF]/.test(text)) {
        return 'ja';
    }

    // -----------------------------------------------------
    // Tiếng Trung
    // -----------------------------------------------------
    if (/[\u4E00-\u9FFF]/.test(text)) {
        return 'zh';
    }

    // -----------------------------------------------------
    // Tiếng Đức
    // -----------------------------------------------------
    if (/[äöüß]/i.test(text)) {
        return 'de';
    }

    // -----------------------------------------------------
    // Tiếng Pháp
    // -----------------------------------------------------
    if (/[àâçéèêëîïôùûüÿ]/i.test(text)) {
        return 'fr';
    }

    // -----------------------------------------------------
    // Tiếng Tây Ban Nha
    // -----------------------------------------------------
    if (/[ñáéíóúü¿¡]/i.test(text)) {
        return 'es';
    }

    // -----------------------------------------------------
    // Mặc định: Tiếng Anh
    // -----------------------------------------------------
    return 'en';
}



// =========================================================
// CHUẨN HÓA LANGUAGE CHO GOOGLE TTS
// =========================================================
function normalizeLanguage(lang) {
    if (!lang) {
        return 'en';
    }

    const normalized =
        String(lang)
            .trim()
            .toLowerCase();

    const languageMap = {

        // English
        'en-us': 'en',
        'en-gb': 'en',
        'en-au': 'en',
        'en-ca': 'en',

        // Vietnamese
        'vi-vn': 'vi',

        // Japanese
        'ja-jp': 'ja',

        // Korean
        'ko-kr': 'ko',

        // Chinese
        'zh-cn': 'zh-CN',
        'zh-tw': 'zh-TW',

        // French
        'fr-fr': 'fr',
        'fr-ca': 'fr',

        // German
        'de-de': 'de',

        // Spanish
        'es-es': 'es',
        'es-mx': 'es',

        // Italian
        'it-it': 'it',

        // Portuguese
        'pt-br': 'pt',
        'pt-pt': 'pt',

        // Russian
        'ru-ru': 'ru'
    };

    // -----------------------------------------------------
    // Có mapping cụ thể
    // -----------------------------------------------------
    if (languageMap[normalized]) {
        return languageMap[normalized];
    }

    // -----------------------------------------------------
    // Ví dụ:
    // en-US → en
    // vi-VN → vi
    // ja-JP → ja
    // -----------------------------------------------------
    if (normalized.includes('-')) {
        return normalized.split('-')[0];
    }

    return normalized;
}



// =========================================================
// HÀM UPLOAD FILE LÊN GITHUB
// =========================================================
const uploadToGithub = async (
    fileBuffer,
    fileName,
    subfolder = 'audio'
) => {

    if (!Buffer.isBuffer(fileBuffer)) {
        throw new Error(
            'File buffer không hợp lệ'
        );
    }

    if (!fileName) {
        throw new Error(
            'Tên file không được để trống'
        );
    }

    const contentBase64 =
        fileBuffer.toString('base64');

    const githubPath =
        `project-nodejs/ai-generator/${subfolder}/${fileName}`;

    try {

        console.log(
            '📤 Upload GitHub:',
            githubPath
        );

        // =================================================
        // LOAD OCTOKIT KHI CẦN
        // Tránh ERR_REQUIRE_ESM trên Vercel
        // =================================================
        const octokit = await getOctokit();

        const response =
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: githubPath,
                message: `Upload ${subfolder}: ${fileName}`,
                content: contentBase64,
                branch
            });

        const rawUrl =
            `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${githubPath}`;

        console.log(
            '✅ GitHub upload thành công'
        );

        console.log(
            '🔗 Raw URL:',
            rawUrl
        );

        return {
            githubPath,
            rawUrl,
            sha: response.data.content?.sha || null
        };

    } catch (error) {

        console.error(
            '❌ GitHub upload error:',
            error.response?.data || error.message
        );

        throw new Error(
            'Upload GitHub thất bại: ' +
            (
                error.response?.data?.message ||
                error.message
            )
        );
    }
};



// =========================================================
// TẠO AUDIO + UPLOAD GITHUB
// =========================================================
const generateAudioAndUpload = async (
    text,
    lang = 'vi',
    slow = false
) => {

    if (
        !text ||
        typeof text !== 'string' ||
        !text.trim()
    ) {
        throw new Error(
            'Nội dung audio không được để trống'
        );
    }

    // -----------------------------------------------------
    // Chuẩn hóa language lần cuối
    // -----------------------------------------------------
    const normalizedLang =
        normalizeLanguage(lang);

    const fileName =
        `audio_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}.mp3`;

    try {

        console.log(
            '--------------------------------'
        );

        console.log(
            '🎙️ TẠO AUDIO'
        );

        console.log(
            '🌐 Lang nhận vào:',
            lang
        );

        console.log(
            '🌐 Lang gửi Google TTS:',
            normalizedLang
        );

        console.log(
            '🐌 Slow:',
            Boolean(slow)
        );

        console.log(
            '📄 File:',
            fileName
        );

        console.log(
            '--------------------------------'
        );

        // -------------------------------------------------
        // Google TTS
        // -------------------------------------------------
        const audioBase64 =
            await tts.getAudioBase64(
                text,
                {
                    lang: normalizedLang,
                    slow: Boolean(slow),
                    host: 'https://translate.google.com'
                }
            );

        if (!audioBase64) {
            throw new Error(
                'Google TTS không trả về dữ liệu audio'
            );
        }

        // -------------------------------------------------
        // Convert Base64 → Buffer
        // -------------------------------------------------
        const buffer =
            Buffer.from(
                audioBase64,
                'base64'
            );

        if (!buffer.length) {
            throw new Error(
                'Audio tạo ra có kích thước bằng 0'
            );
        }

        console.log(
            `🎵 Audio size: ${buffer.length} bytes`
        );

        // -------------------------------------------------
        // Upload GitHub
        // -------------------------------------------------
        const result =
            await uploadToGithub(
                buffer,
                fileName,
                'audio'
            );

        // -------------------------------------------------
        // Return
        // -------------------------------------------------
        return {
            fileName,
            language: normalizedLang,
            size: buffer.length,
            ...result
        };

    } catch (error) {

        console.error(
            '❌ Generate audio error:',
            error.message
        );

        throw new Error(
            'Lỗi tạo audio: ' +
            error.message
        );
    }
};



// =========================================================
// TẠO ẢNH PLACEHOLDER
// =========================================================
const generateImageAndUpload = async (
    prompt
) => {

    throw new Error(
        'Chức năng tạo ảnh chưa được cấu hình'
    );
};



// =========================================================
// CONTROLLER CHÍNH
// =========================================================
exports.generate = async (
    req,
    res
) => {

    try {

        // -------------------------------------------------
        // Lấy dữ liệu request
        // -------------------------------------------------
        const {
            prompt,
            type,
            lang: userLang,
            slow = false,
            text
        } = req.body || {};

        // -------------------------------------------------
        // Ưu tiên prompt
        // Nếu không có prompt thì dùng text
        // -------------------------------------------------
        const content =
            typeof prompt === 'string' &&
            prompt.trim()
                ? prompt.trim()
                : typeof text === 'string'
                    ? text.trim()
                    : '';

        // -------------------------------------------------
        // LOG
        // -------------------------------------------------
        console.log('');
        console.log(
            '========== GENERATE =========='
        );

        console.log(
            'TYPE:',
            type
        );

        console.log(
            'CONTENT:',
            content
        );

        console.log(
            'USER LANG:',
            userLang || '(auto)'
        );

        console.log(
            'SLOW:',
            Boolean(slow)
        );

        console.log(
            '=============================='
        );

        // =================================================
        // KIỂM TRA CONTENT
        // =================================================
        if (!content) {

            return res.status(400).json({
                success: false,
                message:
                    'Thiếu nội dung (prompt hoặc text)'
            });
        }

        // =================================================
        // AUDIO
        // =================================================
        if (type === 'audio') {

            // -------------------------------------------------
            // Nếu frontend gửi lang:
            //     en-US
            //
            // Nếu không:
            //     detectLanguage()
            // -------------------------------------------------
            const detectedLang =
                userLang ||
                detectLanguage(content);

            // -------------------------------------------------
            // Chuẩn hóa
            // -------------------------------------------------
            const lang =
                normalizeLanguage(
                    detectedLang
                );

            console.log(
                '🌐 Ngôn ngữ phát hiện:',
                detectedLang
            );

            console.log(
                '🌐 Ngôn ngữ sau normalize:',
                lang
            );

            try {

                const data =
                    await generateAudioAndUpload(
                        content,
                        lang,
                        slow
                    );

                return res.status(200).json({

                    success: true,

                    message:
                        'Tạo audio thành công và upload lên GitHub',

                    data
                });

            } catch (err) {

                console.error(
                    '❌ AUDIO ERROR:',
                    err.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        'Lỗi tạo audio: ' +
                        err.message
                });
            }
        }

        // =================================================
        // IMAGE
        // =================================================
        if (type === 'image') {

            return res.status(501).json({

                success: false,

                message:
                    'Chức năng tạo ảnh chưa hỗ trợ'
            });
        }

        // =================================================
        // CÁC TYPE KHÁC
        // =================================================
        return res.status(200).json({

            success: true,

            message:
                'Server nhận prompt thành công!',

            data: {
                content,
                type: type || null
            }
        });

    } catch (error) {

        console.error(
            '🔥 GENERATE CONTROLLER ERROR:',
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                'Có lỗi xảy ra!'
        });
    }
};

