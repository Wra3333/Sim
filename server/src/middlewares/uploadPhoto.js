const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Папка для хранения фото
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранения
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Только изображения (JPEG, PNG, GIF, WEBP)'), false);
  }
};

// Multer
const photoUpload = multer({
  storage: storage,
  defParamCharset: 'utf8',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ============================================
// Извлечение meta из JWT (если $ctx пустой)
// ============================================
function extractMeta(req) {
  // 1. Пробуем взять из контекста moleculer-web
  if (req.$ctx?.meta?.user) {
    console.log('✅ [uploadPhoto] meta из $ctx');
    return req.$ctx.meta;
  }

  // 2. Если нет — декодируем токен вручную
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      console.log('✅ [uploadPhoto] meta из JWT:', decoded.email);

      return {
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role
        }
      };
    }
  } catch (err) {
    console.error('❌ [uploadPhoto] Ошибка декодирования токена:', err.message);
  }

  console.log('❌ [uploadPhoto] meta пустой');
  return {};
}

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

      // ✅ Извлекаем meta — из $ctx или из JWT
      const meta = extractMeta(req);

      req.$service.broker.call(
        'equipment.uploadPhoto',
        {
          id: Number(id),
          file: req.file
        },
        { meta }
      )
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