const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-change-this-in-production-12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this-67890';

module.exports = {
  name: 'auth',

  actions: {
    // ============================================
    // LOGIN - вход в систему
    // ============================================
    login: {
      auth: "public",
      params: {
        email: { type: 'string', min: 5, max: 100 },
        password: { type: 'string', min: 1 }
      },
      handler: async function(ctx) {
        const { email, password } = ctx.params;

        const user = await User.findOne({ where: { email } });
        if (!user) {
          throw new Error('Неверный email или пароль');
        }

        const isValid = await user.comparePassword(password);
        if (!isValid) {
          throw new Error('Неверный email или пароль');
        }

        const tokens = this.generateTokens(user);

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
    // REFRESH - обновление токена
    // ============================================
    refresh: {
      auth: "public",
      params: {
        refreshToken: { type: 'string', min: 1 }
      },
      handler: async function(ctx) {
        const { refreshToken } = ctx.params;

        try {
          const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
          const user = await User.findByPk(decoded.id);

          if (!user || !user.is_active) {
            throw new Error('Пользователь не найден');
          }

          const tokens = this.generateTokens(user);
          return {
            success: true,
            ...tokens
          };
        } catch (err) {
          throw new Error('Невалидный refresh token');
        }
      }
    },

    // ============================================
    // LOGOUT - выход из системы
    // ============================================
    logout: {
      auth: "public",
      params: {
        refreshToken: { type: 'string', optional: true }
      },
      handler: async function(ctx) {
        return {
          success: true,
          message: 'Выход выполнен'
        };
      }
    },

    // ============================================
    // VALIDATE - проверка токена
    // ============================================
    validateToken: {
      auth: "public",
      params: {
        token: { type: 'string', min: 1 }
      },
      handler: async function(ctx) {
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
    // ME - информация о пользователе
    // ============================================
    me: {
      auth: "public",
      params: {
        userId: { type: 'number', integer: true, positive: true }
      },
      handler: async function(ctx) {
        const user = await User.findByPk(ctx.params.userId, {
          attributes: ['id', 'email', 'name', 'last_login', 'created_at', 'is_active']
        });
        if (!user) throw new Error('Пользователь не найден');
        return user;
      }
    },

    // ============================================
    // REGISTER - регистрация
    // ============================================
    register: {
      params: {
        email: { type: 'string', min: 5, max: 100 },
        password: { type: 'string', min: 6, max: 100 },
        name: { type: 'string', min: 2, max: 100 }
      },
      handler: async function(ctx) {
        const { email, password, name } = ctx.params;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
          throw new Error('Пользователь с таким email уже существует');
        }

        const user = await User.create({ email, password, name });
        const tokens = this.generateTokens(user);

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
    }
  },

  methods: {
    generateTokens(user) {
      const payload = {
        id: user.id,
        email: user.email,
        name: user.name
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d'
      });

      const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      return { accessToken, refreshToken };
    }
  }
};