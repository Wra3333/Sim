const { Template, Lesson, Equipment } = require('../models');

module.exports = {
  name: 'templates',

  actions: {
    create: {
      handler: async function(ctx) {
        const data = ctx.params;
        
        if (data.equipment_list && data.equipment_list.length > 0) {
          const equipmentIds = data.equipment_list.map(item => item.equipment_id);
          
          // Проверяем существование
          const existingEquipment = await Equipment.findAll({
            where: { id: equipmentIds }
          });
          
          if (existingEquipment.length !== equipmentIds.length) {
            throw new Error('❌ Некоторое оборудование не найдено');
          }
          
          // ❌ НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ:
          // - working_status: 'Требует ремонта' или 'В ремонте'
          // - write_off_status: 'На списание' или 'Списан'
          const invalidEquipment = existingEquipment.filter(eq => 
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );
          
          if (invalidEquipment.length > 0) {
            const names = invalidEquipment
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`❌ Оборудование не может быть использовано в шаблоне: ${names}`);
          }
        }
        
        return await Template.create(data);
      }
    },

    list: {
      handler: async function(ctx) {
        const where = {};
        if (ctx.params && ctx.params.is_active !== undefined) {
          where.is_active = ctx.params.is_active === 'true' || ctx.params.is_active === true;
        }
        
        return await Template.findAll({
          where,
          include: [{ model: Lesson, as: 'lessons' }],
          order: [['created_at', 'DESC']]
        });
      }
    },

    get: {
      handler: async function(ctx) {
        const template = await Template.findByPk(ctx.params.id, {
          include: [{ model: Lesson, as: 'lessons' }]
        });
        if (!template) throw new Error('Шаблон не найден');
        return template;
      }
    },

    update: {
      handler: async function(ctx) {
        const { id, ...data } = ctx.params;
        
        const template = await Template.findByPk(id);
        if (!template) throw new Error('Шаблон не найден');
        
        if (data.equipment_list && data.equipment_list.length > 0) {
          const equipmentIds = data.equipment_list.map(item => item.equipment_id);
          
          const existingEquipment = await Equipment.findAll({
            where: { id: equipmentIds }
          });
          
          if (existingEquipment.length !== equipmentIds.length) {
            throw new Error('❌ Некоторое оборудование не найдено');
          }
          
          // ❌ НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ:
          // - working_status: 'Требует ремонта' или 'В ремонте'
          // - write_off_status: 'На списание' или 'Списан'
          const invalidEquipment = existingEquipment.filter(eq => 
            eq.working_status !== 'Исправен' ||
            eq.write_off_status === 'На списание' ||
            eq.write_off_status === 'Списан'
          );
          
          if (invalidEquipment.length > 0) {
            const names = invalidEquipment
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`❌ Оборудование не может быть использовано в шаблоне: ${names}`);
          }
        }
        
        await template.update(data);
        return template;
      }
    },

    delete: {
      handler: async function(ctx) {
        const template = await Template.findByPk(ctx.params.id);
        if (!template) throw new Error('Шаблон не найден');

        // Отвязываем занятия
        await Lesson.update(
          { template_id: null },
          { where: { template_id: ctx.params.id } }
        );

        await template.destroy();
        return { success: true };
      }
    },

    addEquipment: {
      handler: async function(ctx) {
        const template = await Template.findByPk(ctx.params.id);
        if (!template) throw new Error('Шаблон не найден');
        
        const equipment = await Equipment.findByPk(ctx.params.equipment_id);
        if (!equipment) throw new Error('Оборудование не найдено');
        
        // ❌ НЕЛЬЗЯ ДОБАВЛЯТЬ:
        // - working_status: 'Требует ремонта' или 'В ремонте'
        // - write_off_status: 'На списание' или 'Списан'
        if (equipment.working_status !== 'Исправен') {
          throw new Error(`❌ Оборудование "${equipment.name}" не может быть добавлено: статус "${equipment.working_status}"`);
        }
        
        if (equipment.write_off_status === 'На списание' || equipment.write_off_status === 'Списан') {
          throw new Error(`❌ Оборудование "${equipment.name}" не может быть добавлено: статус списания "${equipment.write_off_status}"`);
        }
        
        let equipmentList = template.equipment_list || [];
        const exists = equipmentList.some(item => item.equipment_id === ctx.params.equipment_id);
        
        if (exists) {
          equipmentList = equipmentList.map(item => {
            if (item.equipment_id === ctx.params.equipment_id) {
              return { ...item, quantity: ctx.params.quantity || 1 };
            }
            return item;
          });
        } else {
          equipmentList.push({
            equipment_id: ctx.params.equipment_id,
            quantity: ctx.params.quantity || 1
          });
        }
        
        await template.update({ equipment_list: equipmentList });
        return template;
      }
    },

    removeEquipment: {
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
    }
  }
};