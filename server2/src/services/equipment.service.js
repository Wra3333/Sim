const { Equipment, Repair, WorkTime } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

module.exports = {
  name: 'equipment',

  actions: {
    // CREATE
    create: {
      handler: async ctx => {
        const existing = await Equipment.findOne({
          where: { inventory_number: ctx.params.inventory_number }
        });
        
        if (existing) {
          throw new Error(`❌ Оборудование с инвентарным номером "${ctx.params.inventory_number}" уже существует`);
        }
        return await Equipment.create(ctx.params);
      }
    },

    // GET ALL
    list: {
      handler: async ctx => {
        const where = {};
        if (ctx.params.working_status) where.working_status = ctx.params.working_status;
        if (ctx.params.write_off_status) where.write_off_status = ctx.params.write_off_status;
        if (ctx.params.search) {
          where[Op.or] = [
            { inventory_number: { [Op.like]: `%${ctx.params.search}%` } },
            { inventory_name: { [Op.like]: `%${ctx.params.search}%` } },
            { name: { [Op.like]: `%${ctx.params.search}%` } }
          ];
        }
        return await Equipment.findAll({
          where,
          include: [
            { model: Repair, as: 'repairs' },
            { model: WorkTime, as: 'workTimes' }
          ]
        });
      }
    },

    // GET BY ID
    get: {
      handler: async ctx => {
        const equipment = await Equipment.findByPk(ctx.params.id, {
          include: [
            { model: Repair, as: 'repairs' },
            { model: WorkTime, as: 'workTimes' }
          ]
        });
        if (!equipment) throw new Error('Оборудование не найдено');
        return equipment;
      }
    },

    // UPDATE

update: {
  handler: async ctx => {
    const { id, ...data } = ctx.params;
    const equipment = await Equipment.findByPk(id);
    if (!equipment) throw new Error('Оборудование не найдено');

    // ✅ Проверка: нельзя изменить статус на "Исправен", если есть активные заявки
    if (data.working_status === 'Исправен') {
      const activeRepairs = await Repair.count({
        where: { equipment_id: id, is_resolved: false }
      });
    };
    await equipment.update(data);
    return equipment;
  }
},

    // DELETE
    delete: {
      handler: async ctx => {
        const equipment = await Equipment.findByPk(ctx.params.id);
        if (!equipment) throw new Error('Оборудование не найдено');

        const activeRepairsCount = await Repair.count({
            where: {
              equipment_id: ctx.params.id,
              is_resolved: false  // ✅ только активные (не устранённые)
              }
        });
        if (activeRepairsCount > 0) {
          throw new Error(`❌ Нельзя удалить: есть ${activeRepairsCount} активных заявок на ремонт`);
        }

        if (equipment.photo) {
          const photoPath = path.join(__dirname, '../../uploads', path.basename(equipment.photo));
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        }

        await equipment.destroy();
        return { success: true };
      }
    },

    // VALIDATE EQUIPMENT STATUS
    validateStatus: {
      params: { ids: { type: 'array', items: 'number' } },
      handler: async ctx => {
        const invalid = await Equipment.findAll({
          where: {
            id: ctx.params.ids,
            working_status: { [Op.in]: ['Требует ремонта', 'В ремонте'] }
          }
        });
        return invalid;
      }
    },

    // ЗАГРУЗКА ФОТО
    uploadPhoto: {
      params: {
        id: { type: 'number', convert: true, integer: true, positive: true },
        file: { type: 'any', optional: true }
      },
      handler: async ctx => {
        const id = ctx.params.id;
        const file = ctx.params.file || ctx.meta.file;

        if (!file) {
          throw new Error('❌ Файл не передан');
        }

        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
          throw new Error('❌ Оборудование не найдено');
        }

        if (equipment.photo) {
          const oldPath = path.join(__dirname, '../../uploads', path.basename(equipment.photo));
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const photoPath = `/uploads/${file.filename}`;
        await equipment.update({ photo: photoPath });

        return {
          success: true,
          photo: photoPath,
          message: '✅ Фото загружено'
        };
      }
    },

    // ✅ УДАЛЕНИЕ ФОТО
    deletePhoto: {
      params: {
        id: { type: 'number', convert: true, integer: true, positive: true }
      },
      handler: async ctx => {
        const id = ctx.params.id;

        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
          throw new Error('❌ Оборудование не найдено');
        }

        if (!equipment.photo) {
          throw new Error('❌ У оборудования нет фото');
        }

        const photoPath = path.join(__dirname, '../../uploads', path.basename(equipment.photo));
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }

        await equipment.update({ photo: null });

        return {
          success: true,
          message: '✅ Фото удалено'
        };
      }
    }
  }
};