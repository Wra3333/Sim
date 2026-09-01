const { Repair, Equipment, Lesson } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  name: 'repairs',

  actions: {
    // ============================================
    // CREATE - создание заявки на несколько устройств
    // ============================================
    create: {
      handler: async ctx => {
        const { equipment_ids, ...data } = ctx.params;

        // ✅ Проверяем, что equipment_ids - это массив
        if (!equipment_ids || !Array.isArray(equipment_ids) || equipment_ids.length === 0) {
          throw new Error('❌ Укажите хотя бы одно оборудование');
        }

        // ✅ Проверяем существование оборудования
        const equipmentList = await Equipment.findAll({
          where: { id: equipment_ids }
        });

        if (equipmentList.length !== equipment_ids.length) {
          const foundIds = equipmentList.map(e => e.id);
          const notFound = equipment_ids.filter(id => !foundIds.includes(id));
          throw new Error(`❌ Оборудование не найдено: ${notFound.join(', ')}`);
        }

        // ✅ Создаем заявки для каждого оборудования
        const repairs = [];
        for (const equipmentId of equipment_ids) {
          const repair = await Repair.create({
            ...data,
            equipment_id: equipmentId
          });
          repairs.push(repair);

          // ✅ Меняем статус оборудования на "В ремонте"
          await Equipment.update(
            { working_status: 'В ремонте' },
            { where: { id: equipmentId } }
          );
        }

        // ✅ Возвращаем созданные заявки
        return {
          success: true,
          message: `✅ Создано ${repairs.length} заявок`,
          repairs: repairs
        };
      }
    },

    // ============================================
    // GET ALL
    // ============================================
    list: {
      handler: async ctx => {
        const where = {};
        
        // Фильтр по оборудованию
        if (ctx.params.equipment_id) {
          where.equipment_id = ctx.params.equipment_id;
        }

        // Фильтр по статусу
        if (ctx.params.is_resolved !== undefined) {
          where.is_resolved = ctx.params.is_resolved === 'true' || ctx.params.is_resolved === true;
        }

        return await Repair.findAll({
          where,
          include: [{ model: Equipment, as: 'equipment' }],
          order: [['created_at', 'DESC']]
        });
      }
    },

    // ============================================
    // GET BY EQUIPMENT
    // ============================================
    getByEquipment: {
      handler: async ctx => {
        const equipmentId = ctx.params.equipmentId;
        
        // Проверяем существование оборудования
        const equipment = await Equipment.findByPk(equipmentId);
        if (!equipment) {
          throw new Error('❌ Оборудование не найдено');
        }

        return await Repair.findAll({
          where: { equipment_id: equipmentId },
          include: [{ model: Equipment, as: 'equipment' }],
          order: [['created_at', 'DESC']]
        });
      }
    },

    // ============================================
    // GET BY MULTIPLE EQUIPMENT
    // ============================================
    getByEquipmentIds: {
      handler: async ctx => {
        const { equipment_ids } = ctx.params;
        
        if (!equipment_ids || !Array.isArray(equipment_ids) || equipment_ids.length === 0) {
          throw new Error('❌ Укажите ID оборудования');
        }

        return await Repair.findAll({
          where: {
            equipment_id: equipment_ids
          },
          include: [{ model: Equipment, as: 'equipment' }],
          order: [['created_at', 'DESC']]
        });
      }
    },

    // ============================================
    // RESOLVE - закрытие заявки
    // ============================================
    resolve: {
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
        if (!repair) throw new Error('❌ Заявка не найдена');
        if (repair.is_resolved) throw new Error('❌ Заявка уже закрыта');

        const updateData = {
          is_resolved: true,
          resolution_date: resolution_date || new Date(),
          resolved_by: resolved_by || 'Администратор'
        };

        // Обработка статусов
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

        // ✅ Проверяем, есть ли еще активные заявки на это оборудование
        const activeRepairs = await Repair.count({
          where: {
            equipment_id: repair.equipment_id,
            is_resolved: false
          }
        });

        // ✅ Обновляем статус оборудования только если нет других активных заявок
        if (activeRepairs === 0) {
          if (resolution_status === 'impossible') {
            // ❌ Списание
            await Equipment.update(
              {
                write_off_status: 'Списан',
              },
              { where: { id: repair.equipment_id } }
            );
          } else if (resolution_status === 'needs_repair') {
            await Equipment.update(
              { working_status: 'Требует ремонта' },
              { where: { id: repair.equipment_id } }
            );
          } else {
            // ✅ Устранено
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
    // RESOLVE ALL - закрыть все заявки на оборудование
    // ============================================
    resolveAll: {
      handler: async ctx => {
        const { 
          equipment_id, 
          resolved_by, 
          resolution_date, 
          resolution_status, 
          write_off_reason, 
          repair_notes 
        } = ctx.params;

        if (!equipment_id) {
          throw new Error('❌ Укажите ID оборудования');
        }

        // Проверяем оборудование
        const equipment = await Equipment.findByPk(equipment_id);
        if (!equipment) throw new Error('❌ Оборудование не найдено');

        // Находим все активные заявки
        const repairs = await Repair.findAll({
          where: {
            equipment_id: equipment_id,
            is_resolved: false
          }
        });

        if (repairs.length === 0) {
          throw new Error('❌ Нет активных заявок на это оборудование');
        }

        // Закрываем все заявки
        const updateData = {
          is_resolved: true,
          resolution_date: resolution_date || new Date(),
          resolved_by: resolved_by || 'Администратор'
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

        await Repair.update(
          updateData,
          { where: { id: repairs.map(r => r.id) } }
        );

        // Обновляем статус оборудования
        if (resolution_status === 'impossible') {
          await Equipment.update(
            { 
              working_status: 'Списан',
              write_off_status: 'Списан'
            },
            { where: { id: equipment_id } }
          );
        } else if (resolution_status === 'needs_repair') {
          await Equipment.update(
            { working_status: 'Требует ремонта' },
            { where: { id: equipment_id } }
          );
        } else {
          await Equipment.update(
            { working_status: 'Исправен' },
            { where: { id: equipment_id } }
          );
        }

        return {
          success: true,
          message: `✅ Закрыто ${repairs.length} заявок`,
          repairs: repairs
        };
      }
    },

    // ============================================
    // UPDATE - обновление заявки
    // ============================================
    update: {
      handler: async ctx => {
        const { id, ...data } = ctx.params;

        const repair = await Repair.findByPk(id);
        if (!repair) throw new Error('❌ Заявка не найдена');

        // ✅ Нельзя менять equipment_id
        if (data.equipment_id) {
          throw new Error('❌ Нельзя изменить оборудование в заявке');
        }

        // ✅ Нельзя редактировать закрытую заявку
        if (repair.is_resolved) {
          throw new Error('❌ Нельзя редактировать закрытую заявку');
        }

        // ✅ Разрешенные поля для обновления
        const allowedFields = ['nature_of_malfunction', 'detected_by', 'repair_possibility', 'detection_date'];
        const updateData = {};
        for (const field of allowedFields) {
          if (data[field] !== undefined) {
            updateData[field] = data[field];
          }
        }

        if (Object.keys(updateData).length === 0) {
          throw new Error('❌ Нет данных для обновления');
        }

        await repair.update(updateData);
        return repair;
      }
    },

    // ============================================
    // UPDATE RESOLVED BY - обновление кто закрыл
    // ============================================
    updateResolvedBy: {
      handler: async ctx => {
        const { id, resolved_by } = ctx.params;

        if (!resolved_by) {
          throw new Error('❌ Укажите кто закрыл заявку');
        }

        const repair = await Repair.findByPk(id);
        if (!repair) throw new Error('❌ Заявка не найдена');

        if (!repair.is_resolved) {
          throw new Error('❌ Нельзя редактировать активную заявку');
        }

        await repair.update({ resolved_by });
        return repair;
      }
    },

    // ============================================
    // DELETE - удаление заявки
    // ============================================
    delete: {
      handler: async ctx => {
        const repair = await Repair.findByPk(ctx.params.id);
        if (!repair) throw new Error('❌ Заявка не найдена');

        // ✅ Нельзя удалить закрытую заявку
        if (repair.is_resolved) {
          throw new Error('❌ Нельзя удалить закрытую заявку');
        }

        const equipmentId = repair.equipment_id;
        await repair.destroy();

        // ✅ Проверяем, есть ли еще активные заявки на это оборудование
        const activeRepairs = await Repair.count({
          where: {
            equipment_id: equipmentId,
            is_resolved: false
          }
        });

        // ✅ Если нет активных заявок, меняем статус на "Исправен"
        if (activeRepairs === 0) {
          await Equipment.update(
            { working_status: 'Исправен' },
            { where: { id: equipmentId } }
          );
        }

        return { success: true, message: '✅ Заявка удалена' };
      }
    },

    // ============================================
    // DELETE ALL - удалить все заявки на оборудование
    // ============================================
    deleteAll: {
      handler: async ctx => {
        const { equipment_id } = ctx.params;

        if (!equipment_id) {
          throw new Error('❌ Укажите ID оборудования');
        }

        // Проверяем оборудование
        const equipment = await Equipment.findByPk(equipment_id);
        if (!equipment) throw new Error('❌ Оборудование не найдено');

        // Находим все активные заявки
        const repairs = await Repair.findAll({
          where: {
            equipment_id: equipment_id,
            is_resolved: false
          }
        });

        if (repairs.length === 0) {
          throw new Error('❌ Нет активных заявок на это оборудование');
        }

        // Удаляем все заявки
        await Repair.destroy({
          where: {
            equipment_id: equipment_id,
            is_resolved: false
          }
        });

        // Меняем статус оборудования на "Исправен"
        await Equipment.update(
          { working_status: 'Исправен' },
          { where: { id: equipment_id } }
        );

        return {
          success: true,
          message: `✅ Удалено ${repairs.length} заявок`
        };
      }
    },

    // ============================================
    // GET ACTIVE FOR EQUIPMENT - получить активные заявки
    // ============================================
    getActiveForEquipment: {
      handler: async ctx => {
        const { equipment_id } = ctx.params;

        if (!equipment_id) {
          throw new Error('❌ Укажите ID оборудования');
        }

        return await Repair.findAll({
          where: {
            equipment_id: equipment_id,
            is_resolved: false
          },
          include: [{ model: Equipment, as: 'equipment' }],
          order: [['created_at', 'DESC']]
        });
      }
    }
  }
};