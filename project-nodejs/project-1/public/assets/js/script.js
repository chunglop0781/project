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