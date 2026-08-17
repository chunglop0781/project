/* =============================================================
   ADMIN JS - 28 TRAVEL
   Mục lục:
   1. Sidebar toggle (mobile)
   2. Dropdown user menu (topbar)
   3. Đóng alert / flash message
   4. Xác nhận xóa (data-confirm + data-delete-url)
   5. Xem trước ảnh khi upload
   6. Checkbox chọn tất cả trong bảng
   7. Toggle hiện/ẩn mật khẩu (trang đăng nhập)
============================================================= */


/* =============================================================
   1. SIDEBAR TOGGLE (MOBILE)
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.querySelector("#adminSidebar");
    const toggleButton = document.querySelector("#adminSidebarToggle");
    const closeButton = document.querySelector("#adminSidebarClose");
    const overlay = document.querySelector("#adminOverlay");

    if (!sidebar || !overlay) {
        return;
    }

    function openSidebar() {
        sidebar.classList.add("open");
        overlay.classList.add("show");
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    }

    if (toggleButton) {
        toggleButton.addEventListener("click", function () {
            sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeSidebar);
    }

    overlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

});


/* =============================================================
   2. DROPDOWN USER MENU (TOPBAR)
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const trigger = document.querySelector("#adminUserTrigger");
    const dropdown = document.querySelector("#adminUserDropdown");

    if (!trigger || !dropdown) {
        return;
    }

    function closeDropdown() {
        dropdown.classList.remove("show");
        trigger.classList.remove("open");
    }

    trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        const isOpen = dropdown.classList.contains("show");
        isOpen ? closeDropdown() : (dropdown.classList.add("show"), trigger.classList.add("open"));
    });

    document.addEventListener("click", function (event) {
        if (!dropdown.contains(event.target) && !trigger.contains(event.target)) {
            closeDropdown();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeDropdown();
        }
    });

});


/* =============================================================
   3. ĐÓNG ALERT / FLASH MESSAGE
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const alerts = document.querySelectorAll(".admin-alert");

    alerts.forEach(function (alertEl) {

        const closeButton = alertEl.querySelector(".admin-alert-close");

        function hideAlert() {
            alertEl.style.transition = "opacity .2s ease";
            alertEl.style.opacity = "0";
            setTimeout(function () {
                alertEl.remove();
            }, 200);
        }

        if (closeButton) {
            closeButton.addEventListener("click", hideAlert);
        }

        setTimeout(hideAlert, 5000);

    });

});


/* =============================================================
   4. XÁC NHẬN XÓA
   Áp dụng cho mọi phần tử có: data-confirm + data-delete-url
   (VD: nút xóa tour, xóa bài viết trong bảng danh sách)
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const deleteButtons = document.querySelectorAll("[data-delete-url]");

    deleteButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const message = button.getAttribute("data-confirm") || "Bạn có chắc muốn xóa mục này?";
            const url = button.getAttribute("data-delete-url");

            if (!url) {
                return;
            }

            if (!confirm(message)) {
                return;
            }

            button.disabled = true;

            fetch(url, { method: "DELETE" })
                .then(function (response) {
                    return response.json().catch(function () {
                        return {};
                    });
                })
                .then(function (data) {
                    if (data && data.success === false) {
                        alert("Có lỗi xảy ra, vui lòng thử lại.");
                        button.disabled = false;
                        return;
                    }
                    // Xóa xong -> tải lại trang để danh sách cập nhật
                    window.location.reload();
                })
                .catch(function (error) {
                    console.log(error);
                    alert("Có lỗi xảy ra, vui lòng thử lại.");
                    button.disabled = false;
                });

        });

    });

});


/* =============================================================
   5. XEM TRƯỚC ẢNH KHI UPLOAD
   Áp dụng cho mọi ô upload dạng: .admin-upload-box chứa
   1 <img> và 1 input[type=file]
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const uploadBoxes = document.querySelectorAll(".admin-upload-box");

    uploadBoxes.forEach(function (box) {

        const fileInput = box.querySelector('input[type="file"]');
        const previewImage = box.querySelector("img");

        if (!fileInput || !previewImage) {
            return;
        }

        fileInput.addEventListener("change", function () {

            const file = fileInput.files && fileInput.files[0];

            if (!file) {
                return;
            }

            const reader = new FileReader();

            reader.onload = function (event) {
                previewImage.src = event.target.result;
            };

            reader.readAsDataURL(file);

        });

    });

});


/* =============================================================
   6. CHECKBOX CHỌN TẤT CẢ TRONG BẢNG
   Checkbox có [data-select-all] sẽ tick/untick toàn bộ
   checkbox còn lại trong cùng bảng
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const selectAllCheckboxes = document.querySelectorAll("[data-select-all]");

    selectAllCheckboxes.forEach(function (selectAll) {

        const table = selectAll.closest("table");

        if (!table) {
            return;
        }

        const rowCheckboxes = table.querySelectorAll('tbody input[type="checkbox"]');

        selectAll.addEventListener("change", function () {
            rowCheckboxes.forEach(function (checkbox) {
                checkbox.checked = selectAll.checked;
            });
        });

        rowCheckboxes.forEach(function (checkbox) {
            checkbox.addEventListener("change", function () {
                const allChecked = Array.from(rowCheckboxes).every(function (item) {
                    return item.checked;
                });
                selectAll.checked = allChecked;
            });
        });

    });

});


/* =============================================================
   7. TOGGLE HIỆN/ẨN MẬT KHẨU (TRANG ĐĂNG NHẬP)
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const toggleButton = document.querySelector(".admin-password-toggle");

    if (!toggleButton) {
        return;
    }

    const passwordInput = toggleButton.closest(".admin-input-icon").querySelector("input");
    const icon = toggleButton.querySelector("i");

    if (!passwordInput || !icon) {
        return;
    }

    toggleButton.addEventListener("click", function () {

        const isVisible = passwordInput.type === "text";

        passwordInput.type = isVisible ? "password" : "text";

        icon.classList.toggle("fa-eye", isVisible);
        icon.classList.toggle("fa-eye-slash", !isVisible);

    });

});
