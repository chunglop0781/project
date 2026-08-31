// Chọn các phần tử DOM
const typeBtns = document.querySelectorAll('.type-btn');
const promptTextarea = document.getElementById('prompt');
const generateBtn = document.getElementById('generateBtn');
const resultBox = document.getElementById('resultBox');
const languageSelect = document.getElementById('languageSelect');

let selectedType = 'image'; // mặc định

// Xử lý chọn loại
typeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        typeBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedType = this.dataset.type;
    });
});

// Xử lý tạo nội dung
generateBtn.addEventListener('click', async () => {
    const prompt = promptTextarea.value.trim();
    if (!prompt) {
        resultBox.innerHTML = '<p style="color:red;">⚠️ Vui lòng nhập prompt!</p>';
        return;
    }

    // Lấy ngôn ngữ từ dropdown
    const langValue = languageSelect.value;
    // Nếu chọn 'auto' thì không gửi lang (để server tự detect)
    const lang = langValue === 'auto' ? undefined : langValue;

    // Hiển thị đang tải
    resultBox.innerHTML = '<p>⏳ Đang tạo... Vui lòng chờ.</p>';

    try {
        const response = await fetch('/api/generate/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: selectedType,
                prompt: prompt,
                lang: lang // gửi undefined nếu auto
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Lỗi không xác định');
        }

        // Xử lý kết quả theo type
        if (selectedType === 'image') {
            const imageUrl = data.data.rawUrl;
            resultBox.innerHTML = `
                <img src="${imageUrl}" alt="Kết quả" style="max-width:100%; max-height:400px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
                <p><a href="${imageUrl}" target="_blank">📥 Tải xuống</a></p>
            `;
        } else if (selectedType === 'audio') {
            const audioUrl = data.data.rawUrl;
            resultBox.innerHTML = `
                <audio controls style="width:100%; margin-bottom:10px;">
                    <source src="${audioUrl}" type="audio/mpeg">
                    Trình duyệt của bạn không hỗ trợ audio.
                </audio>
                <p><a href="${audioUrl}" target="_blank">📥 Tải xuống MP3</a></p>
            `;
        } else {
            resultBox.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }

    } catch (error) {
        console.error(error);
        resultBox.innerHTML = `<p style="color:red;">❌ Lỗi: ${error.message}</p>`;
    }
});