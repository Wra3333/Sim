const { Equipment, Repair, WorkTime } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

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
        },
        price: { type: 'number', optional: true, convert: true },
        country: { type: 'string', optional: true, max: 100 },
        manufacturer: { type: 'string', optional: true, max: 255 },
        original_name: { type: 'string', optional: true, max: 255 },
        realism_class: { type: 'string', optional: true, max: 50 }
      },
      handler: async ctx => {
        validatePhotoFormat(ctx.params.photo);

        const existing = await Equipment.findOne({
          where: { inventory_number: ctx.params.inventory_number }
        });

        if (existing) {
          throw new Error(`❌ Оборудование с инвентарным номером "${ctx.params.inventory_number}" уже существует`);
        }

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
            { name: { [Op.like]: `%${ctx.params.search}%` } },
            { manufacturer: { [Op.like]: `%${ctx.params.search}%` } },
            { original_name: { [Op.like]: `%${ctx.params.search}%` } },
            { country: { [Op.like]: `%${ctx.params.search}%` } },
            { realism_class: { [Op.like]: `%${ctx.params.search}%` } }
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
        },
        price: { type: 'number', optional: true, convert: true },
        country: { type: 'string', optional: true, max: 100 },
        manufacturer: { type: 'string', optional: true, max: 255 },
        original_name: { type: 'string', optional: true, max: 255 },
        realism_class: { type: 'string', optional: true, max: 50 }
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
            throw new Error(`❌ Нельзя изменить статус на "Исправен": есть ${activeRepairs} активных заявок`);
          }
        }

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

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(`❌ Неподдерживаемый тип файла: ${file.mimetype}. Разрешены: ${allowedTypes.join(', ')}`);
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(`❌ Файл слишком большой (макс ${maxSize / 1024 / 1024}MB)`);
        }

        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
          throw new Error('❌ Оборудование не найдено');
        }

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
    },
    // ============================================
    // IMPORT EXCEL - Универсальный импорт (любые форматы)
    // ============================================
    importExcel: {
      params: {
        file: { type: 'any', optional: true }
      },
      handler: async ctx => {
        const file = ctx.params.file || ctx.meta.file;
        if (!file) {
          throw new Error('❌ Файл не передан');
        }

        const xlsx = require('xlsx');
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Читаем файл как массив массивов (header: 1)
        const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        // 1. Находим строку с заголовками (первая строка, где есть 2+ заполненных ячейки ИЛИ строка с ключевым словом)
        let headerRowIndex = -1;
        let headers = [];

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          const nonEmptyCount = row.filter(cell => cell !== '' && cell !== null && cell !== undefined).length;

          // Если есть название "Инвентарный номер" или просто 2+ заполненных ячеек (если заголовки нестандартные)
          if (row.includes('Инвентарный номер') || nonEmptyCount >= 2) {
            headerRowIndex = i;
            headers = row;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('❌ Не удалось найти строку с заголовками');
        }

        // 2. Убираем пустые столбцы слева
        const emptyLeftCount = headers.findIndex(cell => cell !== '');
        if (emptyLeftCount > 0) {
          headers = headers.slice(emptyLeftCount); // Сдвигаем заголовки
        } else if (emptyLeftCount === -1) {
          throw new Error('❌ Заголовки не найдены (все ячейки пустые)');
        }

        // 3. Определяем смещение для данных
        const dataOffset = rawRows[headerRowIndex].length - headers.length;

        const createdItems = [];
        const errors = [];

        // 4. Функция поиска значения по нескольким возможным названиям колонок
        const getValue = (rowData, possibleKeys) => {
          for (const key of possibleKeys) {
            if (rowData[key] !== undefined && rowData[key] !== '') {
              return rowData[key];
            }
          }
          return '';
        };

        // 5. Проходим по данным
        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          // Пропускаем полностью пустые строки
          if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) {
            continue;
          }

          // Создаем объект данных по заголовкам
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index + dataOffset] || '';
          });

          try {
            // Используем универсальный поиск по нескольким названиям
            const data = {
              inventory_number: getValue(rowData, ['Инвентарный номер', 'inventory_number']),
              inventory_name: getValue(rowData, ['Инвентарное наименование', 'inventory_name']),
              name: getValue(rowData, ['Название', 'Наименование оборудования', 'name']),
              year_of_release: getValue(rowData, ['Год закупки', 'ГОД ввода в эксплуатацию', 'year_of_release']),
              description: getValue(rowData, ['Краткое описание', 'description']),
              purchase_basis: getValue(rowData, ['Основание закупки', 'purchase_basis']),
              working_status: getValue(rowData, ['Состояние', 'Техническое состояние', 'working_status']) || 'Исправен',
              write_off_status: getValue(rowData, ['Статус списания', 'write_off_status']) || 'На балансе',
              photo: getValue(rowData, ['Фото', 'photo']),
              price: getValue(rowData, ['Стоимость', 'Стоимость (₽)', 'price']) || null,
              country: getValue(rowData, ['Страна', 'country']),
              manufacturer: getValue(rowData, ['Производитель', 'Фирма производитель', 'manufacturer']),
              original_name: getValue(rowData, ['Оригинальное название', 'original_name']),
              realism_class: getValue(rowData, ['Класс реалистичности', 'КЛАСС реалистичности', 'realism_class'])
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
    // EXPORT EXCEL - Экспорт с автовысотой строк
    // ============================================
    exportExcel: {
      params: {
        fields: { type: 'array', items: 'string', optional: true }
      },
      handler: async ctx => {
        // 1. Определяем какие поля выбраны
        const selectedFields = ctx.params.fields && ctx.params.fields.length > 0 
          ? ctx.params.fields 
          : [
              'inventory_number', 'inventory_name', 'name', 'year_of_release',
              'description', 'purchase_basis', 'working_status', 'write_off_status',
              'photo', 'price', 'country', 'manufacturer', 'original_name', 'realism_class'
            ];

        // 2. Словарь соответствия (русские названия)
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

        // 3. Получаем оборудование
        const equipment = await Equipment.findAll();
        
        // 4. Создаем книгу ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Оборудование');

        // 5. Отступ слева: 2 пустых столбца (A и B)
        worksheet.getColumn(1).width = 5; // A
        worksheet.getColumn(2).width = 5; // B

        // 6. Отступ сверху: 4 пустых строки (1-4)
        for (let i = 1; i <= 4; i++) {
          worksheet.getRow(i).values = [];
          worksheet.getRow(i).height = 15;
        }

        // 7. Заголовки будут в строке 5, начиная со столбца C (индекс 3)
        const headerRowIndex = 5;

        // 8. Ширина колонок (широкие, чтобы текст помещался)
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
          worksheet.getColumn(index + 3).width = widths[field] || 20; // +3, потому что A и B пустые
        });

        // 9. Стили для заголовков
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

        // 10. Записываем заголовки в строку 5
        selectedFields.forEach((field, index) => {
          const cell = worksheet.getCell(headerRowIndex, index + 3);
          cell.value = fieldHeaders[field] || field; 
          cell.style = headerStyle;
        });

        // Устанавливаем высоту строки заголовков
        worksheet.getRow(headerRowIndex).height = 60;

        // 11. Стили для данных
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

        // Стиль для длинных текстов (по левому краю)
        const leftDataStyle = {
          font: { name: 'Times New Roman', size: 14 },
          alignment: { vertical: 'middle', horizontal: 'left', wrapText: true },
          border: dataStyle.border
        };

        // 12. Заполняем данные (автовысота)
        equipment.forEach((item, index) => {
          const row = worksheet.getRow(headerRowIndex + 1 + index);
          
          // ВАЖНО: НЕ задаем row.height - работает автовысота!
          
          // Проходимся по выбранным полям и записываем их начиная со столбца C (index + 3)
          selectedFields.forEach((field, colIndex) => {
            const cell = row.getCell(colIndex + 3);
            cell.value = item[field] || ''; 
            
            // Применяем стиль
            if (['name', 'description', 'inventory_name', 'original_name', 'manufacturer', 'purchase_basis', 'photo'].includes(field)) {
              cell.style = leftDataStyle;
            } else {
              cell.style = dataStyle;
            }
          });
        });

        // 13. Формируем буфер
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