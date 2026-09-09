  const { Log } = require('../models');
  const { Op } = require('sequelize');
  // ДОБАВЛЯЕМ sequelize
  const sequelize = require('../config/database');

  module.exports = {
    name: 'logs',

    actions: {
      // ============================================
      // CREATE - создать запись лога
      // ============================================
      create: {
        params: {
          user_id: { type: 'number', integer: true, positive: true },
          user_name: { type: 'string', min: 1, max: 100 },
          action: { type: 'string', min: 1, max: 50 },
          entity: { type: 'string', min: 1, max: 50 },
          entity_id: { type: 'number', integer: true, positive: true, optional: true },
          details: { type: 'string', optional: true, max: 1000 },
          ip: { type: 'string', optional: true, max: 45 },
          user_agent: { type: 'string', optional: true, max: 255 }
        },
        handler: async ctx => {
          return await Log.create(ctx.params);
        }
      },

      // ============================================
      // LIST - список логов с фильтрацией
      // ============================================
      list: {
        params: {
          user_id: { type: 'number', integer: true, positive: true, optional: true },
          action: { type: 'string', optional: true },
          entity: { type: 'string', optional: true },
          date_from: { type: 'string', optional: true },
          date_to: { type: 'string', optional: true },
          page: { type: 'number', integer: true, min: 1, default: 1, optional: true },
          limit: { type: 'number', integer: true, min: 1, max: 100, default: 20, optional: true }
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
            totalPages: Math.ceil(count / limit)
          };
        }
      },

      // ============================================
      // GET BY USER - логи по пользователю
      // ============================================
      getByUser: {
        params: {
          user_id: { type: 'number', integer: true, positive: true },
          limit: { type: 'number', integer: true, min: 1, max: 100, default: 10, optional: true }
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
      // GET BY ENTITY - логи по сущности
      // ============================================
      getByEntity: {
        params: {
          entity: { type: 'string', min: 1, max: 50 },
          entity_id: { type: 'number', integer: true, positive: true },
          limit: { type: 'number', integer: true, min: 1, max: 100, default: 10, optional: true }
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
      // GET STATS - статистика по логам (ИСПРАВЛЕНО)
      // ============================================
      getStats: {
        params: {
          date_from: { type: 'string', optional: true },
          date_to: { type: 'string', optional: true }
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

          // ИСПРАВЛЕНО: используем sequelize правильно
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
      // CLEANUP - очистка старых логов
      // ============================================
      cleanup: {
        params: {
          days: { type: 'number', integer: true, min: 1, max: 365, default: 90 }
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