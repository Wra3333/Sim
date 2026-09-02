const { Validators } = require('moleculer');
const BaseValidator = Validators.Base;

// ============================================
// СООБЩЕНИЯ ОБ ОШИБКАХ НА РУССКОМ
// ============================================
const ERROR_MESSAGES = {
  required: (field) => `❌ Поле "${field}" обязательно для заполнения`,
  type: (field, type) => `❌ Поле "${field}" должно быть типа "${type}"`,
  stringMin: (field, min) => `❌ Поле "${field}" должно содержать минимум ${min} символов`,
  stringMax: (field, max) => `❌ Поле "${field}" не должно превышать ${max} символов`,
  stringPattern: (field) => `❌ Поле "${field}" имеет неверный формат`,
  numberMin: (field, min) => `❌ Поле "${field}" не может быть меньше ${min}`,
  numberMax: (field, max) => `❌ Поле "${field}" не может быть больше ${max}`,
  numberInteger: (field) => `❌ Поле "${field}" должно быть целым числом`,
  arrayMin: (field, min) => `❌ Поле "${field}" должно содержать минимум ${min} элементов`,
  arrayMax: (field, max) => `❌ Поле "${field}" не должно превышать ${max} элементов`,
  enum: (field, values) => `❌ Поле "${field}" должно быть одним из: ${values.join(', ')}`,
  boolean: (field) => `❌ Поле "${field}" должно быть true или false`,
  positive: (field) => `❌ Поле "${field}" должно быть положительным числом`,
};

// ============================================
// НАЗВАНИЯ ПОЛЕЙ НА РУССКОМ
// ============================================
const FIELD_LABELS = {
  // EQUIPMENT
  inventory_number: 'Инвентарный номер',
  inventory_name: 'Название по инвентарю',
  name: 'Краткое название',
  year_of_release: 'Год выпуска',
  description: 'Описание',
  photo: 'Фото',
  purchase_basis: 'Основание приобретения',
  working_status: 'Рабочий статус',
  write_off_status: 'Статус списания',
  
  // REPAIRS
  equipment_ids: 'Список оборудования',
  detection_date: 'Дата обнаружения',
  nature_of_malfunction: 'Характер неисправности',
  detected_by: 'Кто обнаружил',
  repair_possibility: 'Возможность ремонта',
  resolved_by: 'Кто закрыл',
  resolution_date: 'Дата закрытия',
  resolution_status: 'Статус закрытия',
  write_off_reason: 'Причина списания',
  repair_notes: 'Примечания к ремонту',
  
  // TEMPLATES
  title: 'Название',
  discipline: 'Дисциплина',
  module: 'Модуль',
  is_active: 'Активность',
  equipment_list: 'Список оборудования',
  
  // LESSONS
  group: 'Группа',
  teacher: 'Преподаватель',
  students_count: 'Количество студентов',
  date: 'Дата',
  start_time: 'Время начала',
  end_time: 'Время окончания',
  template_id: 'ID шаблона',
  status: 'Статус',
  notes: 'Заметки',
  
  // WORKTIME
  equipment_id: 'ID оборудования',
  lesson_id: 'ID занятия',
  start: 'Начало периода',
  end: 'Конец периода',
  total_hours: 'Общее время',
  
  // COMMON
  id: 'ID',
  quantity: 'Количество',
  price: 'Цена',
  count: 'Количество',
};

const getLabel = (field) => FIELD_LABELS[field] || field;

