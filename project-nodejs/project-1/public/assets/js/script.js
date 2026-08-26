/* =============================================================
   AUTH COMMON SCRIPT
   Dùng chung cho Login / Register
============================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("SCRIPT JS ĐÃ LOAD");


    /* =========================================================
       HELPER
    ========================================================= */

    window.showError = function (errorElement, message) {

        if (!errorElement) {
            return;
        }

        errorElement.textContent = message;
        errorElement.classList.add("show");
    };


    window.hideError = function (errorElement) {

        if (!errorElement) {
            return;
        }

        errorElement.textContent = "";
        errorElement.classList.remove("show");
    };


    /* =========================================================
       EMAIL VALIDATION

       Gần tương đương:
       Joi.string().trim().email().required()
    ========================================================= */

    window.isValidEmail = function (email) {

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email);
    };


    /* =========================================================
       PHONE VALIDATION

       Joi:
       /^(0|\+84)[0-9]{9}$/

       Hợp lệ:
       0912345678
       0987654321
       +84912345678
    ========================================================= */

    window.isValidPhone = function (phone) {

        const phoneRegex =
            /^(0|\+84)[0-9]{9}$/;

        return phoneRegex.test(phone);
    };


    /* =========================================================
       XỬ LÝ RESPONSE JSON ERROR
    ========================================================= */

    window.handleJsonError = async function (
        response,
        errorElement,
        defaultMessage
    ) {

        try {

            const data =
                await response.json();


            if (
                data &&
                Array.isArray(data.details) &&
                data.details.length > 0
            ) {

                showError(
                    errorElement,
                    data.details[0]
                );

                return true;
            }


            if (
                data &&
                data.message
            ) {

                showError(
                    errorElement,
                    data.message
                );

                return true;
            }


            showError(
                errorElement,
                defaultMessage
            );

            return true;

        }
        catch (error) {

            showError(
                errorElement,
                defaultMessage
            );

            return true;
        }
    };


    /* =========================================================
       TOGGLE HIỆN / ẨN MẬT KHẨU
    ========================================================= */

    const authPasswordToggles =
        document.querySelectorAll(
            ".auth-password-toggle"
        );


    authPasswordToggles.forEach(function (toggleButton) {

        const wrapper =
            toggleButton.closest(
                ".auth-input-icon"
            );


        const passwordInput =
            wrapper
                ? wrapper.querySelector("input")
                : null;


        const icon =
            toggleButton.querySelector("i");


        if (!passwordInput || !icon) {
            return;
        }


        toggleButton.addEventListener(
            "click",
            function () {

                const isVisible =
                    passwordInput.type === "text";


                passwordInput.type =
                    isVisible
                        ? "password"
                        : "text";


                icon.classList.toggle(
                    "fa-eye",
                    isVisible
                );


                icon.classList.toggle(
                    "fa-eye-slash",
                    !isVisible
                );

            }
        );

    });


    /* =========================================================
       MENU TOGGLE (MOBILE)
       CSS đang dùng:
         - header.header .menu.open > ul        -> hiện menu
         - header.header .menu-overlay.active    -> hiện lớp phủ
       Nên JS PHẢI toggle đúng 2 class "open" và "active",
       không phải "active" cho cả hai.
    ========================================================= */

    const menuToggle =
        document.querySelector('.menu-toggle');

    const menu =
        document.querySelector('.menu');

    const menuOverlay =
        document.querySelector('.menu-overlay');


    function openMenu() {
        menu.classList.add('open');
        if (menuOverlay) {
            menuOverlay.classList.add('active');
        }
    }


    function closeMenu() {
        menu.classList.remove('open');
        if (menuOverlay) {
            menuOverlay.classList.remove('active');
        }
    }


    if (menuToggle && menu) {

        menuToggle.addEventListener('click', function (event) {

            event.stopPropagation();

            if (menu.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }

        });


        // Bấm ra ngoài overlay -> đóng menu
        if (menuOverlay) {

            menuOverlay.addEventListener('click', function () {
                closeMenu();
            });

        }


        // Bấm 1 link trong menu -> đóng menu
        menu.querySelectorAll('a').forEach(function (link) {

            link.addEventListener('click', function () {
                closeMenu();
            });

        });


        // Phím Esc -> đóng menu
        document.addEventListener('keydown', function (event) {

            if (event.key === 'Escape') {
                closeMenu();
            }

        });

    } else {

        console.error('❌ Không tìm thấy .menu-toggle hoặc .menu');

    }


    /*------------------*/
    const registerForm =
        document.getElementById('registerForm');

    const registerFormError =
        document.getElementById('registerFormError');


    if (registerForm) {

        registerForm.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                registerFormError.innerHTML = '';


                const formData =
                    new FormData(registerForm);


                try {

                    const response =
                        await fetch(
                            registerForm.action,
                            {
                                method: 'POST',
                                body: formData
                            }
                        );


                    const data =
                        await response.json();


                    // =================================================
                    // VALIDATION ERROR
                    // =================================================

                    if (data.code === 'error') {

                        if (
                            Array.isArray(data.details)
                        ) {

                            registerFormError.innerHTML =
                                data.details
                                    .map(
                                        message =>
                                            `<div>${message}</div>`
                                    )
                                    .join('');

                        } else {

                            registerFormError.innerHTML =
                                `<div>${data.message || 'Có lỗi xảy ra.'}</div>`;

                        }

                        return;
                    }


                    // =================================================
                    // THÀNH CÔNG
                    // =================================================

                    if (data.redirect) {

                        window.location.href =
                            data.redirect;

                        return;
                    }


                    // =================================================
                    // TRƯỜNG HỢP SERVER REDIRECT
                    // =================================================

                    if (
                        response.redirected
                    ) {

                        window.location.href =
                            response.url;

                        return;
                    }


                } catch (error) {

                    console.error(
                        '❌ REGISTER FETCH ERROR:',
                        error
                    );


                    registerFormError.innerHTML =
                        '<div>Có lỗi xảy ra, vui lòng thử lại.</div>';

                }

            }
        );

    }

});