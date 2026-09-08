const { Log } = require('../models');

// ВСЕ ДЕЙСТВИЯ ДЛЯ ЛОГИРОВАНИЯ
const ACTIONS_TO_LOG = [
  'create', 'update', 'delete', 'remove', 'destroy',
  'import', 'importExcel', 'export', 'exportExcel',
  'resolve', 'complete', 'sync', 
  'uploadPhoto', 'deletePhoto',
  'addEquipment', 'removeEquipment',
  'login', 'logout', 'register', 'changePassword', 'refresh'
];

// КАРТА ДЕЙСТВИЙ НА РУССКИЙ ЯЗЫК
const getActionLabel = (actionName, serviceName) => {
  const cleanAction = actionName.includes('.') ? actionName.split('.')[1] : actionName;
  
  const actionMap = {
    'login': 'Вход в систему',
    'logout': 'Выход из системы',
    'register': 'Регистрация пользователя',
    'change_password': 'Смена пароля',
    'refresh': 'Обновление токена',
    
    'create': serviceName === 'equipment' ? 'Создание оборудования' : 
               serviceName === 'lessons' ? 'Создание занятия' :
               serviceName === 'templates' ? 'Создание шаблона' :
               serviceName === 'repairs' ? 'Создание заявки на ремонт' :
               serviceName === 'worktime' ? 'Создание записи времени работы' : 'Создание',
               
    'update': serviceName === 'equipment' ? 'Обновление оборудования' :
              serviceName === 'lessons' ? 'Обновление занятия' :
              serviceName === 'templates' ? 'Обновление шаблона' :
              serviceName === 'repairs' ? 'Обновление заявки на ремонт' :
              serviceName === 'worktime' ? 'Обновление записи времени работы' : 'Обновление',
              
    'delete': serviceName === 'equipment' ? 'Удаление оборудования' :
              serviceName === 'lessons' ? 'Удаление занятия' :
              serviceName === 'templates' ? 'Удаление шаблона' :
              serviceName === 'repairs' ? 'Удаление заявки на ремонт' :
              serviceName === 'worktime' ? 'Удаление записи времени работы' : 'Удаление',
              
    'remove': serviceName === 'equipment' ? 'Удаление оборудования' :
              serviceName === 'lessons' ? 'Удаление занятия' :
              serviceName === 'templates' ? 'Удаление шаблона' :
              serviceName === 'repairs' ? 'Удаление заявки на ремонт' :
              serviceName === 'worktime' ? 'Удаление записи времени работы' : 'Удаление',
              
    'destroy': serviceName === 'equipment' ? 'Удаление оборудования' :
               serviceName === 'lessons' ? 'Удаление занятия' :
               serviceName === 'templates' ? 'Удаление шаблона' :
               serviceName === 'repairs' ? 'Удаление заявки на ремонт' :
               serviceName === 'worktime' ? 'Удаление записи времени работы' : 'Удаление',
               
    'import': serviceName === 'equipment' ? 'Импорт оборудования' : 'Импорт',
    'importExcel': serviceName === 'equipment' ? 'Импорт оборудования из Excel' : 'Импорт из Excel',
    'export': serviceName === 'equipment' ? 'Экспорт оборудования' : 'Экспорт',
    'exportExcel': serviceName === 'equipment' ? 'Экспорт оборудования в Excel' : 'Экспорт в Excel',
    'upload_photo': serviceName === 'equipment' ? 'Загрузка фото оборудования' : 'Загрузка фото',
    'delete_photo': serviceName === 'equipment' ? 'Удаление фото оборудования' : 'Удаление фото',
    'complete': serviceName === 'lessons' ? 'Завершение занятия' : 'Завершение',
    'sync': serviceName === 'templates' ? 'Синхронизация шаблона' : 'Синхронизация',
    'add_equipment': serviceName === 'templates' ? 'Добавление оборудования в шаблон' : 'Добавление оборудования',
    'remove_equipment': serviceName === 'templates' ? 'Удаление оборудования из шаблона' : 'Удаление оборудования',
    'resolve': serviceName === 'repairs' ? 'Закрытие заявки на ремонт' : 'Закрытие заявки',
  };

  return actionMap[cleanAction] || cleanAction;
};

// БЕЗОПАСНОЕ ПРЕОБРАЗОВАНИЕ В JSON
const safeStringify = (obj) => {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      if (key === 'file' || key === 'req' || key === 'res' || key === 'socket') {
        return '[Object]';
      }
      return value;
    });
  } catch {
    return JSON.stringify({ error: 'Failed to stringify' });
  }
};

