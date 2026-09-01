const { WorkTime, Equipment, Lesson } = require('../models');
const { Op } = require('sequelize');

const workTimeService = {
  // Создание записи с автоматическим подсчётом часов
  async create(data) {
    // Вычисляем разницу между start_time и end_time
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    const totalHours = (end - start) / (1000 * 60 * 60); // миллисекунды → часы

    return await WorkTime.create({
      ...data,
      total_hours: totalHours.toFixed(2) // сохраняем с 2 знаками
    });
  },

  async getAll() {
    return await WorkTime.findAll({
      include: [
        { model: Equipment, as: 'equipment' },
        { model: Lesson, as: 'lesson' }
      ]
    });
  },

  async getByEquipmentId(equipmentId) {
    return await WorkTime.findAll({
      where: { equipment_id: equipmentId },
      include: [
        { model: Equipment, as: 'equipment' },
        { model: Lesson, as: 'lesson' }
      ],
      order: [['start_time', 'DESC']]
    });
  },

  async getReport(startDate, endDate, equipmentId = null) {
    const where = {
      start_time: { [Op.gte]: new Date(startDate) },
      end_time: { [Op.lte]: new Date(endDate) }
    };

    if (equipmentId) {
      where.equipment_id = equipmentId;
    }

    return await WorkTime.findAll({
      where,
      include: [
        { model: Equipment, as: 'equipment' },
        { model: Lesson, as: 'lesson' }
      ],
      order: [['start_time', 'ASC']]
    });
  },

  async getSummary(equipmentId, startDate, endDate) {
    const reports = await this.getReport(startDate, endDate, equipmentId);
    
    const totalHours = reports.reduce((sum, r) => sum + parseFloat(r.total_hours || 0), 0);
    const totalStudents = reports.reduce((sum, r) => sum + (r.students_count || 0), 0);
    const sessionsCount = reports.length;

    return {
      equipment_id: equipmentId,
      total_hours: totalHours.toFixed(2),
      total_students: totalStudents,
      sessions_count: sessionsCount,
      reports
    };
  }
};

module.exports = workTimeService;