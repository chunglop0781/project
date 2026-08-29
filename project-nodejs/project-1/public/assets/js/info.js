// =============================================================
// INFO PAGE - UPLOAD AVATAR (TỰ ĐỘNG TẠO FORM NẾU THIẾU)
// =============================================================

(function() {
    'use strict';

    console.log('📦 Avatar upload script loaded');

    function initAvatarUpload() {
        // Tìm container
        var container = document.getElementById('avatarSection') || document.querySelector('.profile-avatar-section');
        if (!container) {
            console.error('❌ Không tìm thấy container .profile-avatar-section');
            return;
        }

        // Tìm form, input, preview, result
        var form = document.getElementById('avatarUploadForm');
        var input = document.getElementById('avatarInput');
        var preview = document.getElementById('avatarPreview');
        var resultDiv = document.getElementById('avatarResult');

        // Nếu không có form, tự tạo
        if (!form) {
            console.log('🔧 Form not found, creating dynamically...');

            form = document.createElement('form');
            form.id = 'avatarUploadForm';
            form.className = 'avatar-upload-wrapper';
            form.action = '/info/upload-avatar';
            form.method = 'POST';
            form.enctype = 'multipart/form-data';
            form.setAttribute('data-no-ajax', 'true');

            // Nếu input chưa có, tạo mới
            if (!input) {
                input = document.createElement('input');
                input.id = 'avatarInput';
                input.className = 'profile-input';
                input.type = 'file';
                input.name = 'avatar';
                input.accept = 'image/*';
                input.required = true;
            }

            // Tạo button
            var button = document.createElement('button');
            button.className = 'profile-btn profile-btn-primary';
            button.type = 'submit';
            button.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload Avatar (Kiểm duyệt tự động)';

            form.appendChild(input);
            form.appendChild(button);

            // Chèn form vào sau preview (hoặc cuối container)
            var previewImg = preview || container.querySelector('img');
            if (previewImg) {
                previewImg.parentNode.insertBefore(form, previewImg.nextSibling);
            } else {
                container.appendChild(form);
            }
            console.log('✅ Form created dynamically');
        }

        // Lấy lại các element (đề phòng thay đổi)
        form = document.getElementById('avatarUploadForm') || form;
        input = document.getElementById('avatarInput') || form.querySelector('input[name="avatar"]');
        preview = document.getElementById('avatarPreview') || container.querySelector('img');
        resultDiv = document.getElementById('avatarResult') || container.querySelector('#avatarResult');

        if (!form || !input) {
            console.error('❌ Still missing form or input');
            return;
        }

        console.log('📋 form:', form);
        console.log('📋 input:', input);
        console.log('📋 preview:', preview);
        console.log('📋 resultDiv:', resultDiv);

        // =========================================================
        // PREVIEW ẢNH KHI CHỌN FILE
        // =========================================================
        if (input && preview) {
            input.addEventListener('change', function() {
                var file = this.files && this.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    alert('File ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
                    this.value = '';
                    return;
                }

                var allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)');
                    this.value = '';
                    return;
                }

                var reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // =========================================================
        // SUBMIT FORM BẰNG AJAX
        // =========================================================
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!resultDiv) return;

            var file = input.files && input.files[0];
            if (!file) {
                resultDiv.innerHTML = '<div class="avatar-result avatar-result-error">⚠️ Vui lòng chọn ảnh</div>';
                return;
            }

            resultDiv.innerHTML = '<div class="avatar-result avatar-result-loading"><i class="fas fa-spinner fa-spin"></i> Đang kiểm duyệt...</div>';

            var formData = new FormData(form);

            try {
                var response = await fetch('/info/upload-avatar', {
                    method: 'POST',
                    body: formData
                });

                var data = await response.json();
                console.log('📨 Server response:', data);

                if (data.success) {
                    var newUrl = data.data.url + '?t=' + Date.now();
                    if (preview) preview.src = newUrl;

                    resultDiv.innerHTML = `
                        <div class="avatar-result avatar-result-success">
                            <i class="fas fa-check-circle"></i> ${data.message}
                            <br>
                            <img src="${data.data.url}" alt="Avatar">
                        </div>
                    `;
                    input.value = '';
                } else {
                    resultDiv.innerHTML = `
                        <div class="avatar-result avatar-result-error">
                            <i class="fas fa-exclamation-circle"></i> ${data.message || 'Có lỗi xảy ra'}
                        </div>
                    `;
                }
            } catch (err) {
                console.error('❌ Upload error:', err);
                resultDiv.innerHTML = `<div class="avatar-result avatar-result-error">❌ Lỗi kết nối: ${err.message}</div>`;
            }
        });

        console.log('✅ Avatar upload ready');
    }

    // Chạy khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAvatarUpload);
    } else {
        initAvatarUpload();
    }
})();