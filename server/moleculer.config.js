require('dotenv').config();
const CustomValidator = require('./src/validators/custom.validator.js');
const { sequelize } = require('./src/models');
const loggerMiddleware = require('./src/middlewares/logger.middleware');

module.exports = {
  namespace: 'simulation-center',
  nodeID: null,
  validator: new CustomValidator(),
  logger: true,
  logLevel: 'info',
  transporter: null,
  metrics: true,
  cacher: 'memory',
  serializer: 'JSON',

  middlewares: [loggerMiddleware],

  registry: {
    strategy: 'RoundRobin',
    preferLocal: true
  },

  circuitBreaker: {
    enabled: true,
    threshold: 0.5,
    windowTime: 60,
    halfOpenTime: 5 * 1000,
    check: err => err && err.code >= 500
  },

  retryPolicy: {
    enabled: true,
    retries: 3,
    delay: 100,
    maxDelay: 1000,
    factor: 2,
    check: err => err && !!err.retryable
  },

  async created() {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');
    console.log('Tables synced');
    console.log('📊 Models:', Object.keys(sequelize.models).join(', '));
  },

  async started() {
    console.log('Сервер запущен');
  },

  async stopped() {
    await sequelize.close();
    console.log('🛑 PostgreSQL connection closed');
  }
};