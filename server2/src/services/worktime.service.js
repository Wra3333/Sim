const { WorkTime, Equipment, Lesson } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  name: 'worktime',

  actions: {
    // CREATE
    create: {
      params: {
        equipment_id: { type: 'number', integer: true, positive: true },
        lesson_id: { type: 'number', integer: true, optional: true },
        start_time: { type: 'string' },
        end_time: { type: 'string' },
        students_count: { type: 'number', integer: true, optional: true }
      },
      handler: async ctx => {
        const start = new Date(ctx.params.start_time);
        const end = new Date(ctx.params.end_time);
        const totalHours = (end - start) / (1000 * 60 * 60);

        return await WorkTime.create({
          ...ctx.params,
          total_hours: parseFloat(totalHours.toFixed(2))
        });
      }
    },

    // GET ALL
    list: {
      handler: async () => {
        return await WorkTime.findAll({
          include: [
            { model: Equipment, as: 'equipment' },
            { model: Lesson, as: 'lesson' }
          ],
          order: [['start_time', 'DESC']]
        });
      }
    },

    // GET BY EQUIPMENT
    getByEquipment: {
      params: { equipmentId: { type: 'number', integer: true, positive: true } },
      handler: async ctx => {
        return await WorkTime.findAll({
          where: { equipment_id: ctx.params.equipmentId },
          include: [
            { model: Equipment, as: 'equipment' },
            { model: Lesson, as: 'lesson' }
          ],
          order: [['start_time', 'DESC']]
        });
      }
    },

    // REPORT
    report: {
      params: {
        start: { type: 'string' },
        end: { type: 'string' },
        equipmentId: { type: 'number', integer: true, optional: true }
      },
      handler: async ctx => {
        const where = {
          start_time: { [Op.gte]: new Date(ctx.params.start) },
          end_time: { [Op.lte]: new Date(ctx.params.end) }
        };
        if (ctx.params.equipmentId) {
          where.equipment_id = ctx.params.equipmentId;
        }

        return await WorkTime.findAll({
          where,
          include: [
            { model: Equipment, as: 'equipment' },
            { model: Lesson, as: 'lesson' }
          ],
          order: [['start_time', 'ASC']]
        });
      }
    },

    // SUMMARY
    summary: {
      params: {
        equipmentId: { type: 'number', integer: true, positive: true },
        start: { type: 'string' },
        end: { type: 'string' }
      },
      handler: async ctx => {
        const reports = await this.actions.report(ctx.params);

        const totalHours = reports.reduce((sum, r) => sum + parseFloat(r.total_hours || 0), 0);
        const totalStudents = reports.reduce((sum, r) => sum + (r.students_count || 0), 0);
        const sessionsCount = reports.length;

        return {
          equipment_id: ctx.params.equipmentId,
          total_hours: totalHours.toFixed(2),
          total_students: totalStudents,
          sessions_count: sessionsCount,
          reports
        };
      }
    }
  }
};