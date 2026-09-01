require('dotenv').config();

const { sequelize } = require('./src/models');

module.exports = {
  namespace: 'simulation-center',
  nodeID: null,
  logger: true,
  logLevel: 'info',
  //transporter: process.env.NATS_URL || 'nats://localhost:4222',
  transporter: null, // Отключаем транспортёр для локальной разработки
  metrics: true,
  cacher: 'memory',
  serializer: 'JSON',

  // Регистрация сервисов
  registry: {
    strategy: 'RoundRobin',
    preferLocal: true
  },

  // Настройки Circuit Breaker
  circuitBreaker: {
    enabled: true,
    threshold: 0.5,
    windowTime: 60,
    halfOpenTime: 5 * 1000,
    check: err => err && err.code >= 500
  },

  // Настройки Retry
  retryPolicy: {
    enabled: true,
    retries: 3,
    delay: 100,
    maxDelay: 1000,
    factor: 2,
    check: err => err && !!err.retryable
  },

  // === ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ===

  // Вызывается до загрузки сервисов
  async created() {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
  },

  // Вызывается после старта всех сервисов
  async started() {
    console.log('✅ Tables synced');
    console.log('📊 Models:', Object.keys(sequelize.models).join(', '));
  },

  // Вызывается при остановке (Ctrl+C)
  async stopped() {
    await sequelize.close();
    console.log('🛑 PostgreSQL connection closed');
  }
};
