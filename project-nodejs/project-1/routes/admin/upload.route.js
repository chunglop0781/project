const express = require('express');
const router = express.Router();
const { moderateAndUpload } = require('../../middlewares/uploadWithModeration');

// Route upload ảnh tour
router.post('/upload-tour', 
  moderateAndUpload('public/uploads/tours', 'image'),
  (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Upload ảnh tour thành công!',
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

// Route upload ảnh category
router.post('/upload-category', 
  moderateAndUpload('public/uploads/categories', 'image'),
  (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Upload ảnh category thành công!',
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

// Route upload ảnh news
router.post('/upload-news', 
  moderateAndUpload('public/uploads/news', 'image'),
  (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Upload ảnh news thành công!',
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

// Route test upload (form HTML)
router.get('/test-upload', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Upload Ảnh với Cloudinary Moderation</title>
      <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        .card { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        input[type="file"] { margin: 10px 0; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .result { margin-top: 15px; padding: 10px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        img { max-width: 100%; margin-top: 10px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>🧪 Test Upload Ảnh với Cloudinary</h1>
      
      <div class="card">
        <h3>Upload Ảnh Tour</h3>
        <form id="tourForm" action="/admin/upload-tour" method="POST" enctype="multipart/form-data">
          <input type="file" name="image" accept="image/*" required>
          <br>
          <button type="submit">Upload Tour</button>
        </form>
        <div id="tourResult" class="result"></div>
      </div>

      <div class="card">
        <h3>Upload Ảnh Category</h3>
        <form id="categoryForm" action="/admin/upload-category" method="POST" enctype="multipart/form-data">
          <input type="file" name="image" accept="image/*" required>
          <br>
          <button type="submit">Upload Category</button>
        </form>
        <div id="categoryResult" class="result"></div>
      </div>

      <div class="card">
        <h3>Upload Ảnh News</h3>
        <form id="newsForm" action="/admin/upload-news" method="POST" enctype="multipart/form-data">
          <input type="file" name="image" accept="image/*" required>
          <br>
          <button type="submit">Upload News</button>
        </form>
        <div id="newsResult" class="result"></div>
      </div>

      <script>
        document.querySelectorAll('form').forEach(form => {
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const resultDiv = document.getElementById(form.id.replace('Form', 'Result'));
            
            resultDiv.innerHTML = '⏳ Đang upload và kiểm duyệt...';
            resultDiv.className = 'result';
            
            try {
              const response = await fetch(form.action, {
                method: 'POST',
                body: formData
              });
              
              const data = await response.json();
              
              if (data.success) {
                resultDiv.innerHTML = \`
                  ✅ \${data.message}<br>
                  <img src="\${data.data.url}" alt="Uploaded" style="max-width: 300px;">
                  <br><small>Public ID: \${data.data.public_id}</small>
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
        });
      </script>
    </body>
    </html>
  `);
});

module.exports = router;