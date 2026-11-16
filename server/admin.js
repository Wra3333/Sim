require('dotenv').config();
const sequelize = require('./src/config/database');
const { User } = require('./src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе установлено');

    // На всякий случай синхронизируем (вдруг таблицы нет)
    await sequelize.sync();

    // Ищем админа
    let admin = await User.findOne({ where: { email: 'admin@example.com' } });

    if (admin) {
      console.log('🔄 Админ уже есть, обновляем пароль...');
      admin.password = 'горького101';
      admin.role = 'admin';
      admin.is_active = true;
      await admin.save();
    } else {
      console.log('✨ Создаем нового админа...');
      admin = await User.create({
        name: 'Администратор',
        email: 'admin@example.com',
        password: 'горького101',
        role: 'admin',
        is_active: true
      });
    }

    console.log('====================================');
    console.log('🎉 УСПЕШНО! Данные для входа:');
    console.log('Логин: admin@example.com');
    console.log('Пароль: горького101');
    console.log('====================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
})();