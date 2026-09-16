const { Log } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const AuthorizeMixin = require('../mixins/authorize.mixin');

module.exports = {
  name: 'logs',
  mixins: [AuthorizeMixin],

  // ============================================
  // ХУКИ: проверка ролей для админских экшенов
  // create — приватный, без проверок (внутренние вызовы)
  // ============================================
  hooks: {
    before: {
      list: ['checkIsAuthenticated', 'checkUserRole'],
      getByUser: ['checkIsAuthenticated', 'checkUserRole'],
      getByEntity: ['checkIsAuthenticated', 'checkUserRole'],
      getStats: ['checkIsAuthenticated', 'checkUserRole'],
      cleanup: ['checkIsAuthenticated', 'checkUserRole']
    }
  },

  actions: {
    // ============================================
    // CREATE — приватный, только внутренние вызовы
    // ============================================
    create: {
      visibility: 'private',
      params: {
        user_id: { type: 'number', integer: true, positive: true, optional: true, convert: true },
        user_name: { type: 'string', min: 1, max: 100, optional: true },
        action: { type: 'string', min: 1, max: 50 },
        entity: { type: 'string', min: 1, max: 50 },
        entity_id: { type: 'number', integer: true, positive: true, optional: true, convert: true },
        details: { type: 'string', optional: true, max: 1000 },
        ip: { type: 'string', optional: true, max: 45 },
        user_agent: { type: 'string', optional: true, max: 255 }
      },
      handler: async ctx => {
        return await Log.create(ctx.params);
      }
    },

    // ============================================
    // LIST — только админ
    // ============================================
    list: {
      roles: ['admin'],
      params: {
        user_id: { type: 'number', integer: true, positive: true, optional: true, convert: true },
        action: { type: 'string', optional: true },
        entity: { type: 'string', optional: true },
        date_from: { type: 'string', optional: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        date_to: { type: 'string', optional: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        page: { type: 'number', integer: true, min: 1, default: 1, optional: true, convert: true },
        limit: { type: 'number', integer: true, min: 1, max: 100, default: 20, optional: true, convert: true }
      },
      handler: async ctx => {
        const { page, limit, user_id, action, entity, date_from, date_to } = ctx.params;
        const offset = (page - 1) * limit;

        const where = {};
        if (user_id) where.user_id = user_id;
        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (date_from) {
          where.created_at = { [Op.gte]: new Date(date_from) };
        }
        if (date_to) {
          where.created_at = {
            ...where.created_at,
            [Op.lte]: new Date(date_to + 'T23:59:59')
          };
        }

        const { count, rows } = await Log.findAndCountAll({
          where,
          order: [['created_at', 'DESC']],
          limit,
          offset
        });

        return {
          logs: rows,
          total: count,
          page,
          totalPages: Math.max(1, Math.ceil(count / limit))
        };
      }
    },

    // ============================================
    // GET BY USER — только админ
    // ============================================
    getByUser: {
      roles: ['admin'],
      params: {
        user_id: { type: 'number', integer: true, positive: true, convert: true },
        limit: { type: 'number', integer: true, min: 1, max: 100, default: 10, optional: true, convert: true }
      },
      handler: async ctx => {
        const { user_id, limit } = ctx.params;

        return await Log.findAll({
          where: { user_id },
          order: [['created_at', 'DESC']],
          limit
        });
      }
    },

    // ============================================
    // GET BY ENTITY — только админ
    // ============================================
    getByEntity: {
      roles: ['admin'],
      params: {
        entity: { type: 'string', min: 1, max: 50 },
        entity_id: { type: 'number', integer: true, positive: true, convert: true },
        limit: { type: 'number', integer: true, min: 1, max: 100, default: 10, optional: true, convert: true }
      },
      handler: async ctx => {
        const { entity, entity_id, limit } = ctx.params;

        return await Log.findAll({
          where: {
            entity,
            entity_id
          },
          order: [['created_at', 'DESC']],
          limit
        });
      }
    },

    // ============================================
    // GET STATS — только админ
    // ============================================
    getStats: {
      roles: ['admin'],
      params: {
        date_from: { type: 'string', optional: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        date_to: { type: 'string', optional: true, pattern: /^\d{4}-\d{2}-\d{2}$/ }
      },
      handler: async ctx => {
        const { date_from, date_to } = ctx.params;

        const where = {};
        if (date_from) {
          where.created_at = { [Op.gte]: new Date(date_from) };
        }
        if (date_to) {
          where.created_at = {
            ...where.created_at,
            [Op.lte]: new Date(date_to + 'T23:59:59')
          };
        }

        // Общее количество
        const total = await Log.count({ where });

        // По действиям
        const actions = await Log.findAll({
          attributes: [
            'action',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where,
          group: ['action'],
          order: [[sequelize.literal('count'), 'DESC']]
        });

        // По пользователям
        const users = await Log.findAll({
          attributes: [
            'user_name',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where,
          group: ['user_name'],
          order: [[sequelize.literal('count'), 'DESC']],
          limit: 10
        });

        // По сущностям
        const entities = await Log.findAll({
          attributes: [
            'entity',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where,
          group: ['entity'],
          order: [[sequelize.literal('count'), 'DESC']]
        });

        return {
          total,
          by_action: actions,
          by_user: users,
          by_entity: entities
        };
      }
    },

    // ============================================
    // CLEANUP — только админ
    // ============================================
    cleanup: {
      roles: ['admin'],
      params: {
        days: { type: 'number', integer: true, min: 1, max: 365, default: 90, convert: true }
      },
      handler: async ctx => {
        const { days } = ctx.params;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const deleted = await Log.destroy({
          where: {
            created_at: { [Op.lt]: cutoffDate }
          }
        });

        return {
          success: true,
          deletedCount: deleted,
          message: `Удалено ${deleted} записей логов старше ${days} дней`
        };
      }
    }
  }
};