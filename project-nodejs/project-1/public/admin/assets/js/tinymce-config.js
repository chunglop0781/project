(function() {
  'use strict';

  function initTinyMCE(selector) {
    if (typeof tinymce === 'undefined') {
      console.warn('⚠️ TinyMCE chưa được load. Vui lòng kiểm tra script TinyMCE.');
      return;
    }

    var targetSelector = selector || 'textarea.tinymce-editor';

    tinymce.init({
      selector: targetSelector,
      language: 'vi',
      
      // =============================================================
      // ẨN QUẢNG CÁO
      // =============================================================
      promotion: false,
      branding: false,
      
      // =============================================================
      // MENUBAR - ĐẦY ĐỦ NHƯ DEMO
      // =============================================================
      menubar: 'file edit view insert format tools table help',
      
      // =============================================================
      // PLUGINS - ĐẦY ĐỦ NHƯ DEMO
      // =============================================================
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
        'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
        'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount',
        'emoticons', 'codesample'
      ],
      
      // =============================================================
      // TOOLBAR - ĐẦY ĐỦ NHƯ DEMO
      // =============================================================
      toolbar: 'undo redo | blocks | bold italic underline strikethrough | ' +
        'alignleft aligncenter alignright alignjustify | ' +
        'bullist numlist outdent indent | ' +
        'link image media | ' +
        'table | charmap emoticons codesample | ' +
        'preview fullscreen | help',
      
      // =============================================================
      // QUAN TRỌNG: HIỂN THỊ ĐẦY ĐỦ, KHÔNG THU GỌN
      // =============================================================
      toolbar_mode: 'wrap',  // Hoặc bỏ dòng này để mặc định
      
      height: 400,
      resize: true,
      
      // =============================================================
      // SETUP - ẨN PROMOTION SAU KHI LOAD
      // =============================================================
      setup: function(editor) {
        editor.on('init', function() {
          console.log('✅ TinyMCE initialized');
          
          // Ẩn promotion sau khi init
          setTimeout(function() {
            var promo = document.querySelector('.tox-promotion');
            if (promo) {
              promo.style.display = 'none';
            }
            var branding = document.querySelector('.tox-statusbar__branding');
            if (branding) {
              branding.style.display = 'none';
            }
          }, 100);
        });
        
        editor.on('change', function() {
          editor.save();
        });
      },
      
      content_css: [
        'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap'
      ],
      
      style_formats: [
        { title: 'Heading 1', format: 'h1' },
        { title: 'Heading 2', format: 'h2' },
        { title: 'Heading 3', format: 'h3' },
        { title: 'Heading 4', format: 'h4' },
        { title: 'Paragraph', format: 'p' },
        { title: 'Blockquote', format: 'blockquote' },
        { title: 'Code', format: 'code' },
        { title: 'Preformatted', format: 'pre' }
      ],
      
      content_style: 'body { font-family: "Be Vietnam Pro", Arial, sans-serif; font-size: 14px; line-height: 1.6; }'
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var textareas = document.querySelectorAll('textarea.tinymce-editor');
    if (textareas.length > 0) {
      setTimeout(function() {
        initTinyMCE('textarea.tinymce-editor');
      }, 200);
    }
  });

  window.initTinyMCE = initTinyMCE;
  window.destroyTinyMCE = function() {
    if (typeof tinymce !== 'undefined') {
      tinymce.remove();
    }
  };

  console.log('✅ TinyMCE config loaded');

})();