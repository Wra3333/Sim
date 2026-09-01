const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  group: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'group'
  },
  teacher: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  students_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  template_id: {
    type: DataTypes.INTEGER
  },
  equipment_list: {
    type: DataTypes.JSON
  },
  status: {
    type: DataTypes.ENUM('Запланировано', 'Проведено', 'Отменено'),
    defaultValue: 'Запланировано'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'lessons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Lesson;