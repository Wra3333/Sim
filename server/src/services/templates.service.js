const { Template, Lesson, Equipment, WorkTime } = require('../models');

module.exports = {
  name: 'templates',

  actions: {
    create: {
      params: {
        title: { type: 'string', min: 1, max: 255 },
        discipline: { type: 'string', min: 1, max: 255 },
        description: { type: 'string', optional: true, max: 1000 },
        is_active: { type: 'boolean', default: true },
        equipment_list: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              equipment_id: { type: 'number', integer: true, positive: true },
              quantity: { type: 'number', integer: true, min: 1, default: 1 }
            }
          },
          optional: true
        }
      },
      handler: async function(ctx) {
        const data = ctx.params;

        if (data.equipment_list && data.equipment_list.length > 0) {
          const equipmentIds = data.equipment_list.map(item => item.equipment_id);

          const existingEquipment = await Equipment.findAll({
            where: { id: equipmentIds }
          });

          if (existingEquipment.length !== equipmentIds.length) {
            throw new Error('Некоторое оборудование не найдено');
          }

          const invalidEquipment = existingEquipment.filter(eq =>
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );

          if (invalidEquipment.length > 0) {
            const names = invalidEquipment
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в шаблоне: ${names}`);
          }
        }

        data.created_by = ctx.meta.user?.id;
        data.updated_by = ctx.meta.user?.id;

        return await Template.create(data);
      }
    },

    list: {
      params: {
        is_active: { type: 'boolean', optional: true },
        discipline: { type: 'string', optional: true },
        search: { type: 'string', optional: true }
      },
      handler: async function(ctx) {
        const where = {};
        const { Op } = require('sequelize');
        
        if (ctx.params && ctx.params.is_active !== undefined) {
          where.is_active = ctx.params.is_active;
        }
        
        if (ctx.params && ctx.params.discipline) {
          where.discipline = ctx.params.discipline;
        }
        
        if (ctx.params && ctx.params.search) {
          where[Op.or] = [
            { title: { [Op.like]: `%${ctx.params.search}%` } },
            { discipline: { [Op.like]: `%${ctx.params.search}%` } }
          ];
        }

        return await Template.findAll({
          where,
          include: [{ model: Lesson, as: 'lessons' }],
          order: [['created_at', 'DESC']]
        });
      }
    },

    get: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async function(ctx) {
        const template = await Template.findByPk(ctx.params.id, {
          include: [{ model: Lesson, as: 'lessons' }]
        });
        if (!template) throw new Error('Шаблон не найден');
        return template;
      }
    },

    update: {
      params: {
        id: { type: 'number', required: true, integer: true, positive: true, convert: true },
        title: { type: 'string', optional: true, min: 1, max: 255 },
        discipline: { type: 'string', optional: true, min: 1, max: 255 },
        description: { type: 'string', optional: true, max: 1000 },
        is_active: { type: 'boolean', optional: true },
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
        
        const template = await Template.findByPk(id);
        if (!template) throw new Error('Шаблон не найден');

        const oldEquipmentList = template.equipment_list 
          ? JSON.parse(JSON.stringify(template.equipment_list)) 
          : [];

        if (data.equipment_list && data.equipment_list.length > 0) {
          const equipmentIds = data.equipment_list.map(item => item.equipment_id);
          const existingEquipment = await Equipment.findAll({
            where: { id: equipmentIds }
          });

          if (existingEquipment.length !== equipmentIds.length) {
            throw new Error('Некоторое оборудование не найдено');
          }

          const invalidEquipment = existingEquipment.filter(eq =>
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );

          if (invalidEquipment.length > 0) {
            const names = invalidEquipment
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в шаблоне: ${names}`);
          }
        }

        data.updated_by = ctx.meta.user?.id;
        await template.update(data);

        const equipmentChanged = data.equipment_list !== undefined && 
          JSON.stringify(data.equipment_list) !== JSON.stringify(oldEquipmentList);

        if (equipmentChanged) {
          const lessons = await Lesson.findAll({
            where: { 
              template_id: id,
              status: ['Запланировано', 'Проведено']
            }
          });

          if (lessons.length > 0) {
            return {
              success: true,
              template: template,
              hasLinkedLessons: true,
              linkedLessonsCount: lessons.length,
              linkedLessons: lessons.map(l => ({
                id: l.id,
                title: l.title,
                status: l.status,
                date: l.date
              })),
              message: `Шаблон обновлен. ${lessons.length} занятий используют этот шаблон.`
            };
          }
        }

        return {
          success: true,
          template: template,
          hasLinkedLessons: false,
          message: 'Шаблон успешно обновлен'
        };
      }
    },

    delete: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async function(ctx) {
        const template = await Template.findByPk(ctx.params.id);
        if (!template) throw new Error('Шаблон не найден');

        await Lesson.update(
          { template_id: null },
          { where: { template_id: ctx.params.id } }
        );

        await template.destroy();
        return { success: true };
      }
    },

    addEquipment: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        equipment_id: { type: 'number', integer: true, positive: true, convert: true },
        quantity: { type: 'number', integer: true, min: 1, default: 1 }
      },
      handler: async function(ctx) {
        const template = await Template.findByPk(ctx.params.id);
        if (!template) throw new Error('Шаблон не найден');

        const equipment = await Equipment.findByPk(ctx.params.equipment_id);
        if (!equipment) throw new Error('Оборудование не найдено');

        if (equipment.working_status !== 'Исправен') {
          throw new Error(`Оборудование "${equipment.name}" не может быть добавлено: статус "${equipment.working_status}"`);
        }

        if (equipment.write_off_status === 'На списание' || equipment.write_off_status === 'Списан') {
          throw new Error(`Оборудование "${equipment.name}" не может быть добавлено: статус списания "${equipment.write_off_status}"`);
        }

        let equipmentList = template.equipment_list || [];
        const exists = equipmentList.some(item => item.equipment_id === ctx.params.equipment_id);

        if (exists) {
          equipmentList = equipmentList.map(item => {
            if (item.equipment_id === ctx.params.equipment_id) {
              return { ...item, quantity: ctx.params.quantity };
            }
            return item;
          });
        } else {
          equipmentList.push({
            equipment_id: ctx.params.equipment_id,
            quantity: ctx.params.quantity
          });
        }

        await template.update({ equipment_list: equipmentList });
        return template;
      }
    },

    removeEquipment: {
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        equipment_id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async function(ctx) {
        const template = await Template.findByPk(ctx.params.id);
        if (!template) throw new Error('Шаблон не найден');

        let equipmentList = template.equipment_list || [];
        equipmentList = equipmentList.filter(
          item => item.equipment_id !== ctx.params.equipment_id
        );

        await template.update({ equipment_list: equipmentList });
        return template;
      }
    },

    syncLessons: {
      params: {
        templateId: { type: 'number', required: true, integer: true, positive: true },
        lessonIds: { type: 'array', items: 'number', optional: true }
      },
      handler: async function(ctx) {
        const { templateId, lessonIds } = ctx.params;

        const template = await Template.findByPk(templateId);
        if (!template) throw new Error('Шаблон не найден');

        let newEquipmentList = template.equipment_list;
        if (typeof newEquipmentList === 'string') {
          try {
            newEquipmentList = JSON.parse(newEquipmentList);
          } catch {
            newEquipmentList = [];
          }
        }

        if (!newEquipmentList || newEquipmentList.length === 0) {
          throw new Error('В шаблоне нет оборудования');
        }

        const where = { template_id: templateId };
        if (lessonIds && lessonIds.length > 0) {
          where.id = lessonIds;
        }

        const lessons = await Lesson.findAll({
          where: where,
          include: [{ model: WorkTime, as: 'workTimes' }]
        });

        if (lessons.length === 0) {
          throw new Error('Нет занятий для обновления');
        }

        let updated = 0;
        let skipped = 0;
        const errors = [];

        for (const lesson of lessons) {
          if (lesson.status === 'Проведено') {
            skipped++;
            continue;
          }

          try {
            await lesson.update({
              equipment_list: newEquipmentList,
              updated_by: ctx.meta.user?.id
            });
            updated++;
          } catch (err) {
            errors.push(`Занятие ${lesson.id}: ${err.message}`);
          }
        }

        return {
          success: true,
          total: lessons.length,
          updated: updated,
          skipped: skipped,
          errors: errors.length > 0 ? errors : undefined,
          message: `Обновлено ${updated} занятий, пропущено ${skipped} (проведенные)`
        };
      }
    }
  }
};