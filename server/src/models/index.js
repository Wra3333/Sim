const sequelize = require('../config/database');

const Equipment = require('./Equipment');
const Repair = require('./Repair');
const WorkTime = require('./WorkTime');
const Lesson = require('./Lesson');
const Template = require('./Template');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Log = require('./Log');
const AdditionalFile = require('./AdditionalFile'); // ✅ ДОБАВЛЯЕМ

// ============================================
// User → RefreshToken
// ============================================
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens'
});
RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// ============================================
// User → Log
// ============================================
User.hasMany(Log, {
  foreignKey: 'user_id',
  as: 'logs'
});
Log.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// ============================================
// User → Equipment
// ============================================
User.hasMany(Equipment, {
  foreignKey: 'created_by',
  as: 'createdEquipments'
});
Equipment.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Equipment, {
  foreignKey: 'updated_by',
  as: 'updatedEquipments'
});
Equipment.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// ============================================
// Equipment → Repair
// ============================================
Equipment.hasMany(Repair, {
  foreignKey: 'equipment_id',
  as: 'repairs'
});
Repair.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment'
});

// ============================================
// Equipment → WorkTime
// ============================================
Equipment.hasMany(WorkTime, {
  foreignKey: 'equipment_id',
  as: 'workTimes'
});
WorkTime.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment'
});

// ============================================
// Equipment → AdditionalFile
// ============================================
Equipment.hasMany(AdditionalFile, {
  foreignKey: 'equipment_id',
  as: 'additionalFiles'
});
AdditionalFile.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment'
});

// ============================================
// User → Repair
// ============================================
User.hasMany(Repair, {
  foreignKey: 'created_by',
  as: 'createdRepairs'
});
Repair.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// ============================================
// Template → Lesson
// ============================================
Template.hasMany(Lesson, {
  foreignKey: 'template_id',
  as: 'lessons'
});
Lesson.belongsTo(Template, {
  foreignKey: 'template_id',
  as: 'template'
});

// ============================================
// Lesson → WorkTime
// ============================================
Lesson.hasMany(WorkTime, {
  foreignKey: 'lesson_id',
  as: 'workTimes'
});
WorkTime.belongsTo(Lesson, {
  foreignKey: 'lesson_id',
  as: 'lesson'
});

// ============================================
// User → Lesson
// ============================================
User.hasMany(Lesson, {
  foreignKey: 'created_by',
  as: 'createdLessons'
});
Lesson.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Lesson, {
  foreignKey: 'updated_by',
  as: 'updatedLessons'
});
Lesson.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// ============================================
// User → Template
// ============================================
User.hasMany(Template, {
  foreignKey: 'created_by',
  as: 'createdTemplates'
});
Template.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Template, {
  foreignKey: 'updated_by',
  as: 'updatedTemplates'
});
Template.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// ============================================
// User → WorkTime
// ============================================
User.hasMany(WorkTime, {
  foreignKey: 'created_by',
  as: 'createdWorkTimes'
});
WorkTime.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// ============================================
// AdditionalFile → User (uploaded_by)
// ============================================
AdditionalFile.belongsTo(User, {
  foreignKey: 'uploaded_by',
  as: 'uploader'
});
User.hasMany(AdditionalFile, {
  foreignKey: 'uploaded_by',
  as: 'uploadedFiles'
});

module.exports = {
  sequelize,
  Equipment,
  Repair,
  WorkTime,
  Lesson,
  Template,
  User,
  RefreshToken,
  Log,
  AdditionalFile // ✅ ЭКСПОРТИРУЕМ
};