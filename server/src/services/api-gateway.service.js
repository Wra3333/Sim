const ApiGateway = require('moleculer-web');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { UnAuthorizedError } = ApiGateway.Errors;

// ✅ ИМПОРТИРУЕМ МИДЛВЭРЫ
const uploadPhoto = require('../middlewares/uploadPhoto');
const uploadExcel = require('../middlewares/uploadExcel');
const uploadAdditionalFile = require('../middlewares/uploadAdditionalFile');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-change-this-in-production-12345';

module.exports = {
  name: 'api-gateway',
  mixins: [ApiGateway],

  settings: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400
    },

    routes: [
      // ============================================
      // ПУБЛИЧНЫЙ API
      // ============================================
      {
        path: '/api/auth',
        cors: true,
        authentication: false,
        whitelist: [
          'auth.login',
          'auth.refresh',
          'auth.logout',
          'auth.validateToken'
        ],
        aliases: {
          'POST /login': 'auth.login',
          'POST /refresh': 'auth.refresh',
          'POST /logout': 'auth.logout',
          'GET /validate': 'auth.validateToken',
          'GET /me/:userId': 'auth.me'
        },
        bodyParsers: {
          json: true,
          urlencoded: { extended: true }
        }
      },

      // ============================================
      // ОСНОВНОЙ API
      // ============================================
      {
        path: '/api',
        cors: true,
        authentication: true,
        whitelist: [
          'equipment.*',
          'repairs.*',
          'templates.*',
          'lessons.*',
          'worktime.*',
          'logs.*',
          'auth.register'
        ],
        bodyParsers: {
          json: true,
          urlencoded: { extended: true }
        },
        aliases: {
          // AUTH
          'POST /auth/register': 'auth.register',
          
          // EQUIPMENT
          'GET /equipment': 'equipment.list',
          'GET /equipment/:id': 'equipment.get',
          'POST /equipment': 'equipment.create',
          'PUT /equipment/:id': 'equipment.update',
          'DELETE /equipment/:id': 'equipment.delete',
          'DELETE /equipment/:id/permanent': 'equipment.deletePermanent',
          'POST /equipment/:id/restore': 'equipment.restore',
          'POST /equipment/archive-problematics': 'equipment.archiveProblematics',
          'GET /equipment/tags': 'equipment.getTags',
          'PUT /equipment/:id/tags': 'equipment.updateTags',
          'DELETE /equipment/:id/photo': 'equipment.deletePhoto',
          'POST /equipment/import-excel': 'equipment.importExcel',
          'POST /equipment/export-excel': 'equipment.exportExcel',
          
          // ✅ ДОПОЛНИТЕЛЬНЫЕ ФАЙЛЫ
          'POST /equipment/:id/additional-file': 'equipment.uploadAdditionalFiles',
          'DELETE /equipment/:id/additional-file/:file_id': 'equipment.deleteAdditionalFile',

          // REPAIRS
          'GET /repairs': 'repairs.list',
          'GET /repairs/equipment/:equipmentId': 'repairs.getByEquipment',
          'POST /repairs': 'repairs.create',
          'PUT /repairs/:id/resolve': 'repairs.resolve',
          'PUT /repairs/:id': 'repairs.update',
          'PATCH /repairs/:id/resolved-by': 'repairs.updateResolvedBy',
          'DELETE /repairs/:id': 'repairs.delete',
          
          // TEMPLATES
          'GET /templates': 'templates.list',
          'GET /templates/:id': 'templates.get',
          'POST /templates': 'templates.create',
          'PUT /templates/:id': 'templates.update',
          'DELETE /templates/:id': 'templates.delete',
          'POST /templates/:id/sync-lessons': 'templates.syncLessons',

          // LESSONS
          'GET /lessons': 'lessons.list',
          'GET /lessons/:id': 'lessons.get',
          'POST /lessons': 'lessons.create',
          'PUT /lessons/:id': 'lessons.update',
          'PUT /lessons/:id/complete': 'lessons.complete',
          'DELETE /lessons/:id': 'lessons.delete',
          'GET /lessons/stats/participants': 'lessons.getParticipantStats',

          // WORKTIME
          'GET /worktime': 'worktime.list',
          'GET /worktime/equipment/:equipmentId': 'worktime.getByEquipment',
          'GET /worktime/report': 'worktime.report',
          'GET /worktime/summary/:equipmentId': 'worktime.summary',
          'POST /worktime': 'worktime.create',

          // LOGS
          'GET /logs': 'logs.list',
          'GET /logs/user/:userId': 'logs.getByUser',
          'GET /logs/entity/:entity/:entityId': 'logs.getByEntity',
          'GET /logs/stats': 'logs.getStats',
          'DELETE /logs/cleanup': 'logs.cleanup'
        },
        
        // ✅ ИСПОЛЬЗУЕМ ВЫНЕСЕННЫЕ МИДЛВЭРЫ
        use: [
          // 🔍 ГЛОБАЛЬНОЕ ЛОГИРОВАНИЕ ВСЕХ ЗАПРОСОВ
          (req, res, next) => {
            console.log('🔍 [GATEWAY] ===== НОВЫЙ ЗАПРОС =====');
            console.log('🔍 [GATEWAY] Метод:', req.method);
            console.log('🔍 [GATEWAY] URL:', req.url);
            console.log('🔍 [GATEWAY] Content-Type:', req.headers['content-type']);
            console.log('🔍 [GATEWAY] Authorization:', req.headers['authorization'] ? 'ЕСТЬ' : 'НЕТ');
            next();
          },
          uploadPhoto,
          uploadExcel,
          uploadAdditionalFile
        ]
      },

      // ============================================
      // РАЗДАЧА ФАЙЛОВ
      // ============================================
      {
        path: '/uploads',
        cors: true,
        authentication: false,
        use: [
          (req, res, next) => {
            if (req.url) {
              try {
                req.url = decodeURIComponent(req.url);
              } catch (e) {}
            }
            next();
          },
          (req, res) => {
            const uploadDir = path.join(__dirname, '../../uploads');
            let fileName = req.url;
            if (fileName.startsWith('/')) {
              fileName = fileName.slice(1);
            }
            
            const filePath = path.join(uploadDir, fileName);
            
            console.log('📁 [uploads] Запрос файла:', fileName);
            console.log('📁 [uploads] Полный путь:', filePath);
            
            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.txt': 'text/plain',
                '.zip': 'application/zip',
                '.rar': 'application/x-rar-compressed'
              };
              console.log('✅ [uploads] Файл найден, отправляем');
              res.writeHead(200, { 
                'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000'
              });
              fs.createReadStream(filePath).pipe(res);
            } else {
              console.error('❌ [uploads] Файл НЕ НАЙДЕН:', filePath);
              res.writeHead(404, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ error: 'Файл не найден' }));
            }
          }
        ]
      }
    ]
  },

  methods: {
    async authenticate(ctx, route, req, res) {
      const auth = req.headers["authorization"];
      
      if (!auth || !auth.startsWith("Bearer ")) {
        console.log('❌ [authenticate] Нет токена');
        throw new UnAuthorizedError("NO_TOKEN", "Требуется авторизация");
      }

      const token = auth.split(" ")[1];
      console.log('🔑 [authenticate] Токен получен, проверяем...');

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ [authenticate] Токен валиден, пользователь:', decoded.email);

        ctx.meta.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name
        };

        return ctx.meta.user;
      } catch (err) {
        console.error('❌ [authenticate] Ошибка:', err.message);
        if (err.name === 'TokenExpiredError') {
          throw new UnAuthorizedError("TOKEN_EXPIRED", "Срок действия токена истек");
        }
        throw new UnAuthorizedError("INVALID_TOKEN", "Невалидный токен");
      }
    }
  },

  onError(req, res, err) {
    console.error('❌ [onError] Ошибка:', err.message);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.writeHead(err.code || 500);
    res.end(JSON.stringify({
      success: false,
      message: err.message || 'Внутренняя ошибка сервера',
      code: err.code || 500
    }, null, 2));
  }
};