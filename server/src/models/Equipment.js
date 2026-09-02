const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inventory_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  inventory_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  year_of_release: {
    type: DataTypes.INTEGER
  },
  description: {
    type: DataTypes.TEXT
  },
  photo: {
    type: DataTypes.STRING(500)
  },
  purchase_basis: {
    type: DataTypes.STRING(255)
  },
  working_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Исправен',
    validate: {
      isIn: [['Исправен', 'Требует ремонта', 'В ремонте']]
    }
  },
  write_off_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'На балансе',
    validate: {
      isIn: [['На балансе', 'На списание', 'Списан']]
    }
  }
}, {
  tableName: 'equipment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Equipment;