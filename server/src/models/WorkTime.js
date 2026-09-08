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
    type: DataTypes.INTEGER,
    allowNull: true
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
  },
  
  // ДОБАВЛЯЕМ
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'work_times',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

WorkTime.beforeCreate(async (workTime) => {
  const equipment = await Equipment.findByPk(workTime.equipment_id);
  if (!equipment) throw new Error('Оборудование не найдено');
  if (equipment.working_status === 'В ремонте' || equipment.working_status === 'Требует ремонта') {
    throw new Error(`Оборудование "${equipment.name}" в статусе "${equipment.working_status}"`);
  }
  if (workTime.start_time >= workTime.end_time) {
    throw new Error('Время начала должно быть раньше времени окончания');
  }
  const diff = workTime.end_time - workTime.start_time;
  workTime.total_hours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
});

WorkTime.beforeUpdate(async (workTime) => {
  if (workTime.changed('start_time') || workTime.changed('end_time')) {
    if (workTime.start_time >= workTime.end_time) {
      throw new Error('Время начала должно быть раньше времени окончания');
    }
    const diff = workTime.end_time - workTime.start_time;
    workTime.total_hours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
  }
});

module.exports = WorkTime;