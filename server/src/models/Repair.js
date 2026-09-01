const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Repair = sequelize.define('Repair', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  equipment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  detection_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  nature_of_malfunction: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  detected_by: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  repair_possibility: {
    type: DataTypes.ENUM('Самостоятельно', 'Требуется сервисный инженер'),
    defaultValue: 'Самостоятельно'
  },
  is_resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolution_date: {
    type: DataTypes.DATE
  },
  resolved_by: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'repairs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Repair;