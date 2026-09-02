// tests/lessons.test.js
const { Lesson, Template, Equipment, WorkTime } = require('../src/models');
const lessonsService = require('../src/services/lessons.service');

describe('Lessons Service Tests', () => {
  let testEquipmentId;
  let testTemplateId;

  beforeAll(async () => {
    const equipment = await Equipment.create({
      inventory_number: 'LESSON-EQ-001',
      inventory_name: 'Проектор',
      name: 'Epson EB-X41',
      year_of_release: 2024,
      purchase_basis: 'Тест',
      working_status: 'Исправен'
    });
    testEquipmentId = equipment.id;

    const template = await Template.create({
      title: 'Шаблон для тестов',
      discipline: 'Информатика',
      module: 'Основы',
      is_active: true,
      equipment_list: [{ equipment_id: testEquipmentId, quantity: 1 }]
    });
    testTemplateId = template.id;
  });

  describe('CREATE', () => {
    it('should create lesson successfully', async () => {
      const params = {
        title: 'Введение в программирование',
        group: 'Группа 101',
        teacher: 'Иванов И.И.',
        students_count: 15,
        date: '2026-09-15',
        start_time: '10:00:00',
        end_time: '11:30:00',
        template_id: testTemplateId,
        status: 'Запланировано',
        equipment_list: [{ equipment_id: testEquipmentId, quantity: 1 }]
      };

      const result = await lessonsService.actions.create.handler({ params });

      expect(result).toBeDefined();
      expect(result.title).toBe('Введение в программирование');
      expect(result.status).toBe('Запланировано');
    });

    it('should throw error if start_time >= end_time', async () => {
      const params = {
        title: 'Неправильное время',
        group: 'Группа 101',
        teacher: 'Петров П.П.',
        students_count: 10,
        date: '2026-09-15',
        start_time: '11:30:00',
        end_time: '10:00:00',
        equipment_list: []
      };

      await expect(
        lessonsService.actions.create.handler({ params })
      ).rejects.toThrow('Время начала не может быть позже');
    });

    it('should throw error if template not found', async () => {
      const params = {
        title: 'Тест с шаблоном',
        group: 'Группа 101',
        teacher: 'Сидоров С.С.',
        students_count: 10,
        date: '2026-09-16',
        start_time: '10:00:00',
        end_time: '11:00:00',
        template_id: 99999,
        equipment_list: []
      };

      await expect(
        lessonsService.actions.create.handler({ params })
      ).rejects.toThrow('Шаблон не найден');
    });

    it('should throw error if template is inactive', async () => {
      const inactiveTemplate = await Template.create({
        title: 'Неактивный шаблон',
        discipline: 'Тест',
        module: 'Тест',
        is_active: false
      });

      const params = {
        title: 'Тест с неактивным шаблоном',
        group: 'Группа 101',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-17',
        start_time: '10:00:00',
        end_time: '11:00:00',
        template_id: inactiveTemplate.id,
        equipment_list: []
      };

      await expect(
        lessonsService.actions.create.handler({ params })
      ).rejects.toThrow('Шаблон неактивен');
    });

    it('should throw error if equipment is not working', async () => {
      const brokenEquipment = await Equipment.create({
        inventory_number: 'LESSON-BROKEN',
        inventory_name: 'Сломанное',
        name: 'Broken',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'В ремонте'
      });

      const params = {
        title: 'Тест с неисправным оборудованием',
        group: 'Группа 101',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-18',
        start_time: '10:00:00',
        end_time: '11:00:00',
        equipment_list: [{ equipment_id: brokenEquipment.id, quantity: 1 }]
      };

      await expect(
        lessonsService.actions.create.handler({ params })
      ).rejects.toThrow('Оборудование не может быть использовано');
    });

    it('should create WorkTime when status is "Проведено"', async () => {
      // Создаем оборудование для этого теста
      const equipment = await Equipment.create({
        inventory_number: 'LESSON-WT-001',
        inventory_name: 'Проектор для WorkTime',
        name: 'Epson EB-X41',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });

      const params = {
        title: 'Проведенное занятие',
        group: 'Группа 101',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-20',
        start_time: '10:00:00',
        end_time: '12:00:00',
        status: 'Проведено',
        equipment_list: [{ equipment_id: equipment.id, quantity: 1 }]
      };

      const result = await lessonsService.actions.create.handler({ params });

      expect(result.status).toBe('Проведено');
      
      const workTimes = await WorkTime.findAll({
        where: { lesson_id: result.id }
      });
      expect(workTimes.length).toBe(1);
      expect(parseFloat(workTimes[0].total_hours)).toBe(2);
    });
  });

  describe('LIST', () => {
    beforeEach(async () => {
      await Lesson.bulkCreate([
        {
          title: 'Занятие 1',
          group: 'Группа A',
          teacher: 'Учитель 1',
          students_count: 10,
          date: '2026-09-10',
          start_time: '10:00:00',
          end_time: '11:00:00',
          status: 'Запланировано'
        },
        {
          title: 'Занятие 2',
          group: 'Группа B',
          teacher: 'Учитель 2',
          students_count: 15,
          date: '2026-09-11',
          start_time: '11:00:00',
          end_time: '12:00:00',
          status: 'Проведено'
        },
        {
          title: 'Занятие 3',
          group: 'Группа A',
          teacher: 'Учитель 1',
          students_count: 12,
          date: '2026-09-12',
          start_time: '10:00:00',
          end_time: '11:00:00',
          status: 'Запланировано'
        }
      ]);
    });

    it('should list all lessons', async () => {
      const result = await lessonsService.actions.list.handler({ params: {} });
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by status', async () => {
      const result = await lessonsService.actions.list.handler({
        params: { status: 'Проведено' }
      });
      expect(result.every(l => l.status === 'Проведено')).toBe(true);
    });

    it('should filter by group', async () => {
      const result = await lessonsService.actions.list.handler({
        params: { group: 'Группа A' }
      });
      expect(result.every(l => l.group === 'Группа A')).toBe(true);
    });

    it('should filter by teacher', async () => {
      const result = await lessonsService.actions.list.handler({
        params: { teacher: 'Учитель 1' }
      });
      expect(result.every(l => l.teacher === 'Учитель 1')).toBe(true);
    });
  });

  describe('GET', () => {
    let testLesson;

    beforeEach(async () => {
      testLesson = await Lesson.create({
        title: 'Тестовое занятие',
        group: 'Группа 101',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-15',
        start_time: '10:00:00',
        end_time: '11:30:00',
        status: 'Запланировано'
      });
    });

    it('should get lesson by id', async () => {
      const result = await lessonsService.actions.get.handler({
        params: { id: testLesson.id }
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(testLesson.id);
      expect(result.title).toBe('Тестовое занятие');
    });

    it('should throw error if lesson not found', async () => {
      await expect(
        lessonsService.actions.get.handler({
          params: { id: 99999 }
        })
      ).rejects.toThrow('Занятие не найдено');
    });
  });

  describe('UPDATE', () => {
    let testLesson;

    beforeEach(async () => {
      testLesson = await Lesson.create({
        title: 'Занятие для обновления',
        group: 'Группа 101',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-15',
        start_time: '10:00:00',
        end_time: '11:30:00',
        status: 'Запланировано',
        equipment_list: [{ equipment_id: testEquipmentId, quantity: 1 }]
      });
    });

    it('should update lesson successfully', async () => {
      const result = await lessonsService.actions.update.handler({
        params: {
          id: testLesson.id,
          title: 'Обновленное занятие',
          students_count: 20
        }
      });

      expect(result.title).toBe('Обновленное занятие');
      expect(result.students_count).toBe(20);
    });

    it('should create WorkTime when status changes to "Проведено"', async () => {
      // Создаем оборудование для этого теста
      const equipment = await Equipment.create({
        inventory_number: 'LESSON-UPDATE-001',
        inventory_name: 'Проектор для UPDATE',
        name: 'Epson EB-X41',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });

      const lesson = await Lesson.create({
        title: 'Занятие для обновления статуса',
        group: 'Группа 101',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-15',
        start_time: '10:00:00',
        end_time: '11:30:00',
        status: 'Запланировано',
        equipment_list: [{ equipment_id: equipment.id, quantity: 1 }]
      });

      const result = await lessonsService.actions.update.handler({
        params: {
          id: lesson.id,
          status: 'Проведено'
        }
      });

      expect(result.status).toBe('Проведено');
      
      const workTimes = await WorkTime.findAll({
        where: { lesson_id: lesson.id }
      });
      expect(workTimes.length).toBeGreaterThan(0);
    });

    it('should delete WorkTime when status changes to "Запланировано" from "Проведено"', async () => {
      // Создаем оборудование
      const equipment = await Equipment.create({
        inventory_number: 'LESSON-DELETE-001',
        inventory_name: 'Проектор для DELETE',
        name: 'Epson EB-X41',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });

      const lesson = await Lesson.create({
        title: 'Занятие для удаления WorkTime',
        group: 'Группа 101',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-15',
        start_time: '10:00:00',
        end_time: '11:30:00',
        status: 'Запланировано',
        equipment_list: [{ equipment_id: equipment.id, quantity: 1 }]
      });

      // Сначала проводим занятие
      await lessonsService.actions.update.handler({
        params: {
          id: lesson.id,
          status: 'Проведено'
        }
      });

      // Затем меняем обратно
      const result = await lessonsService.actions.update.handler({
        params: {
          id: lesson.id,
          status: 'Запланировано'
        }
      });

      expect(result.status).toBe('Запланировано');
      
      const workTimes = await WorkTime.findAll({
        where: { lesson_id: lesson.id }
      });
      expect(workTimes.length).toBe(0);
    });

    it('should delete WorkTime when status changes to "Отменено"', async () => {
      // Создаем оборудование
      const equipment = await Equipment.create({
        inventory_number: 'LESSON-CANCEL-001',
        inventory_name: 'Проектор для CANCEL',
        name: 'Epson EB-X41',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });

      const lesson = await Lesson.create({
        title: 'Занятие для отмены',
        group: 'Группа 101',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-15',
        start_time: '10:00:00',
        end_time: '11:30:00',
        status: 'Запланировано',
        equipment_list: [{ equipment_id: equipment.id, quantity: 1 }]
      });

      // Сначала проводим занятие
      await lessonsService.actions.update.handler({
        params: {
          id: lesson.id,
          status: 'Проведено'
        }
      });

      // Затем отменяем
      const result = await lessonsService.actions.update.handler({
        params: {
          id: lesson.id,
          status: 'Отменено'
        }
      });

      expect(result.status).toBe('Отменено');
      
      const workTimes = await WorkTime.findAll({
        where: { lesson_id: lesson.id }
      });
      expect(workTimes.length).toBe(0);
    });
  });

  describe('COMPLETE', () => {
    it('should complete lesson and create WorkTime', async () => {
      // Создаем оборудование
      const equipment = await Equipment.create({
        inventory_number: 'LESSON-COMPLETE-001',
        inventory_name: 'Проектор для COMPLETE',
        name: 'Epson EB-X41',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });

      const lesson = await Lesson.create({
        title: 'Занятие для завершения',
        group: 'Группа 102',
        teacher: 'Тестов Тест',
        students_count: 12,
        date: '2026-09-20',
        start_time: '10:00:00',
        end_time: '11:30:00',
        status: 'Запланировано',
        equipment_list: [{ equipment_id: equipment.id, quantity: 2 }]
      });

      const result = await lessonsService.actions.complete.handler({
        params: { id: lesson.id }
      });

      expect(result.status).toBe('Проведено');
      
      const workTimes = await WorkTime.findAll({
        where: { lesson_id: lesson.id }
      });
      expect(workTimes.length).toBe(1);
    });

    it('should throw error if lesson already completed', async () => {
      const lesson = await Lesson.create({
        title: 'Уже проведенное',
        group: 'Группа 103',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-21',
        start_time: '10:00:00',
        end_time: '11:30:00',
        status: 'Проведено'
      });

      await expect(
        lessonsService.actions.complete.handler({
          params: { id: lesson.id }
        })
      ).rejects.toThrow('Занятие уже проведено');
    });
  });

  describe('DELETE', () => {
    it('should delete planned lesson', async () => {
      const lesson = await Lesson.create({
        title: 'Занятие для удаления',
        group: 'Группа 104',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-22',
        start_time: '10:00:00',
        end_time: '11:30:00',
        status: 'Запланировано'
      });

      const result = await lessonsService.actions.delete.handler({
        params: { id: lesson.id }
      });

      expect(result.success).toBe(true);

      const deleted = await Lesson.findByPk(lesson.id);
      expect(deleted).toBeNull();
    });

    it('should prevent deletion of completed lesson', async () => {
      const lesson = await Lesson.create({
        title: 'Проведенное занятие',
        group: 'Группа 105',
        teacher: 'Тестов Тест',
        students_count: 10,
        date: '2026-09-23',
        start_time: '10:00:00',
        end_time: '11:30:00',
        status: 'Проведено'
      });

      await expect(
        lessonsService.actions.delete.handler({
          params: { id: lesson.id }
        })
      ).rejects.toThrow('Нельзя удалить проведенное занятие');
    });
  });
});