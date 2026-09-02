// tests/setup.js
require('dotenv').config();
const { sequelize, Equipment, Repair, Lesson, Template, WorkTime } = require('../src/models');

if (process.env.NODE_ENV !== 'test') {
  throw new Error('❌ Тесты должны запускаться в NODE_ENV=test режиме!');
}

const config = require('../src/config/config.js')[process.env.NODE_ENV];
if (!config.database.includes('test')) {
  throw new Error(`❌ Используется НЕ тестовая БД: ${config.database}`);
}

console.log(`✅ Используется тестовая БД: ${config.database}`);

beforeAll(async () => {
  await sequelize.sync({ force: true });
  console.log('✅ Test database synchronized');
});

afterEach(async () => {
  await WorkTime.destroy({ where: {} });
  await Repair.destroy({ where: {} });
  await Lesson.destroy({ where: {} });
  await Template.destroy({ where: {} });
  await Equipment.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
  console.log('✅ Database connection closed');
});

module.exports = {
  sequelize,
  Equipment,
  Repair,
  Lesson,
  Template,
  WorkTime
};