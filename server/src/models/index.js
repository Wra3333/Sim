const sequelize = require('../config/database');

// Импорт моделей
const Equipment = require('./Equipment');
const Repair = require('./Repair');
const Template = require('./Template');
const Lesson = require('./Lesson');
const WorkTime = require('./WorkTime');

// ============================================
// СВЯЗИ
// ============================================

// Equipment → Repair (1 ко многим)
Equipment.hasMany(Repair, {
  foreignKey: 'equipment_id',
  as: 'repairs'
});
Repair.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment'
});

// Equipment → WorkTime (1 ко многим)
Equipment.hasMany(WorkTime, {
  foreignKey: 'equipment_id',
  as: 'workTimes'
});
WorkTime.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment'
});

// Template → Lesson (1 ко многим)
Template.hasMany(Lesson, {
  foreignKey: 'template_id',
  as: 'lessons'
});
Lesson.belongsTo(Template, {
  foreignKey: 'template_id',
  as: 'template'
});

// Lesson → WorkTime (1 ко многим)
Lesson.hasMany(WorkTime, {
  foreignKey: 'lesson_id',
  as: 'workTimes'
});
WorkTime.belongsTo(Lesson, {
  foreignKey: 'lesson_id',
  as: 'lesson'
});

module.exports = {
  sequelize,
  Equipment,
  Repair,
  Template,
  Lesson,
  WorkTime
};