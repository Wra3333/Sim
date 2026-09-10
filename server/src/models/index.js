const sequelize = require('../config/database');

const Equipment = require('./Equipment');
const Repair = require('./Repair');
const WorkTime = require('./WorkTime');
const Lesson = require('./Lesson');
const Template = require('./Template');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Log = require('./Log');
const AdditionalFile = require('./AdditionalFile');

// ============================================
// User → RefreshToken
// ============================================
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE',      // ✅ при удалении юзера — удалить токены
  onUpdate: 'CASCADE'
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
  as: 'logs',
  onDelete: 'CASCADE',      // ✅ логи удаляются с юзером
  onUpdate: 'CASCADE'
});
Log.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// ============================================
// User → Equipment (created_by / updated_by)
// ============================================
User.hasMany(Equipment, {
  foreignKey: 'created_by',
  as: 'createdEquipments',
  onDelete: 'SET NULL',     // ✅ при удалении юзера — оставить оборудование, но created_by = NULL
  onUpdate: 'CASCADE'
});
Equipment.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Equipment, {
  foreignKey: 'updated_by',
  as: 'updatedEquipments',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
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
  as: 'repairs',
  onDelete: 'CASCADE',      // ✅ при удалении оборудования — удалить заявки
  onUpdate: 'CASCADE'
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
  as: 'workTimes',
  onDelete: 'CASCADE',      // ✅ при удалении оборудования — удалить учёт времени
  onUpdate: 'CASCADE'
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
  as: 'additionalFiles',
  onDelete: 'CASCADE',      // ✅ файлы удаляются с оборудованием
  onUpdate: 'CASCADE'
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
  as: 'createdRepairs',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
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
  as: 'lessons',
  onDelete: 'SET NULL',     // ✅ при удалении шаблона — занятия остаются, template_id = NULL
  onUpdate: 'CASCADE'
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
  as: 'workTimes',
  onDelete: 'CASCADE',      // ✅ при удалении занятия — удалить учёт времени
  onUpdate: 'CASCADE'
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
  as: 'createdLessons',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
Lesson.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Lesson, {
  foreignKey: 'updated_by',
  as: 'updatedLessons',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
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
  as: 'createdTemplates',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
Template.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Template, {
  foreignKey: 'updated_by',
  as: 'updatedTemplates',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
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
  as: 'createdWorkTimes',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
WorkTime.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// ============================================
// AdditionalFile → User
// ============================================
AdditionalFile.belongsTo(User, {
  foreignKey: 'uploaded_by',
  as: 'uploader'
});
User.hasMany(AdditionalFile, {
  foreignKey: 'uploaded_by',
  as: 'uploadedFiles',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
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
  AdditionalFile
};