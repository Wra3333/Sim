const { Equipment, Repair, WorkTime } = require('../models');
const { Op } = require('sequelize');

const equipmentService = {
  // ============================================
  // СОЗДАНИЕ ОБОРУДОВАНИЯ
  // ============================================
  async create(data) {
    return await Equipment.create(data);
  },

  // ============================================
  // ПОЛУЧИТЬ ВСЁ ОБОРУДОВАНИЕ
  // ============================================
  async getAll(filters = {}) {
    const where = {};
    
    if (filters.working_status) {
      where.working_status = filters.working_status;
    }
    if (filters.write_off_status) {
      where.write_off_status = filters.write_off_status;
    }
    if (filters.search) {
      where[Op.or] = [
        { inventory_number: { [Op.like]: `%${filters.search}%` } },
        { inventory_name: { [Op.like]: `%${filters.search}%` } },
        { name: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    return await Equipment.findAll({
      where,
      include: [
        { model: Repair, as: 'repairs' },
        { model: WorkTime, as: 'workTimes' }
      ]
    });
  },

  // ============================================
  // ПОЛУЧИТЬ ПО ID
  // ============================================
  async getById(id) {
    return await Equipment.findByPk(id, {
      include: [
        { model: Repair, as: 'repairs' },
        { model: WorkTime, as: 'workTimes' }
      ]
    });
  },

  // ============================================
  // ОБНОВИТЬ ОБОРУДОВАНИЕ
  // ============================================
  async update(id, data) {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) return null;

    // ❗ Проверка: Нельзя изменить статус на "Исправен", если есть активные заявки
    if (data.working_status === 'Исправен') {
      const activeRepairs = await Repair.count({
        where: {
          equipment_id: id,
          is_resolved: false
        }
      });

      if (activeRepairs > 0) {
        throw new Error(`❌ Нельзя изменить статус на "Исправен": есть ${activeRepairs} активных заявок на ремонт`);
      }
    }

    // ❗ Проверка: Нельзя списать оборудование, если есть активные заявки
    if (data.write_off_status === 'Списан') {
      const activeRepairs = await Repair.count({
        where: {
          equipment_id: id,
          is_resolved: false
        }
      });

      if (activeRepairs > 0) {
        throw new Error('❌ Нельзя списать оборудование с активными заявками на ремонт');
      }

      // ❗ Проверка: Нельзя списать, если есть записи о работе в текущем году
      const currentYear = new Date().getFullYear();
      const workTimeThisYear = await WorkTime.count({
        where: {
          equipment_id: id,
          start_time: {
            [Op.gte]: new Date(`${currentYear}-01-01`)
          }
        }
      });

      if (workTimeThisYear > 0) {
        throw new Error(`❌ Нельзя списать оборудование: использовалось в ${currentYear} году (${workTimeThisYear} записей)`);
      }
    }

    // ❗ Проверка: Нельзя перевести в "На балансе", если оборудование списано
    if (data.write_off_status === 'На балансе' && equipment.write_off_status === 'Списан') {
      throw new Error('❌ Нельзя вернуть на баланс списанное оборудование');
    }

    await equipment.update(data);
    return equipment;
  },

  // ============================================
  // УДАЛИТЬ ОБОРУДОВАНИЕ
  // ============================================
  async delete(id) {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) return null;

    // ❗ Нельзя удалить оборудование, если есть связанные записи
    // Проверяем ремонты
    const repairsCount = await Repair.count({
      where: { equipment_id: id }
    });

    if (repairsCount > 0) {
      throw new Error(`❌ Нельзя удалить оборудование: есть ${repairsCount} записей о ремонтах`);
    }

    // Проверяем записи о работе
    const workTimesCount = await WorkTime.count({
      where: { equipment_id: id }
    });

    if (workTimesCount > 0) {
      throw new Error(`❌ Нельзя удалить оборудование: есть ${workTimesCount} записей о работе`);
    }

    await equipment.destroy();
    return true;
  }
};

module.exports = equipmentService;