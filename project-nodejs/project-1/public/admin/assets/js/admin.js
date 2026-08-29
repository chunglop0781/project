// =============================================================
// ADMIN JS - 28 TRAVEL
// =============================================================

document.addEventListener("DOMContentLoaded", function() {

    // =============================================================
    // ẨN ALERT KHI KHÔNG CÓ NỘI DUNG
    // =============================================================

    document.querySelectorAll('.admin-alert').forEach(function(alert) {
        var span = alert.querySelector('span');
        if (span && span.textContent.trim() === '') {
            alert.style.display = 'none';
        }
    });

    // =============================================================
    // SIDEBAR TOGGLE
    // =============================================================

    var sidebarToggle = document.getElementById('adminSidebarToggle');
    var sidebarClose = document.getElementById('adminSidebarClose');
    var sidebar = document.getElementById('adminSidebar');
    var overlay = document.getElementById('adminOverlay');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', openSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // =============================================================
    // USER DROPDOWN
    // =============================================================

    var userTrigger = document.getElementById('adminUserTrigger');
    var userDropdown = document.getElementById('adminUserDropdown');

    if (userTrigger && userDropdown) {
        userTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
            userTrigger.classList.toggle('open');
        });

        document.addEventListener('click', function(e) {
            if (!userTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
                userTrigger.classList.remove('open');
            }
        });
    }

    // =============================================================
    // ALERT CLOSE
    // =============================================================

    var alertCloses = document.querySelectorAll('.admin-alert-close');
    alertCloses.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var alert = this.closest('.admin-alert');
            if (alert) {
                alert.style.display = 'none';
            }
        });
    });

    // =============================================================
    // LOGIN FORM
    // =============================================================

    var loginForm = document.querySelector('#loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log('Login form submitted');
        });
    }

    // =============================================================
    // CATEGORY FORM - KHÔNG CHẶN
    // =============================================================

    var categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', function(e) {
            if (typeof tinymce !== 'undefined') {
                var editor = tinymce.get('description');
                if (editor) {
                    editor.save();
                    console.log('✅ TinyMCE content saved');
                }
            }
            console.log('✅ Category form submitting...');
        });
    }

    // =============================================================
    // CHECKBOX ALL
    // =============================================================

    var checkAll = document.getElementById('checkAllCategories');
    if (checkAll) {
        checkAll.addEventListener('change', function() {
            var checkboxes = document.querySelectorAll('input[name="ids"]');
            checkboxes.forEach(function(cb) {
                cb.checked = checkAll.checked;
            });
        });
    }

    // =============================================================
    // DELETE CONFIRM
    // =============================================================

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-delete-url]');
        if (btn) {
            e.preventDefault();
            var url = btn.getAttribute('data-delete-url');
            var confirmMsg = btn.getAttribute('data-confirm') || 'Bạn có chắc chắn muốn xóa?';
            if (confirm(confirmMsg)) {
                fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        window.location.reload();
                    } else {
                        alert(data.message || 'Xóa thất bại');
                    }
                })
                .catch(function() {
                    alert('Có lỗi xảy ra');
                });
            }
        }
    });

    console.log('✅ Admin JS loaded');
});

// =============================================================
// ✅ FIX: ĐẢM BẢO FORM CATEGORY SUBMIT BÌNH THƯỜNG
// =============================================================

// Chạy sau khi DOM load xong để đảm bảo form tồn tại
setTimeout(function() {
    var categoryForm = document.getElementById('categoryForm');
    
    if (categoryForm) {
        // ✅ Gỡ bỏ tất cả event listener cũ bằng cách clone và replace
        var newForm = categoryForm.cloneNode(true);
        categoryForm.parentNode.replaceChild(newForm, categoryForm);
        
        console.log('✅ Category form reset - all old listeners removed');
        
        // ✅ Thêm event listener mới KHÔNG chặn submit
        newForm.addEventListener('submit', function(e) {
            // Đồng bộ TinyMCE
            if (typeof tinymce !== 'undefined') {
                var editor = tinymce.get('description');
                if (editor) {
                    editor.save();
                    console.log('✅ TinyMCE content saved');
                }
            }
            
            // ✅ KHÔNG gọi e.preventDefault()
            console.log('✅ Category form submitting...');
            
            // Form sẽ submit tự nhiên
            return true;
        }, false);
        
        // ✅ Đảm bảo form luôn submit được (dự phòng)
        newForm.addEventListener('submit', function(e) {
            // Cho phép submit bình thường
        }, true); // capture phase
    } else {
        console.warn('⚠️ Category form not found, retrying...');
        // Thử lại sau 500ms nếu form chưa tồn tại
        setTimeout(function() {
            var retryForm = document.getElementById('categoryForm');
            if (retryForm) {
                retryForm.submit = function() {
                    // Ghi đè method submit để đảm bảo gửi dữ liệu
                    HTMLFormElement.prototype.submit.call(retryForm);
                };
                console.log('✅ Category form protection applied (retry)');
            }
        }, 500);
    }
}, 100);