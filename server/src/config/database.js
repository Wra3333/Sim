// config/database.js
const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('./config.js')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    define: config.define,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: false
    }
  }
);

// Проверка подключения (только не в тестах)
if (env !== 'test') {
  sequelize.authenticate()
    .then(() => {
      console.log(`Connected to PostgreSQL: ${config.database} (${env})`);
    })
    .catch(err => {
      console.error('PostgreSQL connection error:', err);
    });
}

module.exports = sequelize;