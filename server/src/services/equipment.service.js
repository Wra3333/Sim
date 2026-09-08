const { Equipment, Repair, WorkTime, Lesson, Template, AdditionalFile } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const VALID_WORKING_STATUSES = ['Исправен', 'В ремонте', 'Требует ремонта'];
const VALID_WRITE_OFF_STATUSES = ['На балансе', 'Списан', 'На списание'];

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
      throw new Error(`Неподдерживаемый формат фото: ${ext}`);
    }
  }
};

const shouldBeArchived = (workingStatus, writeOffStatus) => {
  return (
    workingStatus === 'В ремонте' ||
    workingStatus === 'Требует ремонта' ||
    writeOffStatus === 'На списание' ||
    writeOffStatus === 'Списан'
  );
};

const shouldBeRestored = (workingStatus, writeOffStatus) => {
  return (
    workingStatus === 'Исправен' &&
    writeOffStatus === 'На балансе'
  );
};

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
          convert: true,
          optional: true
        },
        description: { type: 'string', optional: true, max: 1000 },
        photo: { type: 'string', optional: true, max: 255 },
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
        },
        price: { type: 'number', optional: true, convert: true },
        country: { type: 'string', optional: true, max: 100 },
        manufacturer: { type: 'string', optional: true, max: 255 },
        original_name: { type: 'string', optional: true, max: 255 },
        realism_class: { type: 'string', optional: true, max: 50 },
        tags: { type: 'array', items: 'string', optional: true }
      },
      handler: async ctx => {
        validatePhotoFormat(ctx.params.photo);

        const existing = await Equipment.findOne({
          where: { inventory_number: ctx.params.inventory_number }
        });

        if (existing) {
          throw new Error(`Оборудование с инвентарным номером "${ctx.params.inventory_number}" уже существует`);
        }

        const shouldArchive = shouldBeArchived(ctx.params.working_status, ctx.params.write_off_status);

        const data = {
          ...ctx.params,
          photo: normalizePhoto(ctx.params.photo),
          created_by: ctx.meta.user?.id,
          updated_by: ctx.meta.user?.id,
          tags: ctx.params.tags || [],
          additional_files: [],
          is_archived: shouldArchive,
          archived_at: shouldArchive ? new Date() : null
        };

        if (data.price === '' || data.price === null || data.price === undefined || isNaN(Number(data.price))) {
          data.price = null;
        }

        if (data.year_of_release === '' || data.year_of_release === null || data.year_of_release === undefined) {
          data.year_of_release = null;
        }

        return await Equipment.create(data);
      }
    },

    // ============================================
    // LIST - список с расширенной фильтрацией
    // ============================================
    list: {
      params: {
        working_status: { type: 'enum', values: VALID_WORKING_STATUSES, optional: true },
        write_off_status: { type: 'enum', values: VALID_WRITE_OFF_STATUSES, optional: true },
        search: { type: 'string', optional: true, max: 100 },
        tags: { type: 'array', items: 'string', optional: true },
        min_price: { type: 'number', optional: true, convert: true },
        max_price: { type: 'number', optional: true, convert: true },
        country: { type: 'string', optional: true },
        manufacturer: { type: 'string', optional: true },
        realism_class: { type: 'string', optional: true },
        year_from: { type: 'number', optional: true, integer: true },
        year_to: { type: 'number', optional: true, integer: true }
      },
      handler: async ctx => {
        const where = {};
        
        if (ctx.params.working_status) where.working_status = ctx.params.working_status;
        if (ctx.params.write_off_status) where.write_off_status = ctx.params.write_off_status;
        
        if (ctx.params.search) {
          where[Op.or] = [
            { inventory_number: { [Op.like]: `%${ctx.params.search}%` } },
            { inventory_name: { [Op.like]: `%${ctx.params.search}%` } },
            { name: { [Op.like]: `%${ctx.params.search}%` } },
            { manufacturer: { [Op.like]: `%${ctx.params.search}%` } },
            { original_name: { [Op.like]: `%${ctx.params.search}%` } },
            { country: { [Op.like]: `%${ctx.params.search}%` } },
            { realism_class: { [Op.like]: `%${ctx.params.search}%` } }
          ];
        }
        
        if (ctx.params.tags && ctx.params.tags.length > 0) {
          where.tags = { [Op.overlap]: ctx.params.tags };
        }
        
        if (ctx.params.min_price !== undefined && ctx.params.min_price !== null) {
          where.price = { [Op.gte]: ctx.params.min_price };
        }
        if (ctx.params.max_price !== undefined && ctx.params.max_price !== null) {
          where.price = { ...where.price, [Op.lte]: ctx.params.max_price };
        }
        
        if (ctx.params.country) {
          where.country = { [Op.iLike]: `%${ctx.params.country}%` };
        }
        
        if (ctx.params.manufacturer) {
          where.manufacturer = { [Op.iLike]: `%${ctx.params.manufacturer}%` };
        }
        
        if (ctx.params.realism_class) {
          where.realism_class = { [Op.iLike]: `%${ctx.params.realism_class}%` };
        }
        
        if (ctx.params.year_from) {
          where.year_of_release = { [Op.gte]: ctx.params.year_from };
        }
        if (ctx.params.year_to) {
          where.year_of_release = { ...where.year_of_release, [Op.lte]: ctx.params.year_to };
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
    // GET - получение оборудования
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
        inventory_number: { type: 'string', optional: true, min: 1, max: 50 },
        inventory_name: { type: 'string', optional: true, min: 1, max: 255 },
        name: { type: 'string', optional: true, min: 1, max: 255 },
        year_of_release: {
          type: 'number',
          optional: true,
          integer: true,
          min: 1900,
          max: new Date().getFullYear(),
          convert: true
        },
        description: { type: 'string', optional: true, max: 1000 },
        photo: { type: 'string', optional: true, max: 255 },
        purchase_basis: { type: 'string', optional: true, min: 1, max: 255 },
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
        price: { type: 'number', optional: true, convert: true },
        country: { type: 'string', optional: true, max: 100 },
        manufacturer: { type: 'string', optional: true, max: 255 },
        original_name: { type: 'string', optional: true, max: 255 },
        realism_class: { type: 'string', optional: true, max: 50 },
        tags: { type: 'array', items: 'string', optional: true }
      },
      handler: async ctx => {
        const { id, ...data } = ctx.params;

        validatePhotoFormat(data.photo);

        const equipment = await Equipment.findByPk(id);
        if (!equipment) throw new Error('Оборудование не найдено');

        if (data.working_status === 'Исправен') {
          const activeRepairs = await Repair.count({
            where: { equipment_id: id, is_resolved: false }
          });
          if (activeRepairs > 0) {
            throw new Error(`Нельзя изменить статус на "Исправен": есть ${activeRepairs} активных заявок`);
          }
        }

        if (data.photo !== undefined) {
          data.photo = normalizePhoto(data.photo);
        }

        if (data.price === '' || data.price === null || data.price === undefined || isNaN(Number(data.price))) {
          data.price = null;
        }

        if (data.year_of_release === '' || data.year_of_release === null || data.year_of_release === undefined) {
          data.year_of_release = null;
        }

        data.updated_by = ctx.meta.user?.id;

        // Автоматическая архивация
        const finalWorkingStatus = data.working_status || equipment.working_status;
        const finalWriteOffStatus = data.write_off_status || equipment.write_off_status;

        if (shouldBeArchived(finalWorkingStatus, finalWriteOffStatus) && !equipment.is_archived) {
          data.is_archived = true;
          data.archived_at = new Date();
        }

        if (shouldBeRestored(finalWorkingStatus, finalWriteOffStatus) && equipment.is_archived) {
          data.is_archived = false;
          data.archived_at = null;
        }

        await equipment.update(data);
        return equipment;
      }
    },

    // ============================================
    // DELETE - отправка в архив
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

        await equipment.update({
          is_archived: true,
          archived_at: new Date(),
          updated_by: ctx.meta.user?.id
        });

        return { 
          success: true, 
          message: 'Оборудование отправлено в архив',
          is_archived: true
        };
      }
    },

    // ============================================
    // DELETE PERMANENT - полное удаление
    // ============================================
    deletePermanent: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        const equipment = await Equipment.findByPk(ctx.params.id);
        if (!equipment) throw new Error('Оборудование не найдено');

        const allLessons = await Lesson.findAll();
        let lessonsWithEquipment = 0;
        for (const lesson of allLessons) {
          if (lesson.equipment_list) {
            let list = lesson.equipment_list;
            if (typeof list === 'string') {
              try { list = JSON.parse(list); } catch { list = []; }
            }
            if (Array.isArray(list) && list.some(item => item.equipment_id === equipment.id)) {
              lessonsWithEquipment++;
            }
          }
        }

        const allTemplates = await Template.findAll();
        let templatesWithEquipment = 0;
        for (const template of allTemplates) {
          if (template.equipment_list) {
            let list = template.equipment_list;
            if (typeof list === 'string') {
              try { list = JSON.parse(list); } catch { list = []; }
            }
            if (Array.isArray(list) && list.some(item => item.equipment_id === equipment.id)) {
              templatesWithEquipment++;
            }
          }
        }

        if (lessonsWithEquipment > 0 || templatesWithEquipment > 0) {
          throw new Error(
            `Нельзя удалить: используется в ${lessonsWithEquipment} занятиях и ${templatesWithEquipment} шаблонах`
          );
        }

        if (equipment.photo) {
          const photoPath = path.join(__dirname, '../../uploads', path.basename(equipment.photo));
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        }

        // Удаляем дополнительные файлы
        const additionalFiles = await AdditionalFile.findAll({
          where: { equipment_id: equipment.id }
        });
        for (const file of additionalFiles) {
          const filePath = path.join(__dirname, '../../uploads/additional', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          await file.destroy();
        }

        await equipment.destroy();

        return { 
          success: true, 
          message: 'Оборудование удалено навсегда'
        };
      }
    },

    // ============================================
    // RESTORE - восстановление из архива
    // ============================================
    restore: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        const equipment = await Equipment.findByPk(ctx.params.id);
        if (!equipment) throw new Error('Оборудование не найдено');

        if (!equipment.is_archived) {
          throw new Error('Оборудование не находится в архиве');
        }

        await equipment.update({
          is_archived: false,
          archived_at: null,
          updated_by: ctx.meta.user?.id
        });

        return { 
          success: true, 
          message: 'Оборудование восстановлено из архива',
          is_archived: false
        };
      }
    },

    // ============================================
    // GET TAGS - получить все теги
    // ============================================
    // actions/equipment.js - getTags метод

