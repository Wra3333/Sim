const { WorkTime, Equipment, Lesson } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  name: 'worktime',

  actions: {
    create: {
      params: {
        equipment_id: { type: 'number', integer: true, positive: true, convert: true },
        lesson_id: { type: 'number', integer: true, positive: true, optional: true, convert: true },
        start_time: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ },
        end_time: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ },
        students_count: { type: 'number', integer: true, min: 0, optional: true, convert: true }
      },
      handler: async ctx => {
        const start = new Date(ctx.params.start_time);
        const end = new Date(ctx.params.end_time);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error(' Невалидная дата');
        }

        if (start >= end) {
          throw new Error(' Время начала не может быть позже времени окончания');
        }

        const totalHours = (end - start) / (1000 * 60 * 60);
        if (totalHours <= 0) {
          throw new Error(' Продолжительность должна быть больше 0');
        }

        const equipment = await Equipment.findByPk(ctx.params.equipment_id);
        if (!equipment) {
          throw new Error(' Оборудование не найдено');
        }

        if (ctx.params.lesson_id) {
          const lesson = await Lesson.findByPk(ctx.params.lesson_id);
          if (!lesson) {
            throw new Error(' Занятие не найдено');
          }
        }

        return await WorkTime.create({
          ...ctx.params,
          total_hours: parseFloat(totalHours.toFixed(2)),
          created_by: ctx.meta.user?.id
        });
      }
    },

    list: {
      params: {},
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

    getByEquipment: {
      params: {
        equipmentId: { type: 'number', integer: true, positive: true, convert: true }
      },
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

    report: {
      params: {
        start: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
        end: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
        equipmentId: { type: 'number', integer: true, positive: true, optional: true, convert: true }
      },
      handler: async ctx => {
        const { start, end, equipmentId } = ctx.params;

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error(' Невалидная дата');
        }

        if (startDate > endDate) {
          throw new Error(' Дата начала не может быть позже даты окончания');
        }

        const where = {
          start_time: {
            [Op.gte]: `${start}T00:00:00`,
            [Op.lte]: `${end}T23:59:59`
          }
        };

        if (equipmentId) {
          where.equipment_id = equipmentId;
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

    summary: {
      params: {
        equipmentId: { type: 'number', integer: true, positive: true, convert: true },
        start: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
        end: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ }
      },
      handler: async ctx => {
        const { equipmentId, start, end } = ctx.params;

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error(' Невалидная дата');
        }

        if (startDate > endDate) {
          throw new Error(' Дата начала не может быть позже даты окончания');
        }

        const reports = await WorkTime.findAll({
          where: {
            equipment_id: equipmentId,
            start_time: {
              [Op.gte]: `${start}T00:00:00`,
              [Op.lte]: `${end}T23:59:59`
            }
          },
          include: [
            { model: Equipment, as: 'equipment' },
            { model: Lesson, as: 'lesson' }
          ],
          order: [['start_time', 'ASC']]
        });

        const totalHours = reports.reduce((sum, r) => sum + parseFloat(r.total_hours || 0), 0);
        const totalStudents = reports.reduce((sum, r) => sum + (r.students_count || 0), 0);
        const sessionsCount = reports.length;

        return {
          equipment_id: equipmentId,
          total_hours: totalHours.toFixed(2),
          total_students: totalStudents,
          sessions_count: sessionsCount,
          reports
        };
      }
    }
  }
};