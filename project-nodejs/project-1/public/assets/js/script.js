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
  // Bấm ☰ để mở/đóng
  menuToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    menuEl.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Di chuột vào ☰ thì tự mở
  menuToggle.addEventListener('mouseenter', openMenu);

  // Bấm vào lớp phủ mờ (overlay) thì đóng menu
  overlayEl.addEventListener('click', closeMenu);
}

// Bấm "Tour Trong Nước" / "Tour Nước Ngoài" để mở dropdown con
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

// Bấm phím Esc để đóng menu nhanh
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