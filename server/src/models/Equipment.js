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
    type: DataTypes.INTEGER,
    allowNull: true,
    set(value) {
      if (value === '' || value === null || value === undefined || isNaN(Number(value))) {
        this.setDataValue('year_of_release', null);
      } else {
        this.setDataValue('year_of_release', Number(value));
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  photo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  purchase_basis: {
    type: DataTypes.STRING(255),
    allowNull: true
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
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      if (value === '' || value === null || value === undefined || isNaN(Number(value))) {
        this.setDataValue('price', null);
      } else {
        this.setDataValue('price', Number(value));
      }
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  manufacturer: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  realism_class: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    allowNull: true
  },
  additional_files: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: true
  }
}, {
  tableName: 'equipment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Equipment;