document.addEventListener("DOMContentLoaded", () => {
    AOS.init({
        duration: 800,
        once: true
    });
});

const menuToggle = document.querySelector('.menu-toggle');
const menuEl = document.querySelector('.menu');
const overlayEl = document.querySelector('.menu-overlay');

function openMenu() {
  menuEl.classList.add('open');
  overlayEl.classList.add('active');
}

function closeMenu() {
  menuEl.classList.remove('open');
  overlayEl.classList.remove('active');
  document.querySelectorAll('.has-dropdown.open').forEach(el => el.classList.remove('open'));
}

if (menuToggle && menuEl && overlayEl) {
  menuToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    menuEl.classList.contains('open') ? closeMenu() : openMenu();
  });

  menuToggle.addEventListener('mouseenter', openMenu);

  overlayEl.addEventListener('click', closeMenu);
}

document.querySelectorAll('.has-dropdown > a').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const parent = this.parentElement;
    const isOpen = parent.classList.contains('open');

    document.querySelectorAll('.has-dropdown.open').forEach(el => el.classList.remove('open'));

    if (!isOpen) parent.classList.add('open');
  });
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeMenu();
});

document.addEventListener("DOMContentLoaded", () => {

    const section2Swiper = new Swiper(".section-2-swiper", {
        slidesPerView: 3,
        spaceBetween: 14,

        navigation: {
            nextEl: ".section-2-arrow-next",
            prevEl: ".section-2-arrow-prev"
        },

        breakpoints: {
            0: {
                slidesPerView: 1
            },

            576: {
                slidesPerView: 2
            },

            1000: {
                slidesPerView: 3
            }
        }
    });

});

document.addEventListener("DOMContentLoaded", () => {

    const countdowns = document.querySelectorAll("[clock-expire]");

    countdowns.forEach(countdown => {

        const expireTime = new Date(
            countdown.getAttribute("clock-expire")
        ).getTime();

        const days = countdown.querySelector(".countdown-days");
        const hours = countdown.querySelector(".countdown-hours");
        const minutes = countdown.querySelector(".countdown-minutes");
        const seconds = countdown.querySelector(".countdown-seconds");

        function updateCountdown() {

            const now = new Date().getTime();

            const distance = expireTime - now;

            if (distance <= 0) {
                days.textContent = "00";
                hours.textContent = "00";
                minutes.textContent = "00";
                seconds.textContent = "00";
                return;
            }

            const day = Math.floor(distance / (1000 * 60 * 60 * 24));

            const hour = Math.floor(
                (distance % (1000 * 60 * 60 * 24)) /
                (1000 * 60 * 60)
            );

            const minute = Math.floor(
                (distance % (1000 * 60 * 60)) /
                (1000 * 60)
            );

            const second = Math.floor(
                (distance % (1000 * 60)) /
                1000
            );

            days.textContent = String(day).padStart(2, "0");
            hours.textContent = String(hour).padStart(2, "0");
            minutes.textContent = String(minute).padStart(2, "0");
            seconds.textContent = String(second).padStart(2, "0");
        }

        updateCountdown();

        setInterval(updateCountdown, 1000);
    });

});

// =========================================================
// SECTION 3 - KHUYẾN MÃI
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const section3Swiper = new Swiper(".section-3-swiper", {

        slidesPerView: 3,

        spaceBetween: 14,

        loop: true,

        autoplay: {
            delay: 3000,
            disableOnInteraction: false
        },

        pagination: {
            el: ".section-3-swiper .swiper-pagination",
            clickable: true
        },

        breakpoints: {

            0: {
                slidesPerView: 1,
                spaceBetween: 10
            },

            576: {
                slidesPerView: 2,
                spaceBetween: 12
            },

            1000: {
                slidesPerView: 3,
                spaceBetween: 14
            }

        }

    });

});

