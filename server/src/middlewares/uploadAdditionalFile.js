const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку если её нет
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  console.log('📁 [uploadAdditional] Создаем папку:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранения с правильным именем
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = 'additional-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

const additionalUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = (req, res, next) => {
  console.log('🔍 [uploadAdditional] ВХОД В MIDDLEWARE');
  console.log('🔍 [uploadAdditional] Метод:', req.method);
  console.log('🔍 [uploadAdditional] URL:', req.url);
  
  const match = req.url.match(/^\/equipment\/(\d+)\/additional-file$/);
  
  if (req.method === 'POST' && match) {
    const id = match[1];
    console.log('📎 [uploadAdditional] Загрузка файлов для оборудования:', id);

    // ✅ array - принимает несколько файлов (максимум 10)
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

      // ✅ ВЫЗЫВАЕМ НОВЫЙ МЕТОД ДЛЯ НЕСКОЛЬКИХ ФАЙЛОВ
      req.$service.broker.call('equipment.uploadAdditionalFiles', {
        id: Number(id),
        files: req.files,
        file_type: fileType,
        description: description
      })
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