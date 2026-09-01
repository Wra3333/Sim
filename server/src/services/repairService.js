const { Repair, Equipment } = require('../models');

const repairService = {
  // ============================================
  // СОЗДАНИЕ ЗАЯВКИ
  // ============================================
  async create(data) {
    // Проверяем, что оборудование существует
    const equipment = await Equipment.findByPk(data.equipment_id);
    if (!equipment) {
      throw new Error('❌ Оборудование не найдено');
    }

    // ❗ Нельзя создать заявку, если оборудование уже списано
    if (equipment.write_off_status === 'Списан') {
      throw new Error(`❌ Нельзя создать заявку на списанное оборудование "${equipment.name}"`);
    }

    // ❗ Нельзя создать заявку, если оборудование уже в ремонте
    if (equipment.working_status === 'В ремонте') {
      throw new Error(`❌ Оборудование "${equipment.name}" уже в ремонте`);
    }

    // ❗ Нельзя создать заявку, если есть активная нерешённая заявка
    const existingRepair = await Repair.findOne({
      where: {
        equipment_id: data.equipment_id,
        is_resolved: false
      }
    });

    if (existingRepair) {
      throw new Error(`❌ На оборудование "${equipment.name}" уже есть активная заявка #${existingRepair.id}`);
    }

    const repair = await Repair.create(data);
    
    // Автоматически меняем статус оборудования на "В ремонте"
    await Equipment.update(
      { working_status: 'В ремонте' },
      { where: { id: data.equipment_id } }
    );
    
    return repair;
  },

  // ============================================
  // ПОЛУЧИТЬ ВСЕ ЗАЯВКИ
  // ============================================
  async getAll() {
    return await Repair.findAll({
      include: [{ model: Equipment, as: 'equipment' }],
      order: [['created_at', 'DESC']]
    });
  },

  // ============================================
  // ПОЛУЧИТЬ ЗАЯВКИ ПО ОБОРУДОВАНИЮ
  // ============================================
  async getByEquipmentId(equipmentId) {
    return await Repair.findAll({
      where: { equipment_id: equipmentId },
      include: [{ model: Equipment, as: 'equipment' }],
      order: [['created_at', 'DESC']]
    });
  },

  // ============================================
  // ЗАКРЫТЬ ЗАЯВКУ
  // ============================================
  async resolve(id, data) {
    const repair = await Repair.findByPk(id);
    if (!repair) return null;

    // ❗ Нельзя закрыть уже закрытую заявку
    if (repair.is_resolved) {
      throw new Error('❌ Заявка уже закрыта');
    }

    // Проверяем, существует ли оборудование
    const equipment = await Equipment.findByPk(repair.equipment_id);
    if (!equipment) {
      throw new Error('❌ Оборудование не найдено');
    }

    await repair.update({
      is_resolved: true,
      resolution_date: data.resolution_date || new Date(),
      resolved_by: data.resolved_by || 'Администратор'
    });

    // Возвращаем статус оборудования в "Исправен"
    await Equipment.update(
      { working_status: 'Исправен' },
      { where: { id: repair.equipment_id } }
    );

    return repair;
  }
};

module.exports = repairService;