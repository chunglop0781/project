const express = require('express');
const router = express.Router();
const { moderateAndUpload } = require('../../middlewares/uploadWithModeration');
const requireAuth = require('../../middlewares/requireAuth');
const User = require('../../models/user.model');

// =============================================================
// UPLOAD AVATAR - Cần đăng nhập + Cập nhật database
// =============================================================
router.post('/avatar', 
  requireAuth, // ✅ Bắt buộc đăng nhập
  moderateAndUpload('public/uploads/profiles', 'image'),
  async (req, res) => {
    try {
      // Lấy user từ session
      const userId = req.session.user.id;
      
      // Cập nhật avatar trong database
      const user = await User.findByIdAndUpdate(userId, {
        avatar: req.file.secure_url
      }, { new: true });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }

      // Cập nhật session
      req.session.user.avatar = req.file.secure_url;
      req.session.user.fullName = user.fullName;
      
      // Lưu session
      req.session.save();

      console.log(`✅ Avatar updated for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Upload avatar thành công!',
        data: {
          url: req.file.secure_url,
          public_id: req.file.public_id
        }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// =============================================================
// UPLOAD ẢNH REVIEW - Cần đăng nhập
// =============================================================
router.post('/review', 
  requireAuth,
  moderateAndUpload('public/uploads/reviews', 'image'),
  (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Upload ảnh đánh giá thành công!',
        data: {
          url: req.file.secure_url,
          public_id: req.file.public_id
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// =============================================================
// UPLOAD ẢNH CHO KHÁCH HÀNG - Cần đăng nhập
// =============================================================
router.post('/customer', 
  requireAuth,
  moderateAndUpload('public/uploads/customers', 'image'),
  (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Upload ảnh khách hàng thành công!',
        data: {
          url: req.file.secure_url,
          public_id: req.file.public_id
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// =============================================================
// TEST UPLOAD - Form HTML (dành cho testing)
// =============================================================
router.get('/test', requireAuth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Upload Avatar</title>
      <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        .card { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        input[type="file"] { margin: 10px 0; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .result { margin-top: 15px; padding: 10px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        img { max-width: 200px; margin-top: 10px; border-radius: 50%; }
        .preview { margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>🧪 Test Upload Avatar</h1>
      <p>User: <strong>${req.session.user.fullName}</strong> (${req.session.user.email})</p>
      
      <div class="card">
        <h3>Chọn ảnh đại diện</h3>
        <form id="avatarForm" action="/upload/avatar" method="POST" enctype="multipart/form-data">
          <input type="file" name="image" accept="image/*" required>
          <br>
          <button type="submit">Upload Avatar</button>
        </form>
        <div id="avatarResult" class="result"></div>
        <div id="preview" class="preview"></div>
      </div>

      <div class="card">
        <h3>Upload Ảnh Review</h3>
        <form id="reviewForm" action="/upload/review" method="POST" enctype="multipart/form-data">
          <input type="file" name="image" accept="image/*" required>
          <br>
          <button type="submit">Upload Review</button>
        </form>
        <div id="reviewResult" class="result"></div>
      </div>

      <script>
        // Preview ảnh trước khi upload
        document.querySelector('input[name="image"]').addEventListener('change', function(e) {
          const preview = document.getElementById('preview');
          if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
              preview.innerHTML = \`
                <img src="\${e.target.result}" alt="Preview" style="max-width: 200px; border-radius: 50%; border: 3px solid #007bff;">
              \`;
            };
            reader.readAsDataURL(this.files[0]);
          }
        });

        // Xử lý form upload avatar
        document.getElementById('avatarForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const resultDiv = document.getElementById('avatarResult');
          
          resultDiv.innerHTML = '⏳ Đang upload và kiểm duyệt...';
          resultDiv.className = 'result';
          
          try {
            const response = await fetch('/upload/avatar', {
              method: 'POST',
              body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
              resultDiv.innerHTML = \`
                ✅ \${data.message}
                <br>
                <img src="\${data.data.url}" alt="Avatar" style="max-width: 150px; border-radius: 50%; border: 3px solid #28a745;">
                <br>
                <small>Public ID: \${data.data.public_id}</small>
              \`;
              resultDiv.className = 'result success';
              
              // Cập nhật preview
              document.getElementById('preview').innerHTML = \`
                <img src="\${data.data.url}" alt="Avatar" style="max-width: 150px; border-radius: 50%; border: 3px solid #28a745;">
              \`;
            } else {
              resultDiv.innerHTML = \`❌ \${data.message}\`;
              resultDiv.className = 'result error';
            }
          } catch (error) {
            resultDiv.innerHTML = \`❌ Lỗi: \${error.message}\`;
            resultDiv.className = 'result error';
          }
        });

        // Xử lý form upload review
        document.getElementById('reviewForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const resultDiv = document.getElementById('reviewResult');
          
          resultDiv.innerHTML = '⏳ Đang upload và kiểm duyệt...';
          resultDiv.className = 'result';
          
          try {
            const response = await fetch('/upload/review', {
              method: 'POST',
              body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
              resultDiv.innerHTML = \`
                ✅ \${data.message}
                <br>
                <img src="\${data.data.url}" alt="Review" style="max-width: 200px; border: 2px solid #28a745;">
                <br>
                <small>Public ID: \${data.data.public_id}</small>
              \`;
              resultDiv.className = 'result success';
            } else {
              resultDiv.innerHTML = \`❌ \${data.message}\`;
              resultDiv.className = 'result error';
            }
          } catch (error) {
            resultDiv.innerHTML = \`❌ Lỗi: \${error.message}\`;
            resultDiv.className = 'result error';
          }
        });
      </script>
    </body>
    </html>
  `);
});

module.exports = router;