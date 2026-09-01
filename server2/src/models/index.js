const sequelize = require('../config/database');
const Equipment = require('./Equipment');
const Repair = require('./Repair');
const WorkTime = require('./WorkTime');
const Lesson = require('./Lesson');
const Template = require('./Template');

// ============================================
// СВЯЗИ
// ============================================

// Equipment → Repair
Equipment.hasMany(Repair, {
  foreignKey: 'equipment_id',
  as: 'repairs'
});
Repair.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment'
});

// Equipment → WorkTime
Equipment.hasMany(WorkTime, {
  foreignKey: 'equipment_id',
  as: 'workTimes'           // ✅ уникальный alias
});
WorkTime.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment'           // ✅ уникальный alias
});

// Template → Lesson
Template.hasMany(Lesson, {
  foreignKey: 'template_id',
  as: 'lessons'
});
Lesson.belongsTo(Template, {
  foreignKey: 'template_id',
  as: 'template'
});

// Lesson → WorkTime
Lesson.hasMany(WorkTime, {
  foreignKey: 'lesson_id',
  as: 'workTimes'           // ✅ уникальный alias
});
WorkTime.belongsTo(Lesson, {
  foreignKey: 'lesson_id',
  as: 'lesson'              // ✅ уникальный alias
});

module.exports = {
  sequelize,
  Equipment,
  Repair,
  WorkTime,
  Lesson,
  Template
};