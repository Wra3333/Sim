const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Simulation Center API',
      version: '1.0.0',
      description: 'API для управления оборудованием, ремонтами, занятиями и временем работы',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Equipment', description: 'Управление оборудованием (Модуль 1)' },
      { name: 'Repairs', description: 'Управление ремонтами (Модуль 2)' },
      { name: 'WorkTime', description: 'Учёт времени работы (Модуль 3)' },
      { name: 'Lessons', description: 'Управление занятиями (Модуль 4)' },
      { name: 'Templates', description: 'Управление шаблонами (Модуль 5)' },
    ],
    // 👇 ДОБАВЬТЕ ЭТУ СЕКЦИЮ
    components: {
      schemas: {
        Equipment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Уникальный ID оборудования',
              example: 1
            },
            inventory_number: {
              type: 'string',
              description: 'Инвентарный номер (уникальный)',
              example: 'INV-001'
            },
            inventory_name: {
              type: 'string',
              description: 'Официальное название по бухгалтерии',
              example: 'Симулятор сердечно-легочной реанимации'
            },
            name: {
              type: 'string',
              description: 'Рабочее название',
              example: 'Симулятор СЛР'
            },
            year_of_release: {
              type: 'integer',
              description: 'Год выпуска',
              example: 2023
            },
            description: {
              type: 'string',
              description: 'Комплектация, спецификация',
              example: 'В комплекте: датчики, экран, программное обеспечение'
            },
            photo: {
              type: 'string',
              description: 'Путь к фото',
              example: '/uploads/photo123.jpg'
            },
            purchase_basis: {
              type: 'string',
              description: 'Номер договора, целевая программа',
              example: 'Договор №45-А'
            },
            working_status: {
              type: 'string',
              enum: ['Исправен', 'Требует ремонта', 'В ремонте'],
              description: 'Статус работоспособности',
              example: 'Исправен'
            },
            write_off_status: {
              type: 'string',
              enum: ['На балансе', 'На списание', 'Списан'],
              description: 'Статус списания',
              example: 'На балансе'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Дата обновления'
            }
          }
        },
        Repair: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            equipment_id: { type: 'integer' },
            detection_date: { type: 'string', format: 'date-time' },
            nature_of_malfunction: { type: 'string' },
            detected_by: { type: 'string' },
            repair_possibility: {
              type: 'string',
              enum: ['Самостоятельно', 'Требуется сервисный инженер']
            },
            is_resolved: { type: 'boolean' },
            resolution_date: { type: 'string', format: 'date-time' },
            resolved_by: { type: 'string' }
          }
        },
        Template: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            discipline: { type: 'string' },
            module: { type: 'string' },
            description: { type: 'string' },
            equipment_list: { type: 'array', items: { type: 'object' } },
            is_active: { type: 'boolean' }
          }
        },
        Lesson: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            group: { type: 'string' },
            teacher: { type: 'string' },
            students_count: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            start_time: { type: 'string', format: 'time' },
            end_time: { type: 'string', format: 'time' },
            template_id: { type: 'integer' },
            equipment_list: { type: 'array', items: { type: 'object' } },
            status: {
              type: 'string',
              enum: ['Запланировано', 'Проведено', 'Отменено']
            },
            notes: { type: 'string' }
          }
        },
        WorkTime: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            equipment_id: { type: 'integer' },
            lesson_id: { type: 'integer' },
            start_time: { type: 'string', format: 'date-time' },
            end_time: { type: 'string', format: 'date-time' },
            students_count: { type: 'integer' },
            total_hours: { type: 'number', format: 'decimal' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);