require('dotenv').config(); 
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

// Подключение к MySQL
sequelize.authenticate()
  .then(() => {
    console.log('✅ Connected to MySQL');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('✅ Tables synced');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB connection error:', err);
  });