// src/config/config.js
require('dotenv').config();

module.exports = {
  // ============================================
  // РАЗРАБОТКА (реальная БД)
  // ============================================
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'simulation_center',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true
    }
  },
  
  // ============================================
  // ТЕСТЫ (отдельная тестовая БД!)
  // ============================================
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME_TEST || 'simulation_center_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,  // ← Отключаем логи в тестах
    define: {
      timestamps: true,
      underscored: true
    }
  },
  
  // ============================================
  // ПРОДАКШН
  // ============================================
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  }
};