/* =========================================================
   SECTION 11 - TÍNH TIỀN HÀNH KHÁCH
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const booking = document.querySelector(".sec-11-booking");

    if (!booking) return;


    /* =====================================================
       TỔNG TIỀN
    ===================================================== */

    const totalElement = booking.querySelector(
        "#sec-11-total-price"
    );

    if (!totalElement) return;


    /* =====================================================
       FORMAT TIỀN
    ===================================================== */

    function formatMoney(number) {

        return new Intl.NumberFormat("vi-VN").format(number);

    }


    /* =====================================================
       TÍNH TỔNG
    ===================================================== */

    function calculateTotal() {

        let total = 0;


        const rows = booking.querySelectorAll(
            ".sec-11-passenger-row"
        );


        rows.forEach(function (row) {

            const input = row.querySelector(
                ".sec-11-passenger-input"
            );

            const priceElement = row.querySelector(
                ".sec-11-passenger-price"
            );


            if (!input || !priceElement) {
                return;
            }


            /* ---------------------------------------------
               SỐ LƯỢNG
            --------------------------------------------- */

            let quantity = parseInt(
                input.value,
                10
            );


            if (isNaN(quantity)) {

                quantity = 0;

            }


            /* ---------------------------------------------
               MIN / MAX
            --------------------------------------------- */

            let min = parseInt(
                input.getAttribute("min"),
                10
            );

            let max = parseInt(
                input.getAttribute("max"),
                10
            );


            if (isNaN(min)) {
                min = 0;
            }


            if (isNaN(max)) {
                max = 99;
            }


            /* ---------------------------------------------
               GIỚI HẠN
            --------------------------------------------- */

            if (quantity < min) {

                quantity = min;

            }


            if (quantity > max) {

                quantity = max;

            }


            input.value = quantity;


            /* ---------------------------------------------
               GIÁ
               LẤY TRỰC TIẾP TỪ INPUT
            --------------------------------------------- */

            const price = parseInt(
                input.getAttribute("data-price"),
                10
            );


            if (isNaN(price)) {

                console.error(
                    "Không tìm thấy data-price:",
                    input
                );

                return;

            }


            /* ---------------------------------------------
               TIỀN LOẠI KHÁCH
            --------------------------------------------- */

            const itemTotal =
                quantity * price;


            /* ---------------------------------------------
               CỘNG VÀO TỔNG
            --------------------------------------------- */

            total += itemTotal;


            /* ---------------------------------------------
               HIỂN THỊ GIÁ
            --------------------------------------------- */

            priceElement.textContent =
                quantity +
                "x" +
                formatMoney(price) +
                " đ";

        });


        /* =================================================
           HIỂN THỊ TỔNG
        ================================================= */

        totalElement.textContent =
            formatMoney(total) +
            " đ";

    }


    /* =====================================================
       XỬ LÝ TỪNG DÒNG
    ===================================================== */

    const rows = booking.querySelectorAll(
        ".sec-11-passenger-row"
    );


    rows.forEach(function (row) {

        const input = row.querySelector(
            ".sec-11-passenger-input"
        );

        const minusButton = row.querySelector(
            ".sec-11-quantity-minus"
        );

        const plusButton = row.querySelector(
            ".sec-11-quantity-plus"
        );


        if (
            !input ||
            !minusButton ||
            !plusButton
        ) {
            return;
        }


        /* =================================================
           NÚT GIẢM
        ================================================= */

        minusButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                let value = parseInt(
                    input.value,
                    10
                );


                if (isNaN(value)) {

                    value = 0;

                }


                let min = parseInt(
                    input.getAttribute("min"),
                    10
                );


                if (isNaN(min)) {

                    min = 0;

                }


                if (value > min) {

                    value--;

                }


                input.value = value;


                calculateTotal();

            }
        );


        /* =================================================
           NÚT TĂNG
        ================================================= */

        plusButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                let value = parseInt(
                    input.value,
                    10
                );


                if (isNaN(value)) {

                    value = 0;

                }


                let max = parseInt(
                    input.getAttribute("max"),
                    10
                );


                if (isNaN(max)) {

                    max = 99;

                }


                if (value < max) {

                    value++;

                }


                input.value = value;


                calculateTotal();

            }
        );


        /* =================================================
           NHẬP BẰNG BÀN PHÍM
        ================================================= */

        input.addEventListener(
            "input",
            function () {

                calculateTotal();

            }
        );


        input.addEventListener(
            "change",
            function () {

                calculateTotal();

            }
        );

    });


    /* =====================================================
       TÍNH LẦN ĐẦU
    ===================================================== */

    calculateTotal();

});