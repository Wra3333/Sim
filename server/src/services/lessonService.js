const { Lesson, Template, WorkTime, Equipment } = require('../models');
const { Op } = require('sequelize');

const lessonService = {
  // ============================================
  // ВСПОМОГАТЕЛЬНЫЙ МЕТОД: проверка оборудования
  // ============================================
  async validateEquipment(equipmentIds) {
    if (!equipmentIds || equipmentIds.length === 0) return [];

    const invalidEquipment = await Equipment.findAll({
      where: {
        id: equipmentIds,
        working_status: {
          [Op.in]: ['Требует ремонта', 'В ремонте']
        }
      }
    });

    return invalidEquipment;
  },

  // ============================================
  // СОЗДАНИЕ ЗАНЯТИЯ
  // ============================================
  async create(data) {
    // Проверяем оборудование из equipment_list (если есть)
    if (data.equipment_list && data.equipment_list.length > 0) {
      const equipmentIds = data.equipment_list.map(item => item.equipment_id);
      const invalid = await this.validateEquipment(equipmentIds);

      if (invalid.length > 0) {
        const names = invalid.map(e => `${e.name} (${e.working_status})`).join(', ');
        throw new Error(`❌ Нельзя добавить оборудование в ремонте: ${names}`);
      }
    }

    const lesson = await Lesson.create(data);
    
    // Если занятие создано из шаблона и уже проведено
    if (data.template_id && data.status === 'Проведено') {
      const template = await Template.findByPk(data.template_id);
      if (template && template.equipment_list) {
        const equipments = typeof template.equipment_list === 'string' 
          ? JSON.parse(template.equipment_list) 
          : template.equipment_list;
        
        // Проверяем оборудование из шаблона
        const equipmentIds = equipments.map(eq => eq.equipment_id);
        const invalid = await this.validateEquipment(equipmentIds);

        if (invalid.length > 0) {
          const names = invalid.map(e => `${e.name} (${e.working_status})`).join(', ');
          throw new Error(`❌ Нельзя провести занятие: оборудование в ремонте - ${names}`);
        }

        for (const eq of equipments) {
          await WorkTime.create({
            equipment_id: eq.equipment_id,
            lesson_id: lesson.id,
            start_time: `${data.date} ${data.start_time}`,
            end_time: `${data.date} ${data.end_time}`,
            students_count: data.students_count || 0,
            total_hours: 0 // будет подсчитано автоматически
          });
        }
      }
    }
    
    return lesson;
  },

  // ============================================
  // ПОЛУЧИТЬ ВСЕ ЗАНЯТИЯ
  // ============================================
  async getAll(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.group) where.group = filters.group;
    if (filters.teacher) where.teacher = filters.teacher;
    
    return await Lesson.findAll({
      where,
      include: [
        { model: Template, as: 'template' },
        { model: WorkTime, as: 'workTimes' }
      ],
      order: [['date', 'DESC']]
    });
  },

  // ============================================
  // ПОЛУЧИТЬ ПО ID
  // ============================================
  async getById(id) {
    return await Lesson.findByPk(id, {
      include: [
        { model: Template, as: 'template' },
        { model: WorkTime, as: 'workTimes', include: [{ model: Equipment, as: 'equipment' }] }
      ]
    });
  },

  // ============================================
  // ОБНОВИТЬ ЗАНЯТИЕ
  // ============================================
  async update(id, data) {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) return null;

    // Проверяем оборудование из equipment_list (если есть)
    if (data.equipment_list && data.equipment_list.length > 0) {
      const equipmentIds = data.equipment_list.map(item => item.equipment_id);
      const invalid = await this.validateEquipment(equipmentIds);

      if (invalid.length > 0) {
        const names = invalid.map(e => `${e.name} (${e.working_status})`).join(', ');
        throw new Error(`❌ Нельзя добавить оборудование в ремонте: ${names}`);
      }
    }

    await lesson.update(data);
    return lesson;
  },

  // ============================================
  // ЗАВЕРШИТЬ ЗАНЯТИЕ
  // ============================================
  async complete(id) {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) return null;
    
    // Получаем оборудование из занятия
    const equipments = lesson.equipment_list 
      ? (typeof lesson.equipment_list === 'string' 
          ? JSON.parse(lesson.equipment_list) 
          : lesson.equipment_list)
      : [];
    
    // Проверяем, что всё оборудование исправно
    if (equipments.length > 0) {
      const equipmentIds = equipments.map(eq => eq.equipment_id);
      
      // Находим оборудование, которое НЕ исправно
      const brokenEquipment = await Equipment.findAll({
        where: {
          id: equipmentIds,
          working_status: {
            [Op.ne]: 'Исправен'
          }
        }
      });

      if (brokenEquipment.length > 0) {
        const names = brokenEquipment.map(
          e => `${e.name} (${e.working_status})`
        ).join(', ');
        throw new Error(`❌ Нельзя завершить занятие: оборудование в ремонте - ${names}`);
      }
    }
    
    await lesson.update({ status: 'Проведено' });
    
    // Создаём записи в WorkTime для каждого оборудования
    for (const eq of equipments) {
      await WorkTime.create({
        equipment_id: eq.equipment_id,
        lesson_id: lesson.id,
        start_time: `${lesson.date} ${lesson.start_time}`,
        end_time: `${lesson.date} ${lesson.end_time}`,
        students_count: lesson.students_count || 0
      });
    }
    
    return lesson;
  },

  // ============================================
  // УДАЛИТЬ ЗАНЯТИЕ
  // ============================================
  async delete(id) {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) return null;
    await lesson.destroy();
    return true;
  }
};

module.exports = lessonService;