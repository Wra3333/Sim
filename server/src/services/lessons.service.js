const { Lesson, Template, WorkTime, Equipment } = require('../models');
const { Op } = require('sequelize');

const VALID_LESSON_STATUSES = ['Запланировано', 'Проведено', 'Отменено'];

module.exports = {
  name: 'lessons',

  actions: {
    create: {
      params: {
        title: { type: 'string', required: true, min: 1, max: 255 },
        group: { type: 'string', required: true, min: 1, max: 100 },
        teacher: { type: 'string', required: true, min: 1, max: 100 },
        students_count: { type: 'number', required: true, integer: true, min: 0, convert: true },
        date: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        start_time: { type: 'string', required: true, pattern: /^\d{2}:\d{2}(:\d{2})?$/ },
        end_time: { type: 'string', required: true, pattern: /^\d{2}:\d{2}(:\d{2})?$/ },
        template_id: { type: 'number', integer: true, positive: true, optional: true, convert: true },
        status: { type: 'enum', values: VALID_LESSON_STATUSES, default: 'Запланировано' },
        notes: { type: 'string', optional: true, max: 1000 },
        equipment_list: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              equipment_id: { type: 'number', integer: true, positive: true },
              quantity: { type: 'number', integer: true, min: 1 }
            }
          },
          optional: true
        }
      },
      handler: async function(ctx) {
        const data = ctx.params;

        if (data.template_id) {
          const template = await Template.findByPk(data.template_id);
          if (!template) {
            throw new Error('Шаблон не найден');
          }
          if (!template.is_active) {
            throw new Error('Шаблон неактивен и не может быть использован');
          }
        }

        const startTime = data.start_time.substring(0, 5);
        const endTime = data.end_time.substring(0, 5);

        if (startTime >= endTime) {
          throw new Error('Время начала не может быть позже времени окончания');
        }

        if (data.equipment_list && data.equipment_list.length > 0) {
          const ids = data.equipment_list.map(item => item.equipment_id);
          const equipment = await Equipment.findAll({
            where: { id: ids }
          });

          const invalid = equipment.filter(eq =>
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );

          if (invalid.length > 0) {
            const names = invalid
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в занятии: ${names}`);
          }
        }

        data.start_time = startTime;
        data.end_time = endTime;
        data.created_by = ctx.meta.user?.id;
        data.updated_by = ctx.meta.user?.id;

        const lesson = await Lesson.create(data);

        if (data.status === 'Проведено' && data.equipment_list) {
          for (const eq of data.equipment_list) {
            await WorkTime.create({
              equipment_id: eq.equipment_id,
              lesson_id: lesson.id,
              start_time: `${data.date} ${data.start_time}`,
              end_time: `${data.date} ${data.end_time}`,
              students_count: data.students_count || 0,
              created_by: ctx.meta.user?.id
            });
          }
        }

        return lesson;
      }
    },

    list: {
      params: {
        status: { type: 'enum', values: VALID_LESSON_STATUSES, optional: true },
        group: { type: 'string', optional: true, max: 100 },
        teacher: { type: 'string', optional: true, max: 100 }
      },
      handler: async function(ctx) {
        const where = {};
        if (ctx.params.status) where.status = ctx.params.status;
        if (ctx.params.group) where.group = ctx.params.group;
        if (ctx.params.teacher) where.teacher = ctx.params.teacher;

        return await Lesson.findAll({
          where,
          include: [
            { model: Template, as: 'template' },
            { model: WorkTime, as: 'workTimes' }
          ],
          order: [['date', 'DESC']]
        });
      }
    },

    get: {
      params: {
        id: { type: 'number', required: true, integer: true, positive: true, convert: true }
      },
      handler: async function(ctx) {
        const lesson = await Lesson.findByPk(ctx.params.id, {
          include: [
            { model: Template, as: 'template' },
            { model: WorkTime, as: 'workTimes', include: [{ model: Equipment, as: 'equipment' }] }
          ]
        });
        if (!lesson) throw new Error('Занятие не найдено');
        return lesson;
      }
    },

    update: {
      params: {
        id: { type: 'number', required: true, integer: true, positive: true, convert: true },
        title: { type: 'string', optional: true, min: 1, max: 255 },
        group: { type: 'string', optional: true, min: 1, max: 100 },
        teacher: { type: 'string', optional: true, min: 1, max: 100 },
        students_count: { type: 'number', optional: true, integer: true, min: 0, convert: true },
        date: { type: 'string', optional: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        start_time: { type: 'string', optional: true, pattern: /^\d{2}:\d{2}(:\d{2})?$/ },
        end_time: { type: 'string', optional: true, pattern: /^\d{2}:\d{2}(:\d{2})?$/ },
        template_id: { type: 'number', optional: true, integer: true, positive: true, convert: true },
        status: { type: 'enum', values: VALID_LESSON_STATUSES, optional: true },
        notes: { type: 'string', optional: true, max: 1000 },
        equipment_list: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              equipment_id: { type: 'number', integer: true, positive: true },
              quantity: { type: 'number', integer: true, min: 1 }
            }
          },
          optional: true
        }
      },
      handler: async function(ctx) {
        const { id, ...data } = ctx.params;
        const lesson = await Lesson.findByPk(id, {
          include: [{ model: WorkTime, as: 'workTimes' }]
        });
        
        if (!lesson) throw new Error('Занятие не найдено');

        const oldStatus = lesson.status;

        if (data.template_id) {
          const template = await Template.findByPk(data.template_id);
          if (!template) {
            throw new Error('Шаблон не найден');
          }
          if (!template.is_active) {
            throw new Error('Шаблон неактивен и не может быть использован');
          }
        }

        const oldData = {
          date: lesson.date,
          start_time: lesson.start_time,
          end_time: lesson.end_time,
          students_count: lesson.students_count,
          equipment_list: lesson.equipment_list ? JSON.parse(JSON.stringify(lesson.equipment_list)) : [],
          template_id: lesson.template_id,
          status: lesson.status
        };

        let startTime = data.start_time;
        let endTime = data.end_time;

        if (startTime) {
          startTime = startTime.substring(0, 5);
          data.start_time = startTime;
        }
        if (endTime) {
          endTime = endTime.substring(0, 5);
          data.end_time = endTime;
        }

        if (startTime && endTime && startTime >= endTime) {
          throw new Error('Время начала не может быть позже времени окончания');
        }

        const equipmentList = data.equipment_list;
        if (equipmentList !== undefined && Array.isArray(equipmentList) && equipmentList.length > 0) {
          const ids = equipmentList.map(item => item.equipment_id);
          const equipment = await Equipment.findAll({
            where: { id: ids }
          });

          const invalid = equipment.filter(eq =>
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );

          if (invalid.length > 0) {
            const names = invalid
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в занятии: ${names}`);
          }
        }

        data.updated_by = ctx.meta.user?.id;
        await lesson.update(data);

        const newStatus = data.status || lesson.status;

        if (newStatus === 'Отменено') {
          await WorkTime.destroy({
            where: { lesson_id: lesson.id }
          });
          return await Lesson.findByPk(id, {
            include: [{ model: WorkTime, as: 'workTimes' }]
          });
        }

        if (newStatus === 'Проведено' && oldStatus !== 'Проведено') {
          const finalEquipmentList = equipmentList !== undefined ? equipmentList : (lesson.equipment_list || []);
          
          await WorkTime.destroy({
            where: { lesson_id: lesson.id }
          });

          if (finalEquipmentList.length > 0) {
            const finalDate = data.date || lesson.date;
            const finalStart = data.start_time || lesson.start_time;
            const finalEnd = data.end_time || lesson.end_time;
            const finalStudents = data.students_count !== undefined ? data.students_count : lesson.students_count;

            for (const eq of finalEquipmentList) {
              await WorkTime.create({
                equipment_id: eq.equipment_id,
                lesson_id: lesson.id,
                start_time: `${finalDate} ${finalStart}`,
                end_time: `${finalDate} ${finalEnd}`,
                students_count: finalStudents || 0,
                created_by: ctx.meta.user?.id
              });
            }
          }
          return await Lesson.findByPk(id, {
            include: [{ model: WorkTime, as: 'workTimes' }]
          });
        }

        if (newStatus === 'Запланировано' && oldStatus === 'Проведено') {
          await WorkTime.destroy({
            where: { lesson_id: lesson.id }
          });
          return await Lesson.findByPk(id, {
            include: [{ model: WorkTime, as: 'workTimes' }]
          });
        }

        if (newStatus === 'Проведено') {
          const finalEquipmentList = equipmentList !== undefined ? equipmentList : (lesson.equipment_list || []);
          const finalDate = data.date || lesson.date;
          const finalStart = data.start_time || lesson.start_time;
          const finalEnd = data.end_time || lesson.end_time;
          const finalStudents = data.students_count !== undefined ? data.students_count : lesson.students_count;

          const timeChanged = 
            (data.date && data.date !== oldData.date) ||
            (data.start_time && data.start_time !== oldData.start_time) ||
            (data.end_time && data.end_time !== oldData.end_time) ||
            (data.students_count !== undefined && data.students_count !== oldData.students_count);

          const equipmentChanged = data.equipment_list !== undefined && 
            JSON.stringify(data.equipment_list) !== JSON.stringify(oldData.equipment_list);

          const templateChanged = data.template_id !== undefined && data.template_id !== oldData.template_id;

          if (timeChanged || equipmentChanged || templateChanged) {
            await WorkTime.destroy({
              where: { lesson_id: lesson.id }
            });

            if (finalEquipmentList.length > 0) {
              for (const eq of finalEquipmentList) {
                await WorkTime.create({
                  equipment_id: eq.equipment_id,
                  lesson_id: lesson.id,
                  start_time: `${finalDate} ${finalStart}`,
                  end_time: `${finalDate} ${finalEnd}`,
                  students_count: finalStudents || 0,
                  created_by: ctx.meta.user?.id
                });
              }
            }
          }
        }

        return await Lesson.findByPk(id, {
          include: [{ model: WorkTime, as: 'workTimes' }]
        });
      }
    },

    complete: {
      params: {
        id: { type: 'number', required: true, integer: true, positive: true, convert: true }
      },
      handler: async function(ctx) {
        const lesson = await Lesson.findByPk(ctx.params.id);
        if (!lesson) throw new Error('Занятие не найдено');

        if (lesson.status === 'Проведено') {
          throw new Error('Занятие уже проведено');
        }

        const equipments = lesson.equipment_list
          ? (typeof lesson.equipment_list === 'string' ? JSON.parse(lesson.equipment_list) : lesson.equipment_list)
          : [];

        if (equipments && equipments.length > 0) {
          const ids = equipments.map(eq => eq.equipment_id);
          const equipment = await Equipment.findAll({
            where: { id: ids }
          });

          const invalid = equipment.filter(eq =>
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );

          if (invalid.length > 0) {
            const names = invalid
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в занятии: ${names}`);
          }

          const startTime = lesson.start_time ? lesson.start_time.substring(0, 5) : lesson.start_time;
          const endTime = lesson.end_time ? lesson.end_time.substring(0, 5) : lesson.end_time;

          for (const eq of equipments) {
            await WorkTime.create({
              equipment_id: eq.equipment_id,
              lesson_id: lesson.id,
              start_time: `${lesson.date} ${startTime}`,
              end_time: `${lesson.date} ${endTime}`,
              students_count: lesson.students_count || 0,
              created_by: ctx.meta.user?.id
            });
          }
        }

        await lesson.update({ 
          status: 'Проведено',
          updated_by: ctx.meta.user?.id
        });
        return lesson;
      }
    },

    delete: {
      params: {
        id: { type: 'number', required: true, integer: true, positive: true, convert: true }
      },
      handler: async function(ctx) {
        const lesson = await Lesson.findByPk(ctx.params.id);
        if (!lesson) throw new Error('Занятие не найдено');

        if (lesson.status === 'Проведено') {
          throw new Error('Нельзя удалить проведенное занятие');
        }

        await lesson.destroy();
        return { success: true };
      }
    }
  }
};