const loggerMiddleware = {
  name: 'LoggerMiddleware',

  localAction(next, action) {
    return async ctx => {
      const actionName = action.name;
      const serviceName = action.service?.name || 'unknown';

      const shouldLog = ACTIONS_TO_LOG.some(a =>
        actionName === a ||
        actionName.includes(a) ||
        a.includes(actionName)
      );

      const isPublic = ['register', 'login'].includes(actionName);

      const startTime = Date.now();

      try {
        const result = await next(ctx);

        if (shouldLog) {
          await logAction(ctx, action, result, startTime, isPublic);
        }

        return result;
      } catch (err) {
        await logError(ctx, action, err, startTime);
        throw err;
      }
    };
  }
};

async function logAction(ctx, action, result, startTime, isPublic) {
  try {
    const duration = Date.now() - startTime;
    const user = ctx.meta.user;
    const actionName = action.name;
    const serviceName = action.service?.name || 'unknown';

    const actionType = getActionLabel(actionName, serviceName);

    const details = {
      action: actionName,
      duration: `${duration}ms`,
      success: true
    };

    const params = { ...ctx.params };
    if (params.password) delete params.password;
    if (params.oldPassword) delete params.oldPassword;
    if (params.newPassword) delete params.newPassword;
    if (params.file) {
      details.file = params.file.originalname || 'file';
      delete params.file;
    }
    if (Object.keys(params).length > 0) {
      try {
        details.params = JSON.parse(safeStringify(params));
      } catch {
        details.params = params;
      }
    }

    let entityId = null;
    if (result && result.id) {
      entityId = result.id;
    } else if (result && result.repairs && result.repairs.length > 0) {
      entityId = result.repairs[0]?.id;
    } else if (result && result.lesson && result.lesson.id) {
      entityId = result.lesson.id;
    } else if (result && result.template && result.template.id) {
      entityId = result.template.id;
    } else if (ctx.params?.id) {
      entityId = ctx.params.id;
    }

    if (actionName === 'import' || actionName === 'importExcel') {
      details.createdCount = result?.createdCount || 0;
      details.errors = result?.errors?.length || 0;
    }

    if (actionName === 'export' || actionName === 'exportExcel') {
      details.records = result?.records || 0;
    }

    const userId = isPublic ? (result?.user?.id || null) : (user?.id || null);
    const userName = isPublic ? (result?.user?.name || 'Гость') : (user?.name || 'Система');

    await ctx.broker.call('logs.create', {
      user_id: userId,
      user_name: userName,
      action: actionType,
      entity: serviceName,
      entity_id: entityId,
      details: safeStringify(details),
      ip: ctx.meta?.ip || null,
      user_agent: ctx.meta?.userAgent || null
    });

    console.log(`[Logger] ${actionType} ${serviceName} ${entityId ? 'ID:' + entityId : ''} (${duration}ms)`);

  } catch (err) {
    console.error('[Logger] Ошибка сохранения лога:', err.message);
  }
}

async function logError(ctx, action, err, startTime) {
  try {
    const duration = Date.now() - startTime;
    const user = ctx.meta.user;
    const serviceName = action.service?.name || 'unknown';
    const actionName = action.name;

    const actionType = getActionLabel(actionName, serviceName);

    const details = {
      action: actionName,
      duration: `${duration}ms`,
      success: false,
      error: err.message || 'Unknown error'
    };

    const params = { ...ctx.params };
    if (params.password) delete params.password;
    if (params.oldPassword) delete params.oldPassword;
    if (params.newPassword) delete params.newPassword;
    if (Object.keys(params).length > 0) {
      try {
        details.params = JSON.parse(safeStringify(params));
      } catch {
        details.params = params;
      }
    }

    await ctx.broker.call('logs.create', {
      user_id: user?.id || null,
      user_name: user?.name || 'Система',
      action: `Ошибка: ${actionType}`,
      entity: serviceName,
      entity_id: ctx.params?.id || null,
      details: safeStringify(details),
      ip: ctx.meta?.ip || null,
      user_agent: ctx.meta?.userAgent || null
    });

    console.error(`[Logger] Ошибка ${actionType} ${serviceName}: ${err.message} (${duration}ms)`);

  } catch (logErr) {
    console.error('[Logger] Ошибка сохранения лога ошибки:', logErr.message);
  }
}

module.exports = loggerMiddleware;