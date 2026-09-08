// tests/worktime.test.js - ИСПРАВЛЕННЫЙ
const { WorkTime, Equipment, Lesson } = require('../src/models');
const worktimeService = require('../src/services/worktime.service');

describe('WorkTime Service Tests', () => {
  let testEquipmentId;
  let testLessonId;

  beforeAll(async () => {
    const equipment = await Equipment.create({
      inventory_number: 'WT-001',
      inventory_name: '3D принтер',
      name: 'Prusa MK3S',
      year_of_release: 2024,
      purchase_basis: 'Тест',
      working_status: 'Исправен'
    });
    testEquipmentId = equipment.id;

    const lesson = await Lesson.create({
      title: 'Занятие по 3D печати',
      group: 'Группа 401',
      teacher: 'Тестов Тест',
      students_count: 8,
      date: '2026-09-28',
      start_time: '10:00:00',
      end_time: '12:00:00',
      status: 'Проведено'
    });
    testLessonId = lesson.id;
  });

  describe('CREATE', () => {
    it('should create work time entry', async () => {
      const params = {
        equipment_id: testEquipmentId,
        lesson_id: testLessonId,
        start_time: '2026-09-28T10:00:00',
        end_time: '2026-09-28T12:00:00',
        students_count: 8
      };

      const result = await worktimeService.actions.create.handler({ params });

      expect(result).toBeDefined();
      expect(result.equipment_id).toBe(testEquipmentId);
      expect(parseFloat(result.total_hours)).toBe(2);
    });

    it('should calculate total_hours correctly', async () => {
      const equipment = await Equipment.create({
        inventory_number: 'WT-CALC-001',
        inventory_name: 'Калькулятор',
        name: 'Calc Device',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });

      const params = {
        equipment_id: equipment.id,
        start_time: '2026-09-28T14:00:00',
        end_time: '2026-09-28T16:30:00',
        students_count: 5
      };

      const result = await worktimeService.actions.create.handler({ params });

      expect(parseFloat(result.total_hours)).toBe(2.5);
    });

    it('should throw error if start >= end', async () => {
      const params = {
        equipment_id: testEquipmentId,
        start_time: '2026-09-28T12:00:00',
        end_time: '2026-09-28T10:00:00',
        students_count: 5
      };

      await expect(
        worktimeService.actions.create.handler({ params })
      ).rejects.toThrow('Время начала не может быть позже');
    });

    it('should throw error if equipment is in repair', async () => {
      const brokenEquipment = await Equipment.create({
        inventory_number: 'WT-BROKEN',
        inventory_name: 'Сломанный принтер',
        name: 'Broken Printer',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'В ремонте'
      });

      const params = {
        equipment_id: brokenEquipment.id,
        start_time: '2026-09-28T10:00:00',
        end_time: '2026-09-28T12:00:00',
        students_count: 5
      };

      await expect(
        worktimeService.actions.create.handler({ params })
      ).rejects.toThrow('в статусе');
    });
  });

  // ============================================
  // LIST (ИСПРАВЛЕН)
  // ============================================
  describe('LIST', () => {
    let localEquipmentId;
    let lesson1;
    let lesson2;

    beforeEach(async () => {
      // Создаем оборудование
      const equipment = await Equipment.create({
        inventory_number: 'WT-LIST-001',
        inventory_name: 'Оборудование для LIST',
        name: 'List Device',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });
      localEquipmentId = equipment.id;

      // СОЗДАЕМ УРОКИ ПЕРЕД ИСПОЛЬЗОВАНИЕМ
      lesson1 = await Lesson.create({
        title: 'Занятие 1 для LIST',
        group: 'Группа 401',
        teacher: 'Тестов Тест',
        students_count: 8,
        date: '2026-09-28',
        start_time: '10:00:00',
        end_time: '12:00:00',
        status: 'Проведено'
      });

      lesson2 = await Lesson.create({
        title: 'Занятие 2 для LIST',
        group: 'Группа 402',
        teacher: 'Тестов Тест',
        students_count: 6,
        date: '2026-09-29',
        start_time: '10:00:00',
        end_time: '12:00:00',
        status: 'Проведено'
      });

      // Первая запись
      await worktimeService.actions.create.handler({
        params: {
          equipment_id: localEquipmentId,
          lesson_id: lesson1.id,
          start_time: '2026-09-28T10:00:00',
          end_time: '2026-09-28T12:00:00',
          students_count: 8
        }
      });

      // Вторая запись
      await worktimeService.actions.create.handler({
        params: {
          equipment_id: localEquipmentId,
          lesson_id: lesson2.id,
          start_time: '2026-09-29T10:00:00',
          end_time: '2026-09-29T12:00:00',
          students_count: 6
        }
      });
    });

    it('should list all work time entries', async () => {
      const result = await worktimeService.actions.list.handler({ params: {} });
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // GET BY EQUIPMENT (ИСПРАВЛЕН)
  // ============================================
  describe('GET BY EQUIPMENT', () => {
    let localEquipmentId;
    let lesson;

    beforeEach(async () => {
      const equipment = await Equipment.create({
        inventory_number: 'WT-GET-001',
        inventory_name: 'Оборудование для GET',
        name: 'Get Device',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });
      localEquipmentId = equipment.id;

      // СОЗДАЕМ УРОК
      lesson = await Lesson.create({
        title: 'Занятие для GET',
        group: 'Группа 403',
        teacher: 'Тестов Тест',
        students_count: 8,
        date: '2026-09-28',
        start_time: '10:00:00',
        end_time: '12:00:00',
        status: 'Проведено'
      });

      await worktimeService.actions.create.handler({
        params: {
          equipment_id: localEquipmentId,
          lesson_id: lesson.id,
          start_time: '2026-09-28T10:00:00',
          end_time: '2026-09-28T12:00:00',
          students_count: 8
        }
      });
    });

    it('should get work time by equipment', async () => {
      const result = await worktimeService.actions.getByEquipment.handler({
        params: { equipmentId: localEquipmentId }
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(r => r.equipment_id === localEquipmentId)).toBe(true);
    });
  });

  // ============================================
  // REPORT (ИСПРАВЛЕН)
  // ============================================
  describe('REPORT', () => {
    let localEquipmentId;
    let lesson;

    beforeEach(async () => {
      const equipment = await Equipment.create({
        inventory_number: 'WT-REPORT-001',
        inventory_name: 'Оборудование для REPORT',
        name: 'Report Device',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });
      localEquipmentId = equipment.id;

      // СОЗДАЕМ УРОК
      lesson = await Lesson.create({
        title: 'Занятие для REPORT',
        group: 'Группа 404',
        teacher: 'Тестов Тест',
        students_count: 8,
        date: '2026-09-28',
        start_time: '10:00:00',
        end_time: '12:00:00',
        status: 'Проведено'
      });

      await worktimeService.actions.create.handler({
        params: {
          equipment_id: localEquipmentId,
          lesson_id: lesson.id,
          start_time: '2026-09-28T10:00:00',
          end_time: '2026-09-28T12:00:00',
          students_count: 8
        }
      });
    });

    it('should generate report for date range', async () => {
      const result = await worktimeService.actions.report.handler({
        params: {
          start: '2026-09-28',
          end: '2026-09-28'
        }
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter report by equipment', async () => {
      const result = await worktimeService.actions.report.handler({
        params: {
          start: '2026-09-28',
          end: '2026-09-29',
          equipmentId: localEquipmentId
        }
      });

      expect(result.every(r => r.equipment_id === localEquipmentId)).toBe(true);
    });

    it('should throw error if start > end', async () => {
      await expect(
        worktimeService.actions.report.handler({
          params: {
            start: '2026-09-29',
            end: '2026-09-28'
          }
        })
      ).rejects.toThrow('Дата начала не может быть позже');
    });
  });

  // ============================================
  // SUMMARY (ИСПРАВЛЕН)
  // ============================================
  describe('SUMMARY', () => {
    let localEquipmentId;
    let lesson1;
    let lesson2;

    beforeEach(async () => {
      const equipment = await Equipment.create({
        inventory_number: 'WT-SUMMARY-001',
        inventory_name: 'Оборудование для SUMMARY',
        name: 'Summary Device',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });
      localEquipmentId = equipment.id;

      // СОЗДАЕМ УРОКИ
      lesson1 = await Lesson.create({
        title: 'Занятие 1 для SUMMARY',
        group: 'Группа 405',
        teacher: 'Тестов Тест',
        students_count: 8,
        date: '2026-09-28',
        start_time: '10:00:00',
        end_time: '12:00:00',
        status: 'Проведено'
      });

      lesson2 = await Lesson.create({
        title: 'Занятие 2 для SUMMARY',
        group: 'Группа 406',
        teacher: 'Тестов Тест',
        students_count: 6,
        date: '2026-09-28',
        start_time: '14:00:00',
        end_time: '16:00:00',
        status: 'Проведено'
      });

      await worktimeService.actions.create.handler({
        params: {
          equipment_id: localEquipmentId,
          lesson_id: lesson1.id,
          start_time: '2026-09-28T10:00:00',
          end_time: '2026-09-28T12:00:00',
          students_count: 8
        }
      });

      await worktimeService.actions.create.handler({
        params: {
          equipment_id: localEquipmentId,
          lesson_id: lesson2.id,
          start_time: '2026-09-28T14:00:00',
          end_time: '2026-09-28T16:00:00',
          students_count: 6
        }
      });
    });

    it('should generate summary for equipment', async () => {
      const result = await worktimeService.actions.summary.handler({
        params: {
          equipmentId: localEquipmentId,
          start: '2026-09-28',
          end: '2026-09-28'
        }
      });

      expect(result).toBeDefined();
      expect(result.equipment_id).toBe(localEquipmentId);
      expect(result.total_hours).toBe('4.00');
      expect(result.total_students).toBe(14);
      expect(result.sessions_count).toBe(2);
    });
  });
});