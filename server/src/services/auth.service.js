const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-change-this-in-production-12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this-67890';

const ACCESS_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;   // 30 дней в мс

module.exports = {
  name: 'auth',

  actions: {
    // ============================================
    // LOGIN
    // ============================================
    login: {
      auth: 'public',
      params: {
        email: { type: 'string', min: 5, max: 100 },
        password: { type: 'string', min: 1 }
      },
      handler: async function (ctx) {
        const { email, password } = ctx.params;

        const user = await User.findOne({ where: { email } });
        if (!user) {
          throw new Error('Неверный email или пароль');
        }

        if (!user.is_active) {
          throw new Error('Аккаунт деактивирован');
        }

        const isValid = await user.comparePassword(password);
        if (!isValid) {
          throw new Error('Неверный email или пароль');
        }

        // ✅ Обновляем last_login
        await user.update({ last_login: new Date() });

        // ✅ Генерируем и сохраняем токены
        const tokens = await this.generateAndSaveTokens(user, ctx);

        return {
          success: true,
          message: 'Вход выполнен успешно',
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          ...tokens
        };
      }
    },

    // ============================================
    // REFRESH — обновление токена
    // ============================================
    refresh: {
      auth: 'public',
      params: {
        refreshToken: { type: 'string', min: 1 }
      },
      handler: async function (ctx) {
        const { refreshToken } = ctx.params;

        // 1. Проверяем подпись JWT
        let decoded;
        try {
          decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        } catch (err) {
          throw new Error('Невалидный refresh token');
        }

        // 2. Ищем в БД — не отозван ли
        const stored = await RefreshToken.findOne({
          where: {
            token: refreshToken,
            revoked: false
          }
        });

        if (!stored) {
          throw new Error('Refresh token отозван или не найден');
        }

        // 3. Проверяем, не истёк ли (дублируем проверку из JWT, но с учётом времени сервера)
        if (stored.expires_at && new Date(stored.expires_at) < new Date()) {
          await stored.update({ revoked: true });
          throw new Error('Refresh token истёк');
        }

        // 4. Проверяем пользователя
        const user = await User.findByPk(decoded.id);
        if (!user || !user.is_active) {
          throw new Error('Пользователь не найден или деактивирован');
        }

        // 5. ✅ РОТАЦИЯ: отзываем старый токен
        await stored.update({ revoked: true });

        // 6. ✅ Генерируем новую пару
        const tokens = await this.generateAndSaveTokens(user, ctx);

        return {
          success: true,
          ...tokens
        };
      }
    },

    // ============================================
    // LOGOUT — выход
    // ============================================
    logout: {
      auth: 'public',
      params: {
        refreshToken: { type: 'string', optional: true }
      },
      handler: async function (ctx) {
        const { refreshToken } = ctx.params;

        if (refreshToken) {
          // ✅ Отзываем токен (или удаляем — на выбор)
          const stored = await RefreshToken.findOne({
            where: { token: refreshToken }
          });

          if (stored) {
            await stored.update({ revoked: true });
            // или await stored.destroy();
          }
        }

        return {
          success: true,
          message: 'Выход выполнен'
        };
      }
    },

    // ============================================
    // VALIDATE — проверка access-токена
    // ============================================
    validateToken: {
      auth: 'public',
      params: {
        token: { type: 'string', min: 1 }
      },
      handler: async function (ctx) {
        try {
          const decoded = jwt.verify(ctx.params.token, JWT_SECRET);
          const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'email', 'name', 'is_active']
          });

          if (!user || !user.is_active) {
            return { valid: false };
          }

          return {
            valid: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name
            }
          };
        } catch (err) {
          return { valid: false };
        }
      }
    },

    // ============================================
    // ME — информация о пользователе
    // ============================================
    me: {
      auth: 'public',
      params: {
        userId: { type: 'number', integer: true, positive: true }
      },
      handler: async function (ctx) {
        const user = await User.findByPk(ctx.params.userId, {
          attributes: ['id', 'email', 'name', 'last_login', 'created_at', 'is_active']
        });
        if (!user) throw new Error('Пользователь не найден');
        return user;
      }
    },

    // ============================================
    // REGISTER — регистрация
    // ============================================
    register: {
      params: {
        email: { type: 'string', min: 5, max: 100 },
        password: { type: 'string', min: 6, max: 100 },
        name: { type: 'string', min: 2, max: 100 }
      },
      handler: async function (ctx) {
        const { email, password, name } = ctx.params;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
          throw new Error('Пользователь с таким email уже существует');
        }

        const user = await User.create({ email, password, name });

        // ✅ Тоже выдаём токены и сохраняем refresh
        const tokens = await this.generateAndSaveTokens(user, ctx);

        return {
          success: true,
          message: 'Пользователь успешно создан',
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          ...tokens
        };
      }
    },

    // ============================================
    // CLEANUP — очистка старых/просроченных refresh-токенов
    // ============================================
    cleanupTokens: {
      auth: 'public',
      handler: async function (ctx) {
        const now = new Date();

        // Удаляем те, что истекли ИЛИ отозваны, ИЛИ старше 60 дней
        const deleted = await RefreshToken.destroy({
          where: {
            [Op.or]: [
              { expires_at: { [Op.lt]: now } },
              { revoked: true }
            ]
          }
        });

        return {
          success: true,
          deleted,
          message: `Удалено ${deleted} старых токенов`
        };
      }
    }
  },

  methods: {
    // ============================================
    // ГЕНЕРАЦИЯ И СОХРАНЕНИЕ ТОКЕНОВ
    // ============================================
    async generateAndSaveTokens(user, ctx = {}) {
      const payload = {
        id: user.id,
        email: user.email,
        name: user.name
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_TTL
      });

      const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_TTL }
      );

      // ✅ Сохраняем refresh в БД
      await RefreshToken.create({
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        revoked: false
      });

      return { accessToken, refreshToken };
    }
  }
};