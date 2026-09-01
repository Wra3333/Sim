const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  discipline: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  module: {
    type: DataTypes.STRING(255)
  },
  description: {
    type: DataTypes.TEXT
  },
  equipment_list: {
    type: DataTypes.JSON
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Template;