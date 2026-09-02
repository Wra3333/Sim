const ApiGateway = require('moleculer-web');
const path = require('path');
const fs = require('fs');
const upload = require('../middlewares/upload'); // ✅ существующий
const uploadExcel = require('../middlewares/uploadExcel'); // 🆕 новый

module.exports = {
  name: 'api-gateway',
  mixins: [ApiGateway],

  settings: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    // ✅ Встроенный CORS moleculer-web
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
      maxAge: 86400
    },

    routes: [
      // ============================================
      // РАЗДАЧА ФОТО (с поддержкой кириллицы)
      // ============================================
      {
        path: '/uploads',
        cors: true,
        use: [
          // ✅ Декодируем URL для поддержки русских символов
          (req, res, next) => {
            if (req.url) {
              try {
                req.url = decodeURIComponent(req.url);
                console.log('📸 Декодированный URL:', req.url);
              } catch (e) {
                console.warn('⚠️ Ошибка декодирования URL:', req.url);
              }
            }
            next();
          },
          // ✅ Отдача файлов
          (req, res) => {
            const uploadDir = path.join(__dirname, '../../uploads');
            // Убираем начальный слэш если есть
            let fileName = req.url;
            if (fileName.startsWith('/')) {
              fileName = fileName.slice(1);
            }
            
            const filePath = path.join(uploadDir, fileName);
            console.log('📂 Ищем файл:', filePath);
            
            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
              };
              // ✅ Добавляем CORS для фото
              res.writeHead(200, { 
                'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                'Access-Control-Allow-Origin': '*'
              });
              fs.createReadStream(filePath).pipe(res);
            } else {
              console.log('❌ Файл не найден:', filePath);
              res.writeHead(404, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ error: 'Файл не найден' }));
            }
          }
        ]
      },

      // ============================================
      // ОСНОВНОЙ API
      // ============================================
      {
        path: '/api',
        cors: true,
        whitelist: [
          'equipment.*',
          'repairs.*',
          'templates.*',
          'lessons.*',
          'worktime.*'
        ],

        // ✅ ПЕРЕХВАТ ЗАГРУЗКИ ФОТО ДО bodyParsers
        use: [
          (req, res, next) => {
            const match = req.url.match(/^\/equipment\/(\d+)\/photo$/);
            if (req.method === 'POST' && match) {
              const id = match[1];

              upload.single('photo')(req, res, (err) => {
                if (err) {
                  res.writeHead(400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  });
                  res.end(JSON.stringify({ error: err.message }));
                  return;
                }
                req.$service.broker.call('equipment.uploadPhoto', {
                  id: Number(id),
                  file: req.file
                })
                .then(result => {
                  res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  });
                  res.end(JSON.stringify(result));
                })
                .catch(err => {
                  res.writeHead(500, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  });
                  res.end(JSON.stringify({ error: err.message }));
                });
              });
            } else {
              next();
            }
          },

          // 🆕 ПЕРЕХВАТ ЗАГРУЗКИ EXCEL
          (req, res, next) => {
            const match = req.url.match(/^\/equipment\/import-excel$/);
            if (req.method === 'POST' && match) {
              uploadExcel.single('file')(req, res, (err) => {
                if (err) {
                  res.writeHead(400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  });
                  res.end(JSON.stringify({ error: err.message }));
                  return;
                }
                req.$service.broker.call('equipment.importExcel', {
                  file: req.file
                })
                .then(result => {
                  res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  });
                  res.end(JSON.stringify(result));
                })
                .catch(err => {
                  res.writeHead(500, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  });
                  res.end(JSON.stringify({ error: err.message }));
                });
              });
            } else {
              next();
            }
          }
        ],

        aliases: {
          'GET /equipment': 'equipment.list',
          'GET /equipment/:id': 'equipment.get',
          'POST /equipment': 'equipment.create',
          'PUT /equipment/:id': 'equipment.update',
          'DELETE /equipment/:id': 'equipment.delete',
          'DELETE /equipment/:id/photo': 'equipment.deletePhoto',
          'POST /equipment/import-excel': 'equipment.importExcel', // 🆕 Импорт
          'POST /equipment/export-excel': 'equipment.exportExcel', // 🆕 Экспорт

          'GET /repairs': 'repairs.list',
          'GET /repairs/equipment/:equipmentId': 'repairs.getByEquipment',
          'POST /repairs': 'repairs.create',
          'PUT /repairs/:id/resolve': 'repairs.resolve',
          'PUT /repairs/:id': 'repairs.update',
          'PATCH /repairs/:id/resolved-by': 'repairs.updateResolvedBy',
          'DELETE /repairs/:id': 'repairs.delete',
          
          'GET /templates': 'templates.list',
          'GET /templates/:id': 'templates.get',
          'POST /templates': 'templates.create',
          'PUT /templates/:id': 'templates.update',
          'DELETE /templates/:id': 'templates.delete',
          'POST /templates/:id/sync-lessons': 'templates.syncLessons',

          'GET /lessons': 'lessons.list',
          'GET /lessons/:id': 'lessons.get',
          'POST /lessons': 'lessons.create',
          'PUT /lessons/:id': 'lessons.update',
          'PUT /lessons/:id/complete': 'lessons.complete',
          'DELETE /lessons/:id': 'lessons.delete',

          'GET /worktime': 'worktime.list',
          'GET /worktime/equipment/:equipmentId': 'worktime.getByEquipment',
          'GET /worktime/report': 'worktime.report',
          'GET /worktime/summary/:equipmentId': 'worktime.summary',
          'POST /worktime': 'worktime.create'
        },

        bodyParsers: {
          json: true,
          urlencoded: { extended: true }
        }
      }
    ]
  },

  onError(req, res, err) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(err.code || 500);
    res.end(JSON.stringify({
      error: err.message,
      code: err.code || 500
    }));
  }
};