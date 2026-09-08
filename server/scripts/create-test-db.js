// scripts/create-test-db.js
require('dotenv').config();
const { Client } = require('pg');

// Определяем окружение
const env = process.env.NODE_ENV || 'development';

// Загружаем конфиг
let config;
try {
  config = require('../src/config/config.js')[env];
} catch (error) {
  // Если config.js нет, используем переменные окружения
  config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME_TEST || 'simulation_center_test'
  };
}

async function createTestDatabase() {
  // Проверяем, что это тестовая среда
  if (process.env.NODE_ENV !== 'test') {
    console.error('ЭТОТ СКРИПТ ТОЛЬКО ДЛЯ ТЕСТОВОЙ СРЕДЫ!');
    console.error('   Запустите: npm run test:setup');
    process.exit(1);
  }

  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user || config.username,
    password: config.password,
    database: 'postgres' // Подключаемся к стандартной БД
  });

  try {
    await client.connect();
    console.log(`📦 Создание тестовой БД: ${config.database}...`);

    // Проверяем существование БД
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database]
    );

    if (res.rows.length > 0) {
      console.log(`ℹ️ Тестовая БД уже существует, удаляем...`);
      await client.query(`DROP DATABASE IF EXISTS ${config.database}`);
    }

    // Создаем новую БД
    await client.query(`CREATE DATABASE ${config.database}`);
    console.log(`Тестовая БД "${config.database}" создана!`);
    console.log(`📝 Используйте ее для запуска тестов: npm test`);
  } catch (error) {
    console.error('Ошибка создания БД:', error.message);
    console.error('   Проверьте:');
    console.error('   - Запущен ли PostgreSQL?');
    console.error(`   - Правильный ли пароль в .env? (DB_PASSWORD=${config.password})`);
    console.error(`   - Правильный ли хост? (DB_HOST=${config.host})`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestDatabase();