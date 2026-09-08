const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку если её нет
const tempDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Настройка хранения с правильным именем
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'photo-' + uniqueSuffix + ext);
  }
});

const photoUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения (JPEG, PNG, GIF, WEBP)'), false);
    }
  }
});

module.exports = (req, res, next) => {
  const match = req.url.match(/^\/equipment\/(\d+)\/photo$/);
  if (req.method === 'POST' && match) {
    const id = match[1];

    photoUpload.single('photo')(req, res, (err) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }

      if (!req.file) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Файл не получен' }));
        return;
      }

      console.log('📸 [uploadPhoto] Файл сохранен:', req.file.filename);

      req.$service.broker.call('equipment.uploadPhoto', {
        id: Number(id),
        file: req.file
      })
      .then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(result));
      })
      .catch(err => {
        console.error('❌ Ошибка загрузки фото:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message }));
      });
    });
  } else {
    next();
  }
};