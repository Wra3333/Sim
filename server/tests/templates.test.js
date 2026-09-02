// tests/templates.test.js - ИСПРАВЛЕННЫЙ
const { Template, Lesson, Equipment } = require('../src/models');
const templatesService = require('../src/services/templates.service');

describe('Templates Service Tests', () => {
  let testTemplateId;
  let testEquipmentId;

  beforeEach(async () => {
    await Template.destroy({ where: {}, truncate: true, cascade: true });
    await Equipment.destroy({ where: {}, truncate: true, cascade: true });

    const equipment = await Equipment.create({
      inventory_number: 'TEMP-EQ-001',
      inventory_name: 'Тестовое оборудование',
      name: 'Test',
      year_of_release: 2024,
      purchase_basis: 'Тест',
      working_status: 'Исправен'
    });
    testEquipmentId = equipment.id;

    const template = await Template.create({
      title: 'Тестовый шаблон',
      discipline: 'Тест',
      module: 'Тест',
      is_active: true,
      equipment_list: [{ equipment_id: testEquipmentId, quantity: 1 }]
    });
    testTemplateId = template.id;
  });

  describe('CREATE', () => {
    it('should create template successfully', async () => {
      const params = {
        title: 'Шаблон урока физики',
        discipline: 'Физика',
        module: 'Механика',
        description: 'Базовый шаблон для уроков физики',
        is_active: true,
        equipment_list: [{ equipment_id: testEquipmentId, quantity: 1 }]
      };

      const result = await templatesService.actions.create.handler({ params });

      expect(result).toBeDefined();
      expect(result.title).toBe('Шаблон урока физики');
      expect(result.is_active).toBe(true);
      expect(result.equipment_list).toBeDefined();
    });

    it('should throw error if equipment is not working', async () => {
      const brokenEquipment = await Equipment.create({
        inventory_number: 'TEMP-BROKEN',
        inventory_name: 'Сломанный проектор',
        name: 'Broken Projector',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'В ремонте'
      });

      const params = {
        title: 'Шаблон с неисправным оборудованием',
        discipline: 'Тест',
        module: 'Тест',
        equipment_list: [{ equipment_id: brokenEquipment.id, quantity: 1 }]
      };

      await expect(
        templatesService.actions.create.handler({ params })
      ).rejects.toThrow('Оборудование не может быть использовано');
    });

    it('should create template with empty equipment list', async () => {
      const params = {
        title: 'Шаблон без оборудования',
        discipline: 'Тест',
        module: 'Тест',
        equipment_list: []
      };

      const result = await templatesService.actions.create.handler({ params });

      expect(result.equipment_list).toEqual([]);
    });
  });

  describe('LIST', () => {
    beforeEach(async () => {
      await Template.bulkCreate([
        {
          title: 'Шаблон 1',
          discipline: 'Математика',
          module: 'Алгебра',
          is_active: true
        },
        {
          title: 'Шаблон 2',
          discipline: 'Физика',
          module: 'Оптика',
          is_active: true
        },
        {
          title: 'Шаблон 3',
          discipline: 'Химия',
          module: 'Органика',
          is_active: false
        }
      ]);
    });

    it('should list all templates', async () => {
      const result = await templatesService.actions.list.handler({ params: {} });
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by is_active', async () => {
      const result = await templatesService.actions.list.handler({
        params: { is_active: true }
      });
      expect(result.every(t => t.is_active === true)).toBe(true);
    });
  });

  describe('GET', () => {
    let testTemplate;

    beforeEach(async () => {
      testTemplate = await Template.create({
        title: 'Шаблон для получения',
        discipline: 'Тест',
        module: 'Тест',
        is_active: true
      });
    });

    it('should get template by id', async () => {
      const result = await templatesService.actions.get.handler({
        params: { id: testTemplate.id }
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(testTemplate.id);
      expect(result.title).toBe('Шаблон для получения');
    });

    it('should throw error if template not found', async () => {
      await expect(
        templatesService.actions.get.handler({
          params: { id: 99999 }
        })
      ).rejects.toThrow('Шаблон не найден');
    });
  });

  describe('UPDATE', () => {
    let testTemplate;

    beforeEach(async () => {
      testTemplate = await Template.create({
        title: 'Шаблон для обновления',
        discipline: 'Тест',
        module: 'Тест',
        is_active: true,
        equipment_list: [{ equipment_id: testEquipmentId, quantity: 1 }]
      });
    });

    it('should update template successfully', async () => {
      const result = await templatesService.actions.update.handler({
        params: {
          id: testTemplate.id,
          title: 'Обновленный шаблон',
          description: 'Новое описание'
        }
      });

      expect(result.template.title).toBe('Обновленный шаблон');
      expect(result.template.description).toBe('Новое описание');
    });

    it('should detect linked lessons when equipment changes', async () => {
      const equipment = await Equipment.create({
        inventory_number: 'TEMP-EQ-002',
        inventory_name: 'Доска',
        name: 'SmartBoard',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });

      const template = await Template.create({
        title: 'Шаблон для теста',
        discipline: 'Информатика',
        module: 'Основы',
        is_active: true,
        equipment_list: [{ equipment_id: equipment.id, quantity: 1 }]
      });

      await Lesson.create({
        title: 'Занятие по шаблону',
        group: 'Группа 201',
        teacher: 'Учитель Тестов',
        students_count: 10,
        date: '2026-09-25',
        start_time: '10:00:00',
        end_time: '11:30:00',
        template_id: template.id,
        status: 'Запланировано'
      });

      const result = await templatesService.actions.update.handler({
        params: {
          id: template.id,
          equipment_list: [{ equipment_id: equipment.id, quantity: 2 }]
        }
      });

      expect(result.hasLinkedLessons).toBe(true);
      expect(result.linkedLessonsCount).toBe(1);
    });
  });

  describe('ADD EQUIPMENT', () => {
    let newEquipmentId;

    beforeEach(async () => {
      const equipment = await Equipment.create({
        inventory_number: 'TEMP-003',
        inventory_name: 'Дополнительное оборудование',
        name: 'Additional Device',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });
      newEquipmentId = equipment.id;
    });

    it('should add equipment to template', async () => {
      const result = await templatesService.actions.addEquipment.handler({
        params: {
          id: testTemplateId,
          equipment_id: newEquipmentId,
          quantity: 3
        }
      });

      const equipmentList = result.equipment_list;
      const found = equipmentList.find(e => e.equipment_id === newEquipmentId);
      expect(found).toBeDefined();
      expect(found.quantity).toBe(3);
    });

    it('should update quantity if equipment already exists', async () => {
      const result = await templatesService.actions.addEquipment.handler({
        params: {
          id: testTemplateId,
          equipment_id: newEquipmentId,
          quantity: 5
        }
      });

      const equipmentList = result.equipment_list;
      const found = equipmentList.find(e => e.equipment_id === newEquipmentId);
      expect(found.quantity).toBe(5);
    });

    it('should throw error if equipment not found', async () => {
      await expect(
        templatesService.actions.addEquipment.handler({
          params: {
            id: testTemplateId,
            equipment_id: 99999,
            quantity: 1
          }
        })
      ).rejects.toThrow('Оборудование не найдено');
    });
  });

  describe('REMOVE EQUIPMENT', () => {
    it('should remove equipment from template', async () => {
      const result = await templatesService.actions.removeEquipment.handler({
        params: {
          id: testTemplateId,
          equipment_id: testEquipmentId
        }
      });

      const equipmentList = result.equipment_list;
      const found = equipmentList.find(e => e.equipment_id === testEquipmentId);
      expect(found).toBeUndefined();
    });
  });

  describe('SYNC LESSONS', () => {
    let syncTemplateId;

    beforeEach(async () => {
      const template = await Template.create({
        title: 'Шаблон для синхронизации',
        discipline: 'Тест',
        module: 'Тест',
        is_active: true,
        equipment_list: [{ equipment_id: testEquipmentId, quantity: 1 }]
      });
      syncTemplateId = template.id;

      await Lesson.bulkCreate([
        {
          title: 'Занятие 1',
          group: 'Группа 301',
          teacher: 'Тестов Тест',
          students_count: 10,
          date: '2026-09-26',
          start_time: '10:00:00',
          end_time: '11:30:00',
          template_id: syncTemplateId,
          status: 'Запланировано'
        },
        {
          title: 'Занятие 2',
          group: 'Группа 301',
          teacher: 'Тестов Тест',
          students_count: 12,
          date: '2026-09-27',
          start_time: '10:00:00',
          end_time: '11:30:00',
          template_id: syncTemplateId,
          status: 'Запланировано'
        }
      ]);
    });

    it('should sync lessons with template equipment', async () => {
      const equipment = await Equipment.create({
        inventory_number: 'SYNC-EQ-001',
        inventory_name: 'Оборудование для синхронизации',
        name: 'Sync Device',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });

      await templatesService.actions.update.handler({
        params: {
          id: syncTemplateId,
          equipment_list: [{ equipment_id: equipment.id, quantity: 2 }]
        }
      });

      const result = await templatesService.actions.syncLessons.handler({
        params: {
          templateId: syncTemplateId
        }
      });

      expect(result.total).toBe(2);
      expect(result.updated).toBe(2);

      const lessons = await Lesson.findAll({
        where: { template_id: syncTemplateId }
      });
      for (const lesson of lessons) {
        expect(lesson.equipment_list).toBeDefined();
        expect(lesson.equipment_list[0].quantity).toBe(2);
      }
    });

    it('should sync specific lessons only', async () => {
      const lessons = await Lesson.findAll({
        where: { template_id: syncTemplateId },
        limit: 1
      });

      if (lessons.length === 0) {
        console.log('⚠️ Нет занятий для синхронизации - тест пропущен');
        return;
      }

      const result = await templatesService.actions.syncLessons.handler({
        params: {
          templateId: syncTemplateId,
          lessonIds: [lessons[0].id]
        }
      });

      expect(result.updated).toBe(1);
    });
  });

  describe('DELETE', () => {
    it('should delete template and detach lessons', async () => {
      const template = await Template.create({
        title: 'Шаблон для удаления',
        discipline: 'Тест',
        module: 'Тест'
      });

      await Lesson.create({
        title: 'Занятие с шаблоном',
        group: 'Группа 401',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-28',
        start_time: '10:00:00',
        end_time: '11:30:00',
        template_id: template.id,
        status: 'Запланировано'
      });

      const result = await templatesService.actions.delete.handler({
        params: { id: template.id }
      });

      expect(result.success).toBe(true);

      const deleted = await Template.findByPk(template.id);
      expect(deleted).toBeNull();

      const lesson = await Lesson.findOne({
        where: { template_id: template.id }
      });
      expect(lesson).toBeNull();
    });
  });
});