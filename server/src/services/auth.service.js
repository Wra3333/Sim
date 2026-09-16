const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');
const { Op } = require('sequelize');
const AuthorizeMixin = require('../mixins/authorize.mixin');

// ============================================
// JWT СЕКРЕТЫ — БЕЗ FALLBACK
// ============================================
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET не задан в .env');
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET не задан в .env');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const ACCESS_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const VALID_ROLES = ['admin', 'methodist', 'lab_assistant', 'technician'];

const formatUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  is_active: user.is_active,
  last_login: user.last_login,
  created_at: user.created_at,
  updated_at: user.updated_at
});

module.exports = {
  name: 'auth',
  mixins: [AuthorizeMixin],

  hooks: {
    before: {
      register: ['checkIsAuthenticated', 'checkUserRole'],
      list: ['checkIsAuthenticated', 'checkUserRole'],
      get: ['checkIsAuthenticated', 'checkUserRole'],
      update: ['checkIsAuthenticated', 'checkUserRole'],
      delete: ['checkIsAuthenticated', 'checkUserRole'],
      resetPassword: ['checkIsAuthenticated', 'checkUserRole'],
      toggleActive: ['checkIsAuthenticated', 'checkUserRole'],
      changePassword: ['checkIsAuthenticated'],
      me: ['checkIsAuthenticated']
    }
  },

  actions: {
    // ============================================
    // LOGIN — публичный
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
        if (!user) throw new Error('Неверный email или пароль');
        if (!user.is_active) throw new Error('Аккаунт деактивирован');

        const isValid = await user.comparePassword(password);
        if (!isValid) throw new Error('Неверный email или пароль');

        await user.update({ last_login: new Date() });
        const tokens = await this.generateAndSaveTokens(user, ctx);

        return {
          success: true,
          message: 'Вход выполнен успешно',
          user: formatUser(user),
          ...tokens
        };
      }
    },

    // ============================================
    // REFRESH — публичный
    // ============================================
    refresh: {
      auth: 'public',
      params: {
        refreshToken: { type: 'string', min: 1 }
      },
      handler: async function (ctx) {
        const { refreshToken } = ctx.params;

        let decoded;
        try {
          decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        } catch (err) {
          throw new Error('Невалидный refresh token');
        }

        const stored = await RefreshToken.findOne({
          where: { token: refreshToken, revoked: false }
        });

        if (!stored) throw new Error('Refresh token отозван или не найден');

        if (stored.expires_at && new Date(stored.expires_at) < new Date()) {
          await stored.update({ revoked: true });
          throw new Error('Refresh token истёк');
        }

        const user = await User.findByPk(decoded.id);
        if (!user || !user.is_active) {
          throw new Error('Пользователь не найден или деактивирован');
        }

        await stored.update({ revoked: true });
        const tokens = await this.generateAndSaveTokens(user, ctx);

        return { success: true, ...tokens };
      }
    },

    // ============================================
    // LOGOUT — публичный
    // ============================================
    logout: {
      auth: 'public',
      params: {
        refreshToken: { type: 'string', optional: true }
      },
      handler: async function (ctx) {
        const { refreshToken } = ctx.params;

        if (refreshToken) {
          const stored = await RefreshToken.findOne({
            where: { token: refreshToken }
          });
          if (stored) await stored.update({ revoked: true });
        }

        return { success: true, message: 'Выход выполнен' };
      }
    },

    // ============================================
    // VALIDATE — публичный
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
            attributes: ['id', 'email', 'name', 'role', 'is_active']
          });

          if (!user || !user.is_active) return { valid: false };

          return {
            valid: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            }
          };
        } catch (err) {
          return { valid: false };
        }
      }
    },

    // ============================================
    // ME — только для авторизованных
    // ============================================
    me: {
      params: {
        userId: { type: 'number', integer: true, positive: true }
      },
      handler: async function (ctx) {
        const requestedId = ctx.params.userId;
        const currentUser = ctx.meta.user;

        if (!currentUser) {
          throw new Error('Требуется авторизация');
        }

        const isSelf = currentUser.id === requestedId;
        const isAdmin = currentUser.role === 'admin';

        if (!isSelf && !isAdmin) {
          throw new Error('Недостаточно прав');
        }

        const user = await User.findByPk(requestedId, {
          attributes: ['id', 'email', 'name', 'role', 'last_login', 'created_at', 'is_active']
        });
        if (!user) throw new Error('Пользователь не найден');
        return user;
      }
    },

    // ============================================
    // REGISTER — только админ
    // ============================================
    register: {
      roles: ['admin'],
      params: {
        email: { type: 'string', min: 5, max: 100 },
        password: { type: 'string', min: 6, max: 100 },
        name: { type: 'string', min: 2, max: 100 },
        role: {
          type: 'enum',
          values: VALID_ROLES,
          default: 'lab_assistant'
        }
      },
      handler: async function (ctx) {
        const { email, password, name, role } = ctx.params;

        const existing = await User.findOne({ where: { email } });
        if (existing) throw new Error('Пользователь с таким email уже существует');

        const user = await User.create({ email, password, name, role });

        return {
          success: true,
          message: 'Пользователь успешно создан',
          user: formatUser(user)
        };
      }
    },

    // ============================================
    // LIST — только админ
    // ============================================
    list: {
      roles: ['admin'],
      params: {
        role: { type: 'enum', values: VALID_ROLES, optional: true },
        is_active: { type: 'boolean', optional: true },
        search: { type: 'string', optional: true, max: 100 },
        page: { type: 'number', integer: true, min: 1, default: 1, optional: true, convert: true },
        limit: { type: 'number', integer: true, min: 1, max: 100, default: 20, optional: true, convert: true }
      },
      handler: async function (ctx) {
        const { role, is_active, search, page, limit } = ctx.params;
        const offset = (page - 1) * limit;

        const where = {};
        if (role) where.role = role;
        if (is_active !== undefined) where.is_active = is_active;

        if (search) {
          where[Op.or] = [
            { email: { [Op.like]: `%${search}%` } },
            { name: { [Op.like]: `%${search}%` } }
          ];
        }

        const { count, rows } = await User.findAndCountAll({
          where,
          attributes: ['id', 'email', 'name', 'role', 'is_active', 'last_login', 'created_at', 'updated_at'],
          order: [['created_at', 'DESC']],
          limit,
          offset
        });

        return {
          success: true,
          users: rows,
          total: count,
          page,
          totalPages: Math.ceil(count / limit)
        };
      }
    },

    // ============================================
    // GET — только админ
    // ============================================
    get: {
      roles: ['admin'],
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async function (ctx) {
        const user = await User.findByPk(ctx.params.id, {
          attributes: ['id', 'email', 'name', 'role', 'is_active', 'last_login', 'created_at', 'updated_at']
        });
        if (!user) throw new Error('Пользователь не найден');
        return user;
      }
    },

    // ============================================
    // UPDATE — только админ
    // ============================================
    update: {
      roles: ['admin'],
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        email: { type: 'string', optional: true, min: 5, max: 100 },
        name: { type: 'string', optional: true, min: 2, max: 100 },
        role: { type: 'enum', values: VALID_ROLES, optional: true },
        is_active: { type: 'boolean', optional: true }
      },
      handler: async function (ctx) {
        const { id, ...data } = ctx.params;
        const user = await User.findByPk(id);
        if (!user) throw new Error('Пользователь не найден');

        if (data.email && data.email !== user.email) {
          const existing = await User.findOne({ where: { email: data.email } });
          if (existing) throw new Error('Пользователь с таким email уже существует');
        }

        if (data.role && data.role !== 'admin' && user.role === 'admin') {
          const adminsCount = await User.count({ where: { role: 'admin', is_active: true } });
          if (adminsCount <= 1) throw new Error('Нельзя изменить роль последнего администратора');
        }

        if (data.is_active === false && id === ctx.meta.user?.id) {
          throw new Error('Нельзя деактивировать собственный аккаунт');
        }

        if (data.is_active === false && user.role === 'admin') {
          const adminsCount = await User.count({ where: { role: 'admin', is_active: true } });
          if (adminsCount <= 1) throw new Error('Нельзя деактивировать последнего администратора');
        }

        // Отзыв токенов при смене роли
        if (data.role && data.role !== user.role) {
          await RefreshToken.update(
            { revoked: true },
            { where: { user_id: id, revoked: false } }
          );
        }

        await user.update(data);

        return {
          success: true,
          message: 'Пользователь обновлён',
          user: formatUser(user)
        };
      }
    },

    // ============================================
    // CHANGE PASSWORD — только для себя
    // ============================================
    changePassword: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        oldPassword: { type: 'string', min: 1 },
        newPassword: { type: 'string', min: 6, max: 100 }
      },
      handler: async function (ctx) {
        const { id, oldPassword, newPassword } = ctx.params;

        const isSelf = ctx.meta.user?.id === id;

        // Только сам пользователь
        if (!isSelf) {
          throw new Error('Можно менять только свой пароль. Для сброса обратитесь к администратору');
        }

        const user = await User.findByPk(id);
        if (!user) throw new Error('Пользователь не найден');

        if (!user.is_active) {
          throw new Error('Аккаунт деактивирован');
        }

        const isValid = await user.comparePassword(oldPassword);
        if (!isValid) throw new Error('Неверный старый пароль');

        await user.update({ password: newPassword });

        await RefreshToken.update(
          { revoked: true },
          { where: { user_id: id, revoked: false } }
        );

        return { success: true, message: 'Пароль успешно изменён' };
      }
    },

    // ============================================
    // RESET PASSWORD — только админ
    // ============================================
    resetPassword: {
      roles: ['admin'],
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        newPassword: { type: 'string', min: 6, max: 100 }
      },
      handler: async function (ctx) {
        const { id, newPassword } = ctx.params;

        const user = await User.findByPk(id);
        if (!user) throw new Error('Пользователь не найден');

        await user.update({ password: newPassword });

        await RefreshToken.update(
          { revoked: true },
          { where: { user_id: id, revoked: false } }
        );

        return { success: true, message: 'Пароль сброшен' };
      }
    },

    // ============================================
    // DELETE — только админ
    // ============================================
    delete: {
      roles: ['admin'],
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async function (ctx) {
        const { id } = ctx.params;

        const user = await User.findByPk(id);
        if (!user) throw new Error('Пользователь не найден');

        if (id === ctx.meta.user?.id) {
          throw new Error('Нельзя удалить собственный аккаунт');
        }

        if (user.role === 'admin') {
          const adminsCount = await User.count({ where: { role: 'admin' } });
          if (adminsCount <= 1) {
            throw new Error('Нельзя удалить последнего администратора');
          }
        }

        await RefreshToken.destroy({ where: { user_id: id } });
        await user.destroy();

        return { success: true, message: 'Пользователь удалён' };
      }
    },

    // ============================================
    // TOGGLE ACTIVE — только админ
    // ============================================
    toggleActive: {
      roles: ['admin'],
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async function (ctx) {
        const { id } = ctx.params;

        const user = await User.findByPk(id);
        if (!user) throw new Error('Пользователь не найден');

        if (id === ctx.meta.user?.id) {
          throw new Error('Нельзя деактивировать собственный аккаунт');
        }

        if (user.is_active && user.role === 'admin') {
          const adminsCount = await User.count({ where: { role: 'admin', is_active: true } });
          if (adminsCount <= 1) {
            throw new Error('Нельзя деактивировать последнего администратора');
          }
        }

        const newState = !user.is_active;
        await user.update({ is_active: newState });

        if (!newState) {
          await RefreshToken.update(
            { revoked: true },
            { where: { user_id: id, revoked: false } }
          );
        }

        return {
          success: true,
          message: newState ? 'Пользователь активирован' : 'Пользователь деактивирован',
          user: formatUser(user)
        };
      }
    },

    // ============================================
    // CLEANUP TOKENS — только внутренние вызовы
    // ============================================
    cleanupTokens: {
      visibility: 'private',
      handler: async function (ctx) {
        const now = new Date();

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
    async generateAndSaveTokens(user, ctx = {}) {
      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_TTL
      });

      const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_TTL }
      );

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