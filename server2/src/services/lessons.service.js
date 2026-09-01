const { Lesson, Template, WorkTime, Equipment } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  name: 'lessons',

  actions: {
    create: {
      handler: async function(ctx) {
        const data = ctx.params;

        // Проверяем оборудование из equipment_list (если есть)
        if (data.equipment_list && data.equipment_list.length > 0) {
          const ids = data.equipment_list.map(item => item.equipment_id);
          const equipment = await Equipment.findAll({
            where: { id: ids }
          });
          
          // ❌ НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ:
          // - working_status: 'Требует ремонта' или 'В ремонте'
          // - write_off_status: 'На списание' или 'Списан'
          const invalid = equipment.filter(eq => 
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );
          
          if (invalid.length > 0) {
            const names = invalid
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`❌ Оборудование не может быть использовано в занятии: ${names}`);
          }
        }

        const lesson = await Lesson.create(data);

        // Если занятие создано из шаблона и сразу проведено
        if (data.template_id && data.status === 'Проведено') {
          const template = await Template.findByPk(data.template_id);
          if (template && template.equipment_list) {
            const equipments = typeof template.equipment_list === 'string'
              ? JSON.parse(template.equipment_list)
              : template.equipment_list;

            if (equipments && equipments.length > 0) {
              const ids = equipments.map(eq => eq.equipment_id);
              const equipment = await Equipment.findAll({
                where: { id: ids }
              });
              
              // ❌ НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ оборудование из шаблона:
              // - working_status: 'Требует ремонта' или 'В ремонте'
              // - write_off_status: 'На списание' или 'Списан'
              const invalid = equipment.filter(eq => 
                eq.working_status !== 'Исправен' ||
                eq.write_off_status === 'На списание' ||
                eq.write_off_status === 'Списан'
              );
              
              if (invalid.length > 0) {
                const names = invalid
                  .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
                  .join(', ');
                throw new Error(`❌ Оборудование из шаблона не может быть использовано: ${names}`);
              }

              // Создаем записи WorkTime
              for (const eq of equipments) {
                await WorkTime.create({
                  equipment_id: eq.equipment_id,
                  lesson_id: lesson.id,
                  start_time: `${data.date} ${data.start_time}`,
                  end_time: `${data.date} ${data.end_time}`,
                  students_count: data.students_count || 0
                });
              }
            }
          }
        }

        return lesson;
      }
    },

    list: {
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
      params: { id: { type: 'number', integer: true, positive: true } },
      handler: async function(ctx) {
        return await Lesson.findByPk(ctx.params.id, {
          include: [
            { model: Template, as: 'template' },
            { model: WorkTime, as: 'workTimes', include: [{ model: Equipment, as: 'equipment' }] }
          ]
        });
      }
    },

    update: {
      handler: async function(ctx) {
        const { id, ...data } = ctx.params;
        const lesson = await Lesson.findByPk(id);
        if (!lesson) throw new Error('❌ Занятие не найдено');

        // Проверяем оборудование
        if (data.equipment_list && data.equipment_list.length > 0) {
          const ids = data.equipment_list.map(item => item.equipment_id);
          const equipment = await Equipment.findAll({
            where: { id: ids }
          });
          
          // ❌ НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ:
          // - working_status: 'Требует ремонта' или 'В ремонте'
          // - write_off_status: 'На списание' или 'Списан'
          const invalid = equipment.filter(eq => 
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );
          
          if (invalid.length > 0) {
            const names = invalid
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`❌ Оборудование не может быть использовано в занятии: ${names}`);
          }
        }

        await lesson.update(data);
        return lesson;
      }
    },

    complete: {
      handler: async function(ctx) {
        const lesson = await Lesson.findByPk(ctx.params.id);
        if (!lesson) throw new Error('❌ Занятие не найдено');

        if (lesson.status === 'Проведено') {
          throw new Error('❌ Занятие уже проведено');
        }

        const equipments = lesson.equipment_list
          ? (typeof lesson.equipment_list === 'string' ? JSON.parse(lesson.equipment_list) : lesson.equipment_list)
          : [];

        if (equipments && equipments.length > 0) {
          const ids = equipments.map(eq => eq.equipment_id);
          const equipment = await Equipment.findAll({
            where: { id: ids }
          });
          
          // ❌ НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ:
          // - working_status: 'Требует ремонта' или 'В ремонте'
          // - write_off_status: 'На списание' или 'Списан'
          const invalid = equipment.filter(eq => 
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );
          
          if (invalid.length > 0) {
            const names = invalid
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`❌ Оборудование не может быть использовано в занятии: ${names}`);
          }

          // Создаем записи WorkTime
          for (const eq of equipments) {
            await WorkTime.create({
              equipment_id: eq.equipment_id,
              lesson_id: lesson.id,
              start_time: `${lesson.date} ${lesson.start_time}`,
              end_time: `${lesson.date} ${lesson.end_time}`,
              students_count: lesson.students_count || 0
            });
          }
        }

        await lesson.update({ status: 'Проведено' });
        return lesson;
      }
    },

    delete: {
      handler: async function(ctx) {
        const lesson = await Lesson.findByPk(ctx.params.id);
        if (!lesson) throw new Error('❌ Занятие не найдено');
        
        if (lesson.status === 'Проведено') {
          throw new Error('❌ Нельзя удалить проведенное занятие');
        }
        
        await lesson.destroy();
        return { success: true };
      }
    }
  }
};