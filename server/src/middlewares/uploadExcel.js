const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Создаём папку если её нет
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Настройка хранения
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'excel-' + uniqueSuffix + ext);
  }
});

const excelUpload = multer({
  storage: storage,
  defParamCharset: 'utf8',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Допустимы только Excel-файлы (.xlsx, .xls)'), false);
    }
  }
});

// ============================================
// Извлечение meta из JWT (если $ctx пустой)
// ============================================
function extractMeta(req) {
  if (req.$ctx?.meta?.user) {
    console.log('✅ [uploadExcel] meta из $ctx');
    return req.$ctx.meta;
  }

  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      console.log('✅ [uploadExcel] meta из JWT:', decoded.email);

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
    console.error('❌ [uploadExcel] Ошибка декодирования токена:', err.message);
  }

  console.log('❌ [uploadExcel] meta пустой');
  return {};
}

module.exports = (req, res, next) => {
  const match = req.url.match(/^\/equipment\/import-excel$/);

  if (req.method === 'POST' && match) {
    excelUpload.single('file')(req, res, (err) => {
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

      console.log('📊 [uploadExcel] Файл сохранен:', req.file.filename);

      // ✅ Извлекаем meta — из $ctx или из JWT
      const meta = extractMeta(req);

      req.$service.broker.call(
        'equipment.importExcel',
        {
          file: req.file
        },
        { meta }
      )
      .then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(result));
      })
      .catch(err => {
        console.error('❌ Ошибка импорта Excel:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message }));
      });
    });
  } else {
    next();
  }
};