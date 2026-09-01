const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

app.use(cors());
app.use(express.json());

// 👇 Swagger UI (открывается на /api-docs)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Simulation Center API Docs'
}));

// Маршруты API
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/repairs', require('./routes/repairRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/worktime', require('./routes/workTimeRoutes'));

// Корневой маршрут — перенаправляем на Swagger
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

module.exports = app;