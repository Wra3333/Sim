const { Repair, Equipment, Lesson } = require('../models');
const { Op } = require('sequelize');
const AuthorizeMixin = require('../mixins/authorize.mixin');

const VALID_REPAIR_POSSIBILITIES = ['Самостоятельно', 'Требуется сервисный инженер', 'Не подлежит ремонту'];
const VALID_RESOLUTION_STATUSES = ['resolved', 'needs_repair', 'impossible'];

module.exports = {
  name: 'repairs',
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
    // CREATE — админ, методист, техник
    // ============================================
    create: {
      roles: ['admin', 'methodist', 'technician'],
      params: {
        equipment_ids: { type: 'array', items: 'number', min: 1 },
        detection_date: {
          type: 'string',
          required: true,
          pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
          min: 10,
          max: 20
        },
        nature_of_malfunction: { type: 'string', required: true, min: 1, max: 500 },
        detected_by: { type: 'string', required: true, min: 1, max: 100 },
        repair_possibility: {
          type: 'enum',
          values: VALID_REPAIR_POSSIBILITIES,
          default: 'Самостоятельно'
        }
      },
      handler: async ctx => {
        const { equipment_ids, ...data } = ctx.params;

        // ✅ Уникальные ID — без дублей
        const uniqueIds = [...new Set(equipment_ids)];

        const equipmentList = await Equipment.findAll({
          where: { id: uniqueIds }
        });

        if (equipmentList.length !== uniqueIds.length) {
          const foundIds = equipmentList.map(e => e.id);
          const notFound = uniqueIds.filter(id => !foundIds.includes(id));
          throw new Error(`Оборудование не найдено: ${notFound.join(', ')}`);
        }

        const invalidEquipment = equipmentList.filter(eq =>
          eq.write_off_status === 'Списан' ||
          eq.write_off_status === 'На списание'
        );

        if (invalidEquipment.length > 0) {
          const names = invalidEquipment.map(e => e.name).join(', ');
          throw new Error(`Оборудование списано и не может быть отремонтировано: ${names}`);
        }

        const repairs = [];
        for (const equipmentId of uniqueIds) {
          const repair = await Repair.create({
            ...data,
            equipment_id: equipmentId,
            created_by: ctx.meta.user?.id
          });
          repairs.push(repair);

          await Equipment.update(
            { working_status: 'В ремонте' },
            { where: { id: equipmentId } }
          );
        }

        return {
          success: true,
          message: `Создано ${repairs.length} заявок`,
          repairs: repairs
        };
      }
    },

    // ============================================
    // LIST — все роли
    // ============================================
    list: {
      roles: ['admin', 'methodist', 'lab_assistant', 'technician'],
      params: {
        equipment_id: { type: 'number', integer: true, positive: true, optional: true, convert: true },
        is_resolved: { type: 'boolean', optional: true }
      },
      handler: async ctx => {
        const where = {};
        if (ctx.params.equipment_id) {
          where.equipment_id = ctx.params.equipment_id;
        }
        if (ctx.params.is_resolved !== undefined) {
          where.is_resolved = ctx.params.is_resolved;
        }

        return await Repair.findAll({
          where,
          include: [{ model: Equipment, as: 'equipment' }],
          order: [['created_at', 'DESC']]
        });
      }
    },

    // ============================================
    // GET BY EQUIPMENT — все роли
    // ============================================
    getByEquipment: {
      roles: ['admin', 'methodist', 'lab_assistant', 'technician'],
      params: {
        equipmentId: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        const equipmentId = ctx.params.equipmentId;
        const equipment = await Equipment.findByPk(equipmentId);
        if (!equipment) {
          throw new Error('Оборудование не найдено');
        }

        return await Repair.findAll({
          where: { equipment_id: equipmentId },
          include: [{ model: Equipment, as: 'equipment' }],
          order: [['created_at', 'DESC']]
        });
      }
    },

    // ============================================
    // RESOLVE — только админ, техник
    // ============================================
    resolve: {
      roles: ['admin', 'technician'],
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        resolved_by: { type: 'string', min: 1, max: 100 },
        resolution_date: { type: 'string', optional: true },
        resolution_status: {
          type: 'enum',
          values: VALID_RESOLUTION_STATUSES,
          default: 'resolved'
        },
        write_off_reason: { type: 'string', optional: true, max: 500 },
        repair_notes: { type: 'string', optional: true, max: 500 }
      },
      handler: async ctx => {
        const {
          id,
          resolved_by,
          resolution_date,
          resolution_status,
          write_off_reason,
          repair_notes
        } = ctx.params;

        const repair = await Repair.findByPk(id);
        if (!repair) throw new Error('Заявка не найдена');
        if (repair.is_resolved) throw new Error('Заявка уже закрыта');

        const updateData = {
          is_resolved: true,
          resolution_date: resolution_date || new Date(),
          resolved_by: resolved_by
        };

        if (resolution_status === 'impossible') {
          updateData.resolution_status = 'impossible';
          updateData.write_off_reason = write_off_reason || 'Не указана';
        } else if (resolution_status === 'needs_repair') {
          updateData.resolution_status = 'needs_repair';
          updateData.repair_notes = repair_notes || 'Требуется ремонт';
        } else {
          updateData.resolution_status = 'resolved';
          updateData.write_off_reason = null;
          updateData.repair_notes = null;
        }

        await repair.update(updateData);

        const activeRepairs = await Repair.count({
          where: {
            equipment_id: repair.equipment_id,
            is_resolved: false
          }
        });

        if (activeRepairs === 0) {
          if (resolution_status === 'impossible') {
            await Equipment.update(
              {
                working_status: 'Требует ремонта',
                write_off_status: 'Списан'
              },
              { where: { id: repair.equipment_id } }
            );
          } else if (resolution_status === 'needs_repair') {
            await Equipment.update(
              { working_status: 'Требует ремонта' },
              { where: { id: repair.equipment_id } }
            );
          } else {
            await Equipment.update(
              { working_status: 'Исправен' },
              { where: { id: repair.equipment_id } }
            );
          }
        }

        return repair;
      }
    },

    // ============================================
    // UPDATE — админ, методист, техник
    // ============================================
    update: {
      roles: ['admin', 'methodist', 'technician'],
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        detection_date: {
          type: 'string',
          pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
          optional: true
        },
        nature_of_malfunction: { type: 'string', optional: true, min: 1, max: 500 },
        detected_by: { type: 'string', optional: true, min: 1, max: 100 },
        repair_possibility: {
          type: 'enum',
          values: VALID_REPAIR_POSSIBILITIES,
          optional: true
        }
      },
      handler: async ctx => {
        const { id, ...data } = ctx.params;

        const repair = await Repair.findByPk(id);
        if (!repair) throw new Error('Заявка не найдена');

        await repair.update(data);
        return repair;
      }
    },

    // ============================================
    // UPDATE RESOLVED BY — только админ, техник
    // ============================================
    updateResolvedBy: {
      roles: ['admin', 'technician'],
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true },
        resolved_by: { type: 'string', min: 1, max: 100 }
      },
      handler: async ctx => {
        const { id, resolved_by } = ctx.params;

        const repair = await Repair.findByPk(id);
        if (!repair) throw new Error('Заявка не найдена');


        await repair.update({ resolved_by });
        return repair;
      }
    },

    // ============================================
    // DELETE — разделение по статусу заявки
    // ============================================
    // Общая проверка: админ, техник.
    // Если заявка ЗАКРЫТА — только админ, техник.
    // Если заявка НЕЗАКРЫТА — админ, техник.
    delete: {
      roles: ['admin', 'technician'],
      params: {
        id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        const repair = await Repair.findByPk(ctx.params.id);
        if (!repair) throw new Error('Заявка не найдена');

        const userRole = ctx.meta.user?.role;

        // Дополнительная проверка по статусу заявки
        if (repair.is_resolved) {
          if (!['admin', 'technician'].includes(userRole)) {
            throw new Error('Закрытую заявку может удалить только администратор или техник');
          }
        } else {
          if (!['admin', 'technician'].includes(userRole)) {
            throw new Error('Недостаточно прав для удаления незакрытой заявки');
          }
        }

        const equipmentId = repair.equipment_id;
        await repair.destroy();

        const activeRepairs = await Repair.count({
          where: {
            equipment_id: equipmentId,
            is_resolved: false
          }
        });

        if (activeRepairs === 0) {
          await Equipment.update(
            { working_status: 'Исправен' },
            { where: { id: equipmentId } }
          );
        }

        return { success: true, message: 'Заявка удалена' };
      }
    },

    // ============================================
    // GET ACTIVE FOR EQUIPMENT — все роли
    // ============================================
    getActiveForEquipment: {
      roles: ['admin', 'methodist', 'lab_assistant', 'technician'],
      params: {
        equipment_id: { type: 'number', integer: true, positive: true, convert: true }
      },
      handler: async ctx => {
        return await Repair.findAll({
          where: {
            equipment_id: ctx.params.equipment_id,
            is_resolved: false
          },
          include: [{ model: Equipment, as: 'equipment' }],
          order: [['created_at', 'DESC']]
        });
      }
    }
  }
};