class CustomValidator extends BaseValidator {
  constructor() {
    super();
  }

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================
  toNumber(value) {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string' && !isNaN(Number(value))) {
      return Number(value);
    }
    return value;
  }

  isNumeric(value) {
    if (value === null || value === undefined) return false;
    return typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)));
  }

  checkType(value, type) {
    if (value === undefined || value === null) return false;

    switch (type) {
      case 'string': return typeof value === 'string';
      case 'number': return this.isNumeric(value);
      case 'boolean': return typeof value === 'boolean';
      case 'array': return Array.isArray(value);
      case 'object': return typeof value === 'object' && !Array.isArray(value) && value !== null;
      case 'enum': return true;
      default: return true;
    }
  }

  // ============================================
  // ✅ ОСНОВНАЯ ЛОГИКА - возвращает true (валидно) или бросает ошибку
  // ============================================
  compile(schema) {
    // Если схема пустая - возвращаем true (валидно)
    if (!schema || Object.keys(schema).length === 0) {
      return () => true;
    }

    return (params) => {
      // Если нет параметров - true (валидно)
      if (!params) return true;

      const errors = [];
      const normalizedParams = { ...params };

      // Автоматическое преобразование ID
      const idFields = ['id', 'equipment_id', 'lesson_id', 'template_id', 'equipmentId'];
      idFields.forEach(field => {
        if (normalizedParams[field] !== undefined && normalizedParams[field] !== null) {
          normalizedParams[field] = this.toNumber(normalizedParams[field]);
        }
      });

      // Преобразуем equipment_ids
      if (normalizedParams.equipment_ids && Array.isArray(normalizedParams.equipment_ids)) {
        normalizedParams.equipment_ids = normalizedParams.equipment_ids.map(id => this.toNumber(id));
      }

      // Преобразуем equipment_list
      if (normalizedParams.equipment_list && Array.isArray(normalizedParams.equipment_list)) {
        normalizedParams.equipment_list = normalizedParams.equipment_list.map(item => ({
          ...item,
          equipment_id: this.toNumber(item.equipment_id),
          quantity: this.toNumber(item.quantity)
        }));
      }

      // Валидируем каждое поле
      for (const [key, rule] of Object.entries(schema)) {
        const value = normalizedParams[key];
        const label = getLabel(key);

        // ----- ПРОВЕРКА ОБЯЗАТЕЛЬНОСТИ -----
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field: key,
            message: ERROR_MESSAGES.required(label),
            type: 'required'
          });
          continue;
        }

        // ✅ Пропускаем пустые поля, если они не обязательные
        if ((value === undefined || value === null || value === '') && !rule.required) {
          continue;
        }

        // ----- ПРОВЕРКА ТИПА -----
        if (rule.type && !this.checkType(value, rule.type)) {
          const typeMap = {
            string: 'текст',
            number: 'число',
            boolean: 'логическое значение',
            array: 'массив',
            object: 'объект',
            enum: 'допустимое значение'
          };
          errors.push({
            field: key,
            message: ERROR_MESSAGES.type(label, typeMap[rule.type] || rule.type),
            type: 'type'
          });
          continue;
        }

        // ----- ПРОВЕРКА ДЛЯ STRING -----
        if (rule.type === 'string' && value !== undefined && value !== null) {
          if (rule.min && value.length < rule.min) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.stringMin(label, rule.min),
              type: 'stringMin',
              expected: rule.min
            });
          }
          if (rule.max && value.length > rule.max) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.stringMax(label, rule.max),
              type: 'stringMax',
              expected: rule.max
            });
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.stringPattern(label),
              type: 'stringPattern'
            });
          }
        }

        // ----- ПРОВЕРКА ДЛЯ NUMBER -----
        if (rule.type === 'number' && value !== undefined && value !== null) {
          const num = Number(value);

          if (rule.integer && !Number.isInteger(num)) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.numberInteger(label),
              type: 'numberInteger'
            });
          }
          if (rule.min !== undefined && num < rule.min) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.numberMin(label, rule.min),
              type: 'numberMin',
              expected: rule.min
            });
          }
          if (rule.max !== undefined && num > rule.max) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.numberMax(label, rule.max),
              type: 'numberMax',
              expected: rule.max
            });
          }
          if (rule.positive && num <= 0) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.positive(label),
              type: 'positive'
            });
          }

          normalizedParams[key] = num;
        }

        // ----- ПРОВЕРКА ДЛЯ ENUM -----
        if (rule.values && value !== undefined && value !== null) {
          if (!rule.values.includes(value)) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.enum(label, rule.values),
              type: 'enum',
              values: rule.values
            });
          }
        }

        // ----- ПРОВЕРКА ДЛЯ ARRAY -----
        if (rule.type === 'array' && value !== undefined && value !== null) {
          if (!Array.isArray(value)) {
            errors.push({
              field: key,
              message: `❌ Поле "${label}" должно быть массивом (получено: ${typeof value})`,
              type: 'type'
            });
            continue;
          }

          if (rule.min && value.length < rule.min) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.arrayMin(label, rule.min),
              type: 'arrayMin',
              expected: rule.min
            });
          }
          if (rule.max && value.length > rule.max) {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.arrayMax(label, rule.max),
              type: 'arrayMax',
              expected: rule.max
            });
          }
        }

        // ----- ПРОВЕРКА ДЛЯ BOOLEAN -----
        if (rule.type === 'boolean' && value !== undefined && value !== null) {
          if (typeof value !== 'boolean') {
            errors.push({
              field: key,
              message: ERROR_MESSAGES.boolean(label),
              type: 'boolean'
            });
          }
        }
      }

      // ✅ Если есть ошибки - бросаем русское сообщение сразу
      if (errors.length > 0) {
        const errorMessages = errors.map(e => `  ${e.message}`).join('\n');
        const errorText = `❌ Ошибка валидации:\n${errorMessages}`;
        
        const error = new Error(errorText);
        error.code = 422;
        error.type = 'VALIDATION_ERROR';
        error.data = errors;
        throw error;
      }

      // ✅ Сохраняем нормализованные параметры
      Object.assign(params, normalizedParams);

      // ✅ Возвращаем true - валидно
      return true;
    };
  }

  // ============================================
  // ✅ validate - вызывает compile и возвращает результат
  // ============================================
  validate(params, schema) {
    const validator = this.compile(schema);
    return validator(params);
  }
}

module.exports = CustomValidator;