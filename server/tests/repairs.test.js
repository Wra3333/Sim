// tests/repairs.test.js - ИСПРАВЛЕННЫЙ
const { Repair, Equipment } = require('../src/models');
const repairsService = require('../src/services/repairs.service');

describe('Repairs Service Tests', () => {
  let testEquipmentId;
  let testEquipmentId2;
  let testRepairId;

  beforeEach(async () => {
    // Очищаем данные перед каждым тестом
    await Repair.destroy({ where: {}, truncate: true, cascade: true });
    await Equipment.destroy({ where: {}, truncate: true, cascade: true });

    const eq1 = await Equipment.create({
      inventory_number: 'REP-TEST-001',
      inventory_name: 'Тестовое оборудование 1',
      name: 'Test 1',
      year_of_release: 2024,
      purchase_basis: 'Тест',
      working_status: 'Исправен',
      write_off_status: 'На балансе'
    });
    testEquipmentId = eq1.id;

    const eq2 = await Equipment.create({
      inventory_number: 'REP-TEST-002',
      inventory_name: 'Тестовое оборудование 2',
      name: 'Test 2',
      year_of_release: 2024,
      purchase_basis: 'Тест',
      working_status: 'Исправен',
      write_off_status: 'На балансе'
    });
    testEquipmentId2 = eq2.id;
  });

  describe('CREATE', () => {
    it('should create repair request', async () => {
      const params = {
        equipment_ids: [testEquipmentId],
        detection_date: '2026-09-01T10:00:00',
        nature_of_malfunction: 'Не включается',
        detected_by: 'Техник Иванов',
        repair_possibility: 'Самостоятельно'
      };

      const result = await repairsService.actions.create.handler({ params });

      expect(result.success).toBe(true);
      expect(result.repairs.length).toBe(1);
      expect(result.repairs[0].equipment_id).toBe(testEquipmentId);

      const equipment = await Equipment.findByPk(testEquipmentId);
      expect(equipment.working_status).toBe('В ремонте');
    });

    it('should create multiple repair requests', async () => {
      const params = {
        equipment_ids: [testEquipmentId, testEquipmentId2],
        detection_date: '2026-09-02T10:00:00',
        nature_of_malfunction: 'Тест множественных заявок',
        detected_by: 'Техник Петров'
      };

      const result = await repairsService.actions.create.handler({ params });

      expect(result.success).toBe(true);
      expect(result.repairs.length).toBe(2);
    });

    it('should throw error if equipment does not exist', async () => {
      const params = {
        equipment_ids: [99999],
        detection_date: '2026-09-01T10:00:00',
        nature_of_malfunction: 'Тест',
        detected_by: 'Тестер'
      };

      await expect(
        repairsService.actions.create.handler({ params })
      ).rejects.toThrow('Оборудование не найдено');
    });

    it('should throw error if equipment is written off', async () => {
      const writtenOff = await Equipment.create({
        inventory_number: 'REP-WRITTEN',
        inventory_name: 'Списанное',
        name: 'Written Off',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Требует ремонта',
        write_off_status: 'Списан'
      });

      const params = {
        equipment_ids: [writtenOff.id],
        detection_date: '2026-09-01T10:00:00',
        nature_of_malfunction: 'Тест',
        detected_by: 'Тестер'
      };

      await expect(
        repairsService.actions.create.handler({ params })
      ).rejects.toThrow('Оборудование списано');
    });
  });

  describe('LIST', () => {
    beforeEach(async () => {
      // Создаем заявки через сервис, чтобы прошла валидация
      await repairsService.actions.create.handler({
        params: {
          equipment_ids: [testEquipmentId],
          detection_date: new Date().toISOString().slice(0, 16),
          nature_of_malfunction: 'Заявка 1',
          detected_by: 'Тестер'
        }
      });
      await repairsService.actions.create.handler({
        params: {
          equipment_ids: [testEquipmentId2],
          detection_date: new Date().toISOString().slice(0, 16),
          nature_of_malfunction: 'Заявка 2',
          detected_by: 'Тестер'
        }
      });
    });

    it('should list all repairs', async () => {
      const result = await repairsService.actions.list.handler({ params: {} });
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by equipment_id', async () => {
      const result = await repairsService.actions.list.handler({
        params: { equipment_id: testEquipmentId }
      });
      expect(result.every(r => r.equipment_id === testEquipmentId)).toBe(true);
    });

    it('should filter by is_resolved', async () => {
      const result = await repairsService.actions.list.handler({
        params: { is_resolved: false }
      });
      expect(result.every(r => r.is_resolved === false)).toBe(true);
    });
  });

  describe('GET BY EQUIPMENT', () => {
    it('should get repairs by equipment id', async () => {
      // Создаем заявку
      await repairsService.actions.create.handler({
        params: {
          equipment_ids: [testEquipmentId],
          detection_date: new Date().toISOString().slice(0, 16),
          nature_of_malfunction: 'Заявка для GET',
          detected_by: 'Тестер'
        }
      });

      const result = await repairsService.actions.getByEquipment.handler({
        params: { equipmentId: testEquipmentId }
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(r => r.equipment_id === testEquipmentId)).toBe(true);
    });

    it('should throw error if equipment not found', async () => {
      await expect(
        repairsService.actions.getByEquipment.handler({
          params: { equipmentId: 99999 }
        })
      ).rejects.toThrow('Оборудование не найдено');
    });
  });

  describe('UPDATE', () => {
    let repairToUpdate;

    beforeEach(async () => {
      const result = await repairsService.actions.create.handler({
        params: {
          equipment_ids: [testEquipmentId],
          detection_date: '2026-09-03T10:00:00',
          nature_of_malfunction: 'Для обновления',
          detected_by: 'Техник Тестов'
        }
      });
      repairToUpdate = result.repairs[0];
    });

    it('should update repair request', async () => {
      const result = await repairsService.actions.update.handler({
        params: {
          id: repairToUpdate.id,
          nature_of_malfunction: 'Обновленное описание неисправности'
        }
      });

      expect(result.nature_of_malfunction).toBe('Обновленное описание неисправности');
    });

    it('should prevent updating closed repair', async () => {
      await repairsService.actions.resolve.handler({
        params: {
          id: repairToUpdate.id,
          resolved_by: 'Техник Иванов',
          resolution_status: 'resolved'
        }
      });

      await expect(
        repairsService.actions.update.handler({
          params: {
            id: repairToUpdate.id,
            nature_of_malfunction: 'Попытка обновить закрытую'
          }
        })
      ).rejects.toThrow('Нельзя редактировать закрытую заявку');
    });
  });

  describe('RESOLVE', () => {
    let repairToResolve;

    beforeEach(async () => {
      const result = await repairsService.actions.create.handler({
        params: {
          equipment_ids: [testEquipmentId],
          detection_date: '2026-09-04T10:00:00',
          nature_of_malfunction: 'Заявка для закрытия',
          detected_by: 'Техник Сидоров'
        }
      });
      repairToResolve = result.repairs[0];
    });

    it('should resolve repair as "resolved"', async () => {
      const result = await repairsService.actions.resolve.handler({
        params: {
          id: repairToResolve.id,
          resolved_by: 'Техник Сидоров',
          resolution_status: 'resolved'
        }
      });

      expect(result.is_resolved).toBe(true);
      expect(result.resolution_status).toBe('resolved');

      const equipment = await Equipment.findByPk(testEquipmentId);
      expect(equipment.working_status).toBe('Исправен');
    });

    it('should resolve repair as "needs_repair"', async () => {
      const result = await repairsService.actions.resolve.handler({
        params: {
          id: repairToResolve.id,
          resolved_by: 'Техник Сидоров',
          resolution_status: 'needs_repair',
          repair_notes: 'Требуется замена детали'
        }
      });

      expect(result.resolution_status).toBe('needs_repair');
      
      const equipment = await Equipment.findByPk(testEquipmentId);
      expect(equipment.working_status).toBe('Требует ремонта');
    });

    it('should resolve repair as "impossible" and write off equipment', async () => {
      const result = await repairsService.actions.resolve.handler({
        params: {
          id: repairToResolve.id,
          resolved_by: 'Техник Сидоров',
          resolution_status: 'impossible',
          write_off_reason: 'Экономически нецелесообразно'
        }
      });

      expect(result.resolution_status).toBe('impossible');
      expect(result.write_off_reason).toBe('Экономически нецелесообразно');

      const equipment = await Equipment.findByPk(testEquipmentId);
      expect(equipment.working_status).toBe('Требует ремонта');
      expect(equipment.write_off_status).toBe('Списан');
    });

    it('should throw error if repair already resolved', async () => {
      await repairsService.actions.resolve.handler({
        params: {
          id: repairToResolve.id,
          resolved_by: 'Техник Сидоров',
          resolution_status: 'resolved'
        }
      });

      await expect(
        repairsService.actions.resolve.handler({
          params: {
            id: repairToResolve.id,
            resolved_by: 'Техник Сидоров',
            resolution_status: 'resolved'
          }
        })
      ).rejects.toThrow('Заявка уже закрыта');
    });
  });

  describe('DELETE', () => {
    it('should delete active repair and restore equipment status', async () => {
      const result = await repairsService.actions.create.handler({
        params: {
          equipment_ids: [testEquipmentId],
          detection_date: '2026-09-05T10:00:00',
          nature_of_malfunction: 'Для удаления',
          detected_by: 'Техник Тестов'
        }
      });
      const repair = result.repairs[0];

      const deleteResult = await repairsService.actions.delete.handler({
        params: { id: repair.id }
      });

      expect(deleteResult.success).toBe(true);

      const equipment = await Equipment.findByPk(testEquipmentId);
      expect(equipment.working_status).toBe('Исправен');
    });

    it('should prevent deleting resolved repair', async () => {
      const result = await repairsService.actions.create.handler({
        params: {
          equipment_ids: [testEquipmentId],
          detection_date: '2026-09-06T10:00:00',
          nature_of_malfunction: 'Закрытая заявка',
          detected_by: 'Техник Тестов'
        }
      });
      const repair = result.repairs[0];

      await repairsService.actions.resolve.handler({
        params: {
          id: repair.id,
          resolved_by: 'Техник Тестов',
          resolution_status: 'resolved'
        }
      });

      await expect(
        repairsService.actions.delete.handler({
          params: { id: repair.id }
        })
      ).rejects.toThrow('Нельзя удалить закрытую заявку');
    });
  });
});