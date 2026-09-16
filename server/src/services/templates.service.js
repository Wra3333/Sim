const { Template, Lesson, Equipment, WorkTime } = require('../models');
const { Op } = require('sequelize');
const AuthorizeMixin = require('../mixins/authorize.mixin');

// ============================================
// ОБЩАЯ ПРОВЕРКА ОБОРУДОВАНИЯ
// ============================================
// «Исправен» и «Частично неисправен» — можно.
// «Требует ремонта», «В ремонте», «Списан» и write_off «На списание»/«Списан» — нельзя.
const isEquipmentInvalid = (eq) => {
  return (
    eq.working_status === 'Требует ремонта' ||
    eq.working_status === 'В ремонте' ||
    eq.working_status === 'Списан' ||
    eq.write_off_status === 'На списание' ||
    eq.write_off_status === 'Списан'
  );
};

// ============================================
// ДЕДУПЛИКАЦИЯ equipment_list
// Оставляем последний элемент для каждого equipment_id
// ============================================
const dedupeEquipmentList = (list) => {
  if (!Array.isArray(list)) return [];
  return [...new Map(
    list.map(item => [item.equipment_id, item])
  ).values()];
};

module.exports = {
  name: 'templates',
  mixins: [AuthorizeMixin],

  // ============================================
  // ХУКИ: проверка авторизации + роли
  // ============================================
  hooks: {
    before: {
      '*': ['checkIsAuthenticated', 'checkUserRole']
    }
  },

  actions: {
    // ============================================
    // CREATE — админ, методист, лаборант
    // ============================================
    create: {
      roles: ['admin', 'methodist', 'lab_assistant'],
      params: {
        title: { type: 'string', required: true, min: 1, max: 255 },
        discipline: { type: 'string', required: true, min: 1, max: 255 },
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
          // ✅ Уникальные ID — без дублей
          const equipmentIds = [...new Set(data.equipment_list.map(item => item.equipment_id))];

          const existingEquipment = await Equipment.findAll({
            where: { id: equipmentIds }
          });

          if (existingEquipment.length !== equipmentIds.length) {
            throw new Error('Некоторое оборудование не найдено');
          }

          const invalidEquipment = existingEquipment.filter(isEquipmentInvalid);

          if (invalidEquipment.length > 0) {
            const names = invalidEquipment
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в шаблоне: ${names}`);
          }

          // ✅ Дедупликация массива
          data.equipment_list = dedupeEquipmentList(data.equipment_list);
        }

        data.created_by = ctx.meta.user?.id;
        data.updated_by = ctx.meta.user?.id;

        return await Template.create(data);
      }
    },

    // ============================================
    // LIST — админ, методист, лаборант
    // ============================================
    list: {
      roles: ['admin', 'methodist', 'lab_assistant', 'technician'],
      params: {
        is_active: { type: 'boolean', optional: true },
        discipline: { type: 'string', optional: true },
        search: { type: 'string', optional: true }
      },
      handler: async function(ctx) {
        const where = {};

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

    // ============================================
    // GET — админ, методист, лаборант
    // ============================================
    get: {
      roles: ['admin', 'methodist', 'lab_assistant', 'technician'],
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

    // ============================================
    // UPDATE — админ, методист, лаборант
    // ============================================
    update: {
      roles: ['admin', 'methodist', 'lab_assistant'],
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

        // Проверка: нельзя деактивировать шаблон с запланированными занятиями
        const willBeInactive = data.is_active === false && template.is_active === true;

        if (willBeInactive) {
          const plannedLessonsCount = await Lesson.count({
            where: {
              template_id: id,
              status: 'Запланировано'
            }
          });

          if (plannedLessonsCount > 0) {
            throw new Error(
              `Нельзя деактивировать шаблон: ${plannedLessonsCount} запланированных занятий используют его.`
            );
          }
        }

        if (data.equipment_list && data.equipment_list.length > 0) {
          // ✅ Уникальные ID — без дублей
          const equipmentIds = [...new Set(data.equipment_list.map(item => item.equipment_id))];

          const existingEquipment = await Equipment.findAll({
            where: { id: equipmentIds }
          });

          if (existingEquipment.length !== equipmentIds.length) {
            throw new Error('Некоторое оборудование не найдено');
          }

          const invalidEquipment = existingEquipment.filter(isEquipmentInvalid);

          if (invalidEquipment.length > 0) {
            const names = invalidEquipment
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в шаблоне: ${names}`);
          }

          // ✅ Дедупликация массива
          data.equipment_list = dedupeEquipmentList(data.equipment_list);
        }

        data.updated_by = ctx.meta.user?.id;
        await template.update(data);

        // ✅ Нормализованное сравнение
        const normalize = (list) => JSON.stringify(
          (list || []).map(item => ({
            equipment_id: item.equipment_id,
            quantity: item.quantity
          }))
        );

        const equipmentChanged = data.equipment_list !== undefined &&
          normalize(data.equipment_list) !== normalize(oldEquipmentList);

        // ✅ Единый формат ответа
        let linkedLessons = [];

        if (equipmentChanged) {
          linkedLessons = await Lesson.findAll({
            where: {
              template_id: id,
              status: ['Запланировано', 'Проведено']
            }
          });
        }

        return {
          success: true,
          template,
          hasLinkedLessons: linkedLessons.length > 0,
          linkedLessonsCount: linkedLessons.length,
          linkedLessons: linkedLessons.map(l => ({
            id: l.id,
            title: l.title,
            status: l.status,
            date: l.date
          })),
          message: linkedLessons.length > 0
            ? `Шаблон обновлен. ${linkedLessons.length} занятий используют этот шаблон.`
            : 'Шаблон успешно обновлен'
        };
      }
    },

    // ============================================
    // DELETE — админ, методист, лаборант
    // ============================================
    delete: {
      roles: ['admin', 'methodist', 'lab_assistant'],
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

    // ============================================
    // ADD EQUIPMENT — админ, методист, лаборант
    // ============================================
    addEquipment: {
      roles: ['admin', 'methodist', 'lab_assistant'],
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

        if (isEquipmentInvalid(equipment)) {
          throw new Error(
            `Оборудование "${equipment.name}" не может быть добавлено: статус "${equipment.working_status}", списание "${equipment.write_off_status}"`
          );
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

    // ============================================
    // REMOVE EQUIPMENT — админ, методист, лаборант
    // ============================================
    removeEquipment: {
      roles: ['admin', 'methodist', 'lab_assistant'],
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

    // ============================================
    // SYNC LESSONS — админ, методист, лаборант
    // ============================================
    syncLessons: {
      roles: ['admin', 'methodist', 'lab_assistant'],
      params: {
        id: { type: 'number', required: true, integer: true, positive: true },
        lessonIds: { type: 'array', items: 'number', optional: true }
      },
      handler: async function(ctx) {
        const { id, lessonIds } = ctx.params;

        const template = await Template.findByPk(id);
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

        const where = { template_id: id };
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