const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  console.log('📁 [uploadAdditional] Создаем папку:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================================
// ЗАПРЕЩЁННЫЕ РАСШИРЕНИЯ
// ============================================
const FORBIDDEN_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'pif',
  'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh', 'ps1', 'psm1', 'psd1',
  'sh', 'bash', 'run', 'bin', 'app', 'dll', 'so', 'dylib',
  'jar', 'apk', 'deb', 'rpm', 'dmg', 'iso', 'img',
  'hta', 'cpl', 'gadget', 'inf', 'ins', 'isp', 'lnk', 'reg', 'sys',
  'php', 'asp', 'aspx', 'jsp', 'cgi', 'pl', 'py', 'rb', 'lua'
]);

// ============================================
// РАЗРЕШЁННЫЕ РАСШИРЕНИЯ
// ============================================
const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'rtf', 'odt', 'ods', 'odp', 'csv',
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff',
  'zip', 'rar', '7z', 'tar', 'gz',
  'mp4', 'mp3', 'wav', 'avi', 'mov', 'mkv'
]);

// ============================================
// РАЗРЕШЁННЫЕ MIME-ТИПЫ
// ============================================
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/rtf',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/x-icon',
  'image/tiff',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'video/mp4',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-matroska',
  'application/octet-stream'
]);

// ============================================
// ФИЛЬТР
// ============================================
const fileFilter = (req, file, cb) => {
  const originalName = file.originalname || '';
  const ext = path.extname(originalName).toLowerCase().replace('.', '');

  if (!ext) {
    return cb(new Error('Файл без расширения запрещён'));
  }

  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return cb(new Error(`Файлы с расширением ".${ext}" запрещены`));
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Расширение ".${ext}" не разрешено`));
  }

  const mime = String(file.mimetype || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return cb(new Error(`MIME-тип "${mime}" не разрешён`));
  }

  cb(null, true);
};

// ============================================
// НАСТРОЙКА MULTER
// ============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = 'additional-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

const additionalUpload = multer({
  storage: storage,
  defParamCharset: 'utf8',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ============================================
// Извлечение meta из JWT (если $ctx пустой)
// ============================================
function extractMeta(req) {
  // 1. Пробуем взять из контекста moleculer-web
  if (req.$ctx?.meta?.user) {
    console.log('✅ [uploadAdditional] meta из $ctx');
    return req.$ctx.meta;
  }

  // 2. Если нет — декодируем токен вручную
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      console.log('✅ [uploadAdditional] meta из JWT:', decoded.email);

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
    console.error('❌ [uploadAdditional] Ошибка декодирования токена:', err.message);
  }

  console.log('❌ [uploadAdditional] meta пустой');
  return {};
}

module.exports = (req, res, next) => {
  console.log('🔍 [uploadAdditional] ВХОД В MIDDLEWARE');
  console.log('🔍 [uploadAdditional] Метод:', req.method);
  console.log('🔍 [uploadAdditional] URL:', req.url);

  const match = req.url.match(/^\/equipment\/(\d+)\/additional-file$/);

  if (req.method === 'POST' && match) {
    const id = match[1];
    console.log('📎 [uploadAdditional] Загрузка файлов для оборудования:', id);

    additionalUpload.array('file', 10)(req, res, (err) => {
      if (err) {
        console.error('❌ [uploadAdditional] Ошибка multer:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }

      if (!req.files || req.files.length === 0) {
        console.error('❌ [uploadAdditional] Файлы не получены');
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Файлы не получены' }));
        return;
      }

      console.log('✅ [uploadAdditional] Получено файлов:', req.files.length);
      req.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.originalname} (${file.size} bytes)`);
      });

      const fileType = req.body?.file_type || 'other';
      const description = req.body?.description || '';

      // ✅ Извлекаем meta — из $ctx или из JWT
      const meta = extractMeta(req);

      req.$service.broker.call(
        'equipment.uploadAdditionalFiles',
        {
          id: Number(id),
          files: req.files,
          file_type: fileType,
          description: description
        },
        { meta }
      )
      .then(result => {
        console.log('✅ [uploadAdditional] Все файлы загружены');
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(result));
      })
      .catch(err => {
        console.error('❌ [uploadAdditional] Ошибка сервиса:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message }));
      });
    });
  } else {
    next();
  }
};