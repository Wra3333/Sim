const { Equipment, Repair, WorkTime } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// ============================================
// КОНСТАНТЫ ДЛЯ ВАЛИДАЦИИ
// ============================================
const VALID_WORKING_STATUSES = ['Исправен', 'В ремонте', 'Требует ремонта'];
const VALID_WRITE_OFF_STATUSES = ['На балансе', 'Списан', 'На списание'];

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
const normalizePhoto = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  return value;
};

const validatePhotoFormat = (photo) => {
  if (!photo) return;
  if (photo.includes('.')) {
    const ext = photo.split('.').pop()?.toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (!allowed.includes(ext)) {
      throw new Error(`❌ Неподдерживаемый формат фото: ${ext}`);
    }
  }
};

// ============================================
// СЕРВИС
// ============================================
module.exports = {
  name: 'equipment',

  actions: {
    // ============================================
    // CREATE - создание оборудования
    // ============================================
    create: {
      params: {
        inventory_number: { type: 'string', min: 1, max: 50 },
        inventory_name: { type: 'string', min: 1, max: 255 },
        name: { type: 'string', min: 1, max: 255 },
        year_of_release: {
          type: 'number',
          integer: true,
          min: 1900,
          max: new Date().getFullYear(),
          convert: true
        },
        description: { type: 'string', optional: true, max: 1000 },
        photo: {
          type: 'string',
          optional: true,
          max: 255
        },
        purchase_basis: { type: 'string', min: 1, max: 255 },
        working_status: {
          type: 'enum',
          values: VALID_WORKING_STATUSES,
          default: 'Исправен'
        },
        write_off_status: {
          type: 'enum',
          values: VALID_WRITE_OFF_STATUSES,
          default: 'На балансе'
        }
      },
      handler: async ctx => {
        // Валидация фото
        validatePhotoFormat(ctx.params.photo);

        const existing = await Equipment.findOne({
          where: { inventory_number: ctx.params.inventory_number }
        });

        if (existing) {
          throw new Error(`❌ Оборудование с инвентарным номером "${ctx.params.inventory_number}" уже существует`);
        }

        // Нормализуем фото перед сохранением
        const data = {
          ...ctx.params,
          photo: normalizePhoto(ctx.params.photo)
        };

        return await Equipment.create(data);
      }
    },

    // ============================================
    // LIST - список оборудования с фильтрацией
    // ============================================
    list: {
      params: {
        working_status: {
          type: 'enum',
          values: VALID_WORKING_STATUSES,
          optional: true
        },
        write_off_status: {
          type: 'enum',
          values: VALID_WRITE_OFF_STATUSES,
          optional: true
        },
        search: { type: 'string', optional: true, max: 100 }
      },
      handler: async ctx => {
        const where = {};
        if (ctx.params.working_status) where.working_status = ctx.params.working_status;
        if (ctx.params.write_off_status) where.write_off_status = ctx.params.write_off_status;
        if (ctx.params.search) {
          where[Op.or] = [
            { inventory_number: { [Op.like]: `%${ctx.params.search}%` } },
            { inventory_name: { [Op.like]: `%${ctx.params.search}%` } },
            { name: { [Op.like]: `%${ctx.params.search}%` } }
          ];
        }
        return await Equipment.findAll({
          where,
          include: [
            { model: Repair, as: 'repairs' },
            { model: WorkTime, as: 'workTimes' }
          ]
        });
      }
    },

    // ============================================
    // GET - получение оборудования по ID
    // ============================================
    get: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        const equipment = await Equipment.findByPk(ctx.params.id, {
          include: [
            { model: Repair, as: 'repairs' },
            { model: WorkTime, as: 'workTimes' }
          ]
        });
        if (!equipment) throw new Error('Оборудование не найдено');
        return equipment;
      }
    },

    // ============================================
    // UPDATE - обновление оборудования
    // ============================================
    update: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        inventory_number: { type: 'string', min: 1, max: 50, optional: true },
        inventory_name: { type: 'string', min: 1, max: 255, optional: true },
        name: { type: 'string', min: 1, max: 255, optional: true },
        year_of_release: {
          type: 'number',
          integer: true,
          min: 1900,
          max: new Date().getFullYear(),
          convert: true,
          optional: true
        },
        description: { type: 'string', optional: true, max: 1000 },
        photo: {
          type: 'string',
          optional: true,
          max: 255
        },
        purchase_basis: { type: 'string', min: 1, max: 255, optional: true },
        working_status: {
          type: 'enum',
          values: VALID_WORKING_STATUSES,
          optional: true
        },
        write_off_status: {
          type: 'enum',
          values: VALID_WRITE_OFF_STATUSES,
          optional: true
        }
      },
      handler: async ctx => {
        const { id, ...data } = ctx.params;

        // Валидация фото
        validatePhotoFormat(data.photo);

        const equipment = await Equipment.findByPk(id);
        if (!equipment) throw new Error('Оборудование не найдено');

        // Проверка: нельзя изменить статус на "Исправен", если есть активные заявки
        if (data.working_status === 'Исправен') {
          const activeRepairs = await Repair.count({
            where: { equipment_id: id, is_resolved: false }
          });
          if (activeRepairs > 0) {
            throw new Error(`❌ Нельзя изменить статус на "Исправен": есть ${activeRepairs} активных заявок`);
          }
        }

        // Нормализуем фото перед обновлением
        if (data.photo !== undefined) {
          data.photo = normalizePhoto(data.photo);
        }

        await equipment.update(data);
        return equipment;
      }
    },

    // ============================================
    // DELETE - удаление оборудования
    // ============================================
    delete: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        const equipment = await Equipment.findByPk(ctx.params.id);
        if (!equipment) throw new Error('Оборудование не найдено');

        const activeRepairsCount = await Repair.count({
          where: {
            equipment_id: ctx.params.id,
            is_resolved: false
          }
        });
        if (activeRepairsCount > 0) {
          throw new Error(`❌ Нельзя удалить: есть ${activeRepairsCount} активных заявок на ремонт`);
        }

        if (equipment.photo) {
          const photoPath = path.join(__dirname, '../../uploads', path.basename(equipment.photo));
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        }

        await equipment.destroy();
        return { success: true };
      }
    },

    // ============================================
    // VALIDATE STATUS - проверка статуса оборудования
    // ============================================
    validateStatus: {
      params: {
        ids: { type: 'array', items: 'number', min: 1 }
      },
      handler: async ctx => {
        const invalid = await Equipment.findAll({
          where: {
            id: ctx.params.ids,
            working_status: { [Op.in]: ['Требует ремонта', 'В ремонте'] }
          }
        });
        return invalid;
      }
    },

    // ============================================
    // UPLOAD PHOTO - загрузка фото
    // ============================================
    uploadPhoto: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        file: { type: 'any', optional: true }
      },
      handler: async ctx => {
        const id = ctx.params.id;
        const file = ctx.params.file || ctx.meta.file;

        if (!file) {
          throw new Error('❌ Файл не передан');
        }

        // Валидация типа файла
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(`❌ Неподдерживаемый тип файла: ${file.mimetype}. Разрешены: ${allowedTypes.join(', ')}`);
        }

        // Валидация размера файла (макс 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(`❌ Файл слишком большой (макс ${maxSize / 1024 / 1024}MB)`);
        }

        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
          throw new Error('❌ Оборудование не найдено');
        }

        // Удаляем старый файл если есть
        if (equipment.photo) {
          const oldPath = path.join(__dirname, '../../uploads', path.basename(equipment.photo));
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const photoPath = `${file.filename}`;
        await equipment.update({ photo: photoPath });

        return {
          success: true,
          photo: photoPath,
          message: '✅ Фото загружено'
        };
      }
    },

    // ============================================
    // DELETE PHOTO - удаление фото
    // ============================================
    deletePhoto: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        const id = ctx.params.id;
        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
          throw new Error('❌ Оборудование не найдено');
        }

        if (!equipment.photo) {
          throw new Error('❌ У оборудования нет фото');
        }

        const photoPath = path.join(__dirname, '../../uploads', path.basename(equipment.photo));
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }

        await equipment.update({ photo: '' });

        return {
          success: true,
          message: '✅ Фото удалено'
        };
      }
    }
  }
};