getTags: {
  handler: async ctx => {
    try {
      // ✅ Используем Sequelize с правильным синтаксисом
      const { Op } = require('sequelize');
      
      const equipment = await Equipment.findAll({
        attributes: ['tags'],
        where: {
          tags: { [Op.ne]: null } // ✅ Проверяем на NULL
        }
      });
      
      const tagSet = new Set();
      for (const eq of equipment) {
        if (eq.tags && Array.isArray(eq.tags) && eq.tags.length > 0) {
          for (const tag of eq.tags) {
            if (tag && typeof tag === 'string' && tag.trim()) {
              tagSet.add(tag.trim());
            }
          }
        }
      }
      
      return Array.from(tagSet).sort();
      
    } catch (error) {
      ctx.logger?.error('Error in getTags (Sequelize):', error.message);
      
      // ✅ Если Sequelize упал - пробуем raw SQL
      try {
        const [results] = await sequelize.query(`
          SELECT DISTINCT unnest(tags) as tag
          FROM equipment
          WHERE array_length(tags, 1) > 0
          ORDER BY tag
        `);
        return results.map(r => r.tag).filter(Boolean);
      } catch (fallbackError) {
        ctx.logger?.error('Fallback error:', fallbackError.message);
        return [];
      }
    }
  }
},

    // ============================================
    // UPDATE TAGS - обновление тегов
    // ============================================
    updateTags: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        tags: { type: 'array', items: 'string' }
      },
      handler: async ctx => {
        const { id, tags } = ctx.params;

        const equipment = await Equipment.findByPk(id);
        if (!equipment) throw new Error('Оборудование не найдено');

        await equipment.update({
          tags: tags || [],
          updated_by: ctx.meta.user?.id
        });

        return {
          success: true,
          tags: tags || [],
          message: 'Теги обновлены'
        };
      }
    },
// ============================================
// UPLOAD ADDITIONAL FILES (несколько файлов)
// ============================================
uploadAdditionalFiles: {
  params: {
    id: { type: 'number', integer: true, positive: true, convert: true },
    files: { type: 'array', optional: true },
    file_type: { type: 'string', optional: true },
    description: { type: 'string', optional: true, max: 500 }
  },
  handler: async ctx => {
    const id = ctx.params.id;
    const files = ctx.params.files || [];
    const fileType = ctx.params.file_type || 'other';
    const description = ctx.params.description || '';

    console.log('📥 [equipment] Начало загрузки нескольких файлов');
    console.log('📥 equipmentId:', id);
    console.log('📥 files:', files.length);

    if (!files || files.length === 0) {
      throw new Error('Файлы не переданы');
    }

    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      throw new Error('Оборудование не найдено');
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const originalName = file.originalname || file.filename || 'unknown';
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
      const timestamp = Date.now();
      const filename = `additional-${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
      const filePath = path.join(uploadDir, filename);

      // Копируем файл
      fs.copyFileSync(file.path, filePath);
      
      // Удаляем временный файл
      try {
        fs.unlinkSync(file.path);
      } catch (err) {}

      // Создаем запись в БД
      const additionalFile = await AdditionalFile.create({
        equipment_id: id,
        filename: filename,
        original_name: originalName,
        file_type: fileType,
        mime_type: file.mimetype || 'application/octet-stream',
        size: file.size || 0,
        description: description,
        uploaded_by: ctx.meta.user?.id
      });

      uploadedFiles.push({
        id: additionalFile.id,
        filename: filename,
        original_name: originalName,
        file_type: fileType,
        description: description,
        size: file.size || 0,
        mime_type: file.mimetype || 'application/octet-stream'
      });
    }

    // Обновляем equipment
    const currentFiles = equipment.additional_files || [];
    const updatedFiles = [...currentFiles, ...uploadedFiles];

    await equipment.update({
      additional_files: updatedFiles,
      updated_by: ctx.meta.user?.id
    });

    return {
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
      message: `Загружено ${uploadedFiles.length} файлов`
    };
  }
},
    // ============================================
    // DELETE ADDITIONAL FILE
    // ============================================
    deleteAdditionalFile: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        file_id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        const { id, file_id } = ctx.params;

        const equipment = await Equipment.findByPk(id);
        if (!equipment) throw new Error('Оборудование не найдено');

        const fileRecord = await AdditionalFile.findByPk(file_id);
        if (!fileRecord) throw new Error('Файл не найден');

        const filePath = path.join(__dirname, '../../uploads/additional', fileRecord.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        await fileRecord.destroy();

        const currentFiles = equipment.additional_files || [];
        const updatedFiles = currentFiles.filter(f => f.id !== file_id);
        await equipment.update({
          additional_files: updatedFiles,
          updated_by: ctx.meta.user?.id
        });

        return {
          success: true,
          message: 'Файл удален'
        };
      }
    },

    // ============================================
    // ARCHIVE PROBLEMATIC
    // ============================================
    archiveProblematics: {
      handler: async ctx => {
        const problematicEquipment = await Equipment.findAll({
          where: {
            [Op.or]: [
              { working_status: 'В ремонте' },
              { working_status: 'Требует ремонта' },
              { write_off_status: 'На списание' },
              { write_off_status: 'Списан' }
            ],
            is_archived: false
          }
        });

        let archivedCount = 0;
        const archivedNames = [];
        for (const equipment of problematicEquipment) {
          await equipment.update({
            is_archived: true,
            archived_at: new Date(),
            updated_by: ctx.meta.user?.id
          });
          archivedCount++;
          archivedNames.push(equipment.name);
        }

        return {
          success: true,
          archivedCount,
          archivedNames,
          message: `Заархивировано ${archivedCount} единиц оборудования`
        };
      }
    },

    // ============================================
    // UPLOAD PHOTO
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
          throw new Error('Файл не передан');
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(`Неподдерживаемый тип файла: ${file.mimetype}. Разрешены: ${allowedTypes.join(', ')}`);
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(`Файл слишком большой (макс ${maxSize / 1024 / 1024}MB)`);
        }

        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
          throw new Error('Оборудование не найдено');
        }

        if (equipment.photo) {
          const oldPath = path.join(__dirname, '../../uploads', path.basename(equipment.photo));
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const photoPath = `${file.filename}`;
        await equipment.update({ 
          photo: photoPath,
          updated_by: ctx.meta.user?.id
        });

        return {
          success: true,
          photo: photoPath,
          message: 'Фото загружено'
        };
      }
    },

    // ============================================
    // DELETE PHOTO
    // ============================================
    deletePhoto: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        const id = ctx.params.id;
        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
          throw new Error('Оборудование не найдено');
        }

        if (!equipment.photo) {
          throw new Error('У оборудования нет фото');
        }

        const photoPath = path.join(__dirname, '../../uploads', path.basename(equipment.photo));
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }

        await equipment.update({ 
          photo: '',
          updated_by: ctx.meta.user?.id
        });

        return {
          success: true,
          message: 'Фото удалено'
        };
      }
    },

    // ============================================
    // IMPORT EXCEL
    // ============================================
    importExcel: {
      params: {
        file: { type: 'any', optional: true }
      },
      handler: async ctx => {
        const file = ctx.params.file || ctx.meta.file;
        if (!file) {
          throw new Error('Файл не передан');
        }

        const xlsx = require('xlsx');
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const getValue = (rowData, possibleKeys) => {
          for (const key of possibleKeys) {
            if (rowData[key] !== undefined && rowData[key] !== '') {
              return rowData[key];
            }
          }
          return '';
        };

        const cleanNumber = (val) => {
          if (!val) return null;
          const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
          return isNaN(num) ? null : num;
        };

        const extractPrice = (text) => {
          if (!text) return null;
          const match = text.match(/Стоимость\s*[-:]?\s*([\d\s]+)/i);
          if (match) return cleanNumber(match[1]);
          return null;
        };

        let headerRowIndex = -1;
        let headers = [];

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          const nonEmptyCount = row.filter(cell => cell !== '' && cell !== null && cell !== undefined).length;

          if (row.includes('Инвентарный номер') || nonEmptyCount >= 2) {
            headerRowIndex = i;
            headers = row;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Не удалось найти строку с заголовками');
        }

        const emptyLeftCount = headers.findIndex(cell => cell !== '');
        if (emptyLeftCount > 0) {
          headers = headers.slice(emptyLeftCount);
        }

        const dataOffset = rawRows[headerRowIndex].length - headers.length;

        const createdItems = [];
        const errors = [];

        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) {
            continue;
          }

          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index + dataOffset] || '';
          });

          try {
            const rawInv = getValue(rowData, ['Инвентарный номер', 'inventory_number']);
            const inventory_number = String(rawInv).replace(/\s/g, '').trim();

            const description = getValue(rowData, ['Краткое описание', 'description']);
            const explicitPrice = getValue(rowData, ['Стоимость', 'Стоимость (₽)', 'price']);

            const workingStatus = getValue(rowData, ['Состояние', 'Техническое состояние', 'working_status']) || 'Исправен';
            const writeOffStatus = getValue(rowData, ['Статус списания', 'write_off_status']) || 'На балансе';
            const shouldArchive = shouldBeArchived(workingStatus, writeOffStatus);

            const data = {
              inventory_number: inventory_number,
              inventory_name: getValue(rowData, ['Инвентарное наименование', 'inventory_name']),
              name: getValue(rowData, ['Название', 'Наименование оборудования', 'name']),
              year_of_release: getValue(rowData, ['Год закупки', 'ГОД ввода в эксплуатацию', 'year_of_release']),
              description: description,
              purchase_basis: getValue(rowData, ['Основание закупки', 'purchase_basis']),
              working_status: workingStatus,
              write_off_status: writeOffStatus,
              photo: getValue(rowData, ['Фото', 'photo']),
              price: explicitPrice ? cleanNumber(explicitPrice) : extractPrice(description),
              country: getValue(rowData, ['Страна', 'country']),
              manufacturer: getValue(rowData, ['Производитель', 'Фирма производитель', 'manufacturer']),
              original_name: getValue(rowData, ['Оригинальное название', 'original_name']),
              realism_class: getValue(rowData, ['Класс реалистичности', 'КЛАСС реалистичности', 'realism_class']),
              created_by: ctx.meta.user?.id,
              updated_by: ctx.meta.user?.id,
              is_archived: shouldArchive,
              archived_at: shouldArchive ? new Date() : null,
              tags: []
            };

            if (!data.inventory_number) {
              throw new Error('Нет инвентарного номера');
            }

            const existing = await Equipment.findOne({
              where: { inventory_number: data.inventory_number }
            });

            if (existing) {
              errors.push({
                inventory_number: data.inventory_number,
                message: `Оборудование с инвентарным номером "${data.inventory_number}" уже существует`
              });
            } else {
              await Equipment.create(data);
              createdItems.push(data.inventory_number);
            }
          } catch (error) {
            errors.push({
              inventory_number: getValue(rowData, ['Инвентарный номер', 'inventory_number']) || 'Неизвестно',
              message: error.message
            });
          }
        }

        return {
          success: true,
          createdCount: createdItems.length,
          createdItems,
          errors
        };
      }
    },

    // ============================================
    // EXPORT EXCEL
    // ============================================
    exportExcel: {
      params: {
        fields: { type: 'array', items: 'string', optional: true }
      },
      handler: async ctx => {
        const selectedFields = ctx.params.fields && ctx.params.fields.length > 0 
          ? ctx.params.fields 
          : [
              'inventory_number', 'inventory_name', 'name', 'year_of_release',
              'description', 'purchase_basis', 'working_status', 'write_off_status',
              'photo', 'price', 'country', 'manufacturer', 'original_name', 'realism_class'
            ];

        const fieldHeaders = {
          'inventory_number': 'Инвентарный номер',
          'inventory_name': 'Инвентарное наименование',
          'name': 'Наименование оборудования',
          'year_of_release': 'ГОД ввода в эксплуатацию',
          'description': 'Краткое описание',
          'purchase_basis': 'Основание закупки',
          'working_status': 'Техническое состояние',
          'write_off_status': 'Статус списания',
          'photo': 'Фото',
          'price': 'Стоимость',
          'country': 'Страна',
          'manufacturer': 'Фирма производитель',
          'original_name': 'Оригинальное название',
          'realism_class': 'КЛАСС реалистичности'
        };

        const equipment = await Equipment.findAll();
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Оборудование');

        worksheet.getColumn(1).width = 5;
        worksheet.getColumn(2).width = 5;

        for (let i = 1; i <= 4; i++) {
          worksheet.getRow(i).values = [];
          worksheet.getRow(i).height = 15;
        }

        const headerRowIndex = 5;

        selectedFields.forEach((field, index) => {
          const widths = {
            'inventory_number': 22,
            'inventory_name': 30,
            'name': 40,
            'year_of_release': 16,
            'description': 45,
            'purchase_basis': 35,
            'working_status': 18,
            'write_off_status': 20,
            'photo': 30,
            'price': 14,
            'country': 16,
            'manufacturer': 22,
            'original_name': 28,
            'realism_class': 18
          };
          worksheet.getColumn(index + 3).width = widths[field] || 20;
        });

        const headerStyle = {
          font: { name: 'Times New Roman', size: 14, bold: true },
          alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
          border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        };

        selectedFields.forEach((field, index) => {
          const cell = worksheet.getCell(headerRowIndex, index + 3);
          cell.value = fieldHeaders[field] || field;
          cell.style = headerStyle;
        });

        worksheet.getRow(headerRowIndex).height = 60;

        const dataStyle = {
          font: { name: 'Times New Roman', size: 14 },
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        };

        const leftDataStyle = {
          font: { name: 'Times New Roman', size: 14 },
          alignment: { vertical: 'middle', horizontal: 'left', wrapText: true },
          border: dataStyle.border
        };

        equipment.forEach((item, index) => {
          const row = worksheet.getRow(headerRowIndex + 1 + index);
          
          selectedFields.forEach((field, colIndex) => {
            const cell = row.getCell(colIndex + 3);
            
            if (field === 'inventory_number') {
              cell.value = String(item[field] || '');
              cell.numFmt = '@';
            } else {
              cell.value = item[field] || '';
            }
            
            if (['name', 'description', 'inventory_name', 'original_name', 'manufacturer', 'purchase_basis', 'photo'].includes(field)) {
              cell.style = leftDataStyle;
            } else {
              cell.style = dataStyle;
            }
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return {
          success: true,
          data: Buffer.from(buffer).toString('base64'),
          filename: 'equipment_export.xlsx'
        };
      }
    }
  }
};