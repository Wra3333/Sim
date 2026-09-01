const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Equipment = require('./Equipment');

const WorkTime = sequelize.define('WorkTime', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  equipment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lesson_id: {
    type: DataTypes.INTEGER
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  students_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_hours: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  }
}, {
  tableName: 'work_times',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// ============================================
// ХУК ПЕРЕД СОЗДАНИЕМ
// ============================================
WorkTime.beforeCreate(async (workTime) => {
  // 1. Проверяем, что оборудование существует
  const equipment = await Equipment.findByPk(workTime.equipment_id);
  if (!equipment) {
    throw new Error(`❌ Оборудование с ID ${workTime.equipment_id} не найдено`);
  }

  // 2. ❗ Нельзя добавить запись о работе, если оборудование в ремонте
  if (equipment.working_status === 'В ремонте') {
    throw new Error(`❌ Нельзя добавить запись о работе: оборудование "${equipment.name}" находится в ремонте`);
  }

  if (equipment.working_status === 'Требует ремонта') {
    throw new Error(`❌ Нельзя добавить запись о работе: оборудование "${equipment.name}" требует ремонта`);
  }

  // 3. ❗ Нельзя добавить запись о работе, если оборудование списано
  if (equipment.write_off_status === 'Списан') {
    throw new Error(`❌ Нельзя добавить запись о работе: оборудование "${equipment.name}" списано`);
  }

  // 4. Проверяем, что start_time раньше end_time
  if (workTime.start_time >= workTime.end_time) {
    throw new Error('❌ Время начала должно быть раньше времени окончания');
  }

  // 5. Автоматический подсчёт total_hours
  if (workTime.start_time && workTime.end_time) {
    const diff = workTime.end_time - workTime.start_time;
    const hours = diff / (1000 * 60 * 60);
    if (hours <= 0) {
      throw new Error('❌ Продолжительность работы должна быть больше 0');
    }
    workTime.total_hours = parseFloat(hours.toFixed(2));
  }
});

// ============================================
// ХУК ПЕРЕД ОБНОВЛЕНИЕМ
// ============================================
WorkTime.beforeUpdate(async (workTime) => {
  // Если обновляются start_time или end_time — пересчитываем total_hours
  if (workTime.changed('start_time') || workTime.changed('end_time')) {
    if (workTime.start_time && workTime.end_time) {
      // Проверяем, что start_time раньше end_time
      if (workTime.start_time >= workTime.end_time) {
        throw new Error('❌ Время начала должно быть раньше времени окончания');
      }

      const diff = workTime.end_time - workTime.start_time;
      const hours = diff / (1000 * 60 * 60);
      if (hours <= 0) {
        throw new Error('❌ Продолжительность работы должна быть больше 0');
      }
      workTime.total_hours = parseFloat(hours.toFixed(2));
    }
  }

  // Проверяем, что оборудование не списано и не в ремонте
  if (workTime.changed('equipment_id')) {
    const equipment = await Equipment.findByPk(workTime.equipment_id);
    if (!equipment) {
      throw new Error(`❌ Оборудование с ID ${workTime.equipment_id} не найдено`);
    }
    if (equipment.working_status === 'В ремонте' || equipment.working_status === 'Требует ремонта') {
      throw new Error(`❌ Нельзя обновить запись: оборудование "${equipment.name}" в ремонте`);
    }
    if (equipment.write_off_status === 'Списан') {
      throw new Error(`❌ Нельзя обновить запись: оборудование "${equipment.name}" списано`);
    }
  }
});

module.exports = WorkTime;