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
    allowNull: true          // стало необязательным
  },
  teacher: {
    type: DataTypes.STRING(255),
    allowNull: true          // стало необязательным
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
    type: DataTypes.JSONB,
    defaultValue: []
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Запланировано',
    validate: {
      isIn: [['Запланировано', 'Проведено', 'Отменено']]
    }
  },
  notes: {
    type: DataTypes.TEXT
  },

  // ============================================
  // ОБРАЗОВАНИЕ
  // ============================================
  participant_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
    validate: {
      isIn: [[
        'vo_specialist',
        'vo_residency',
        'aspirantura',
        'pa',
        'psa',
        'dpo_pp',
        'dpo_pk_vo',
        'dpo_pk_spo',
        'do',
        'master_class',
        null
      ]]
    }
  },

  faculty: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null
  },

  specialty: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null
  },

  course: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },

  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'lessons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Lesson;