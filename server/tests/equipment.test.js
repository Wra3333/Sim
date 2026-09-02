// tests/equipment.test.js
const { Equipment, Repair } = require('../src/models');
const equipmentService = require('../src/services/equipment.service');

describe('Equipment Service Tests', () => {
  
  describe('CREATE', () => {
    it('should create equipment successfully', async () => {
      const params = {
        inventory_number: 'TEST-EQ-001',
        inventory_name: 'Тестовое оборудование',
        name: 'Test Device 1',
        year_of_release: 2024,
        description: 'Тестовое описание',
        purchase_basis: 'Тестовая закупка',
        working_status: 'Исправен',
        write_off_status: 'На балансе'
      };

      const result = await equipmentService.actions.create.handler({ params });

      expect(result).toBeDefined();
      expect(result.inventory_number).toBe('TEST-EQ-001');
      expect(result.working_status).toBe('Исправен');
      expect(result.id).toBeDefined();
    });

    it('should throw error if inventory_number already exists', async () => {
      await equipmentService.actions.create.handler({
        params: {
          inventory_number: 'TEST-EQ-002',
          inventory_name: 'Первое',
          name: 'First',
          year_of_release: 2024,
          purchase_basis: 'Тест'
        }
      });

      await expect(
        equipmentService.actions.create.handler({
          params: {
            inventory_number: 'TEST-EQ-002',
            inventory_name: 'Второе',
            name: 'Second',
            year_of_release: 2024,
            purchase_basis: 'Тест'
          }
        })
      ).rejects.toThrow('уже существует');
    });

    it('should validate photo format', async () => {
      const result = await equipmentService.actions.create.handler({
        params: {
          inventory_number: 'TEST-EQ-003',
          inventory_name: 'С фото',
          name: 'With Photo',
          year_of_release: 2024,
          purchase_basis: 'Тест',
          photo: 'image.jpg'
        }
      });

      expect(result.photo).toBe('image.jpg');
    });

    it('should reject invalid photo format', async () => {
      await expect(
        equipmentService.actions.create.handler({
          params: {
            inventory_number: 'TEST-EQ-004',
            inventory_name: 'Плохое фото',
            name: 'Bad Photo',
            year_of_release: 2024,
            purchase_basis: 'Тест',
            photo: 'image.exe'
          }
        })
      ).rejects.toThrow('Неподдерживаемый формат фото');
    });

    it('should set default statuses', async () => {
      const result = await equipmentService.actions.create.handler({
        params: {
          inventory_number: 'TEST-EQ-005',
          inventory_name: 'С значениями по умолчанию',
          name: 'Default',
          year_of_release: 2024,
          purchase_basis: 'Тест'
        }
      });

      expect(result.working_status).toBe('Исправен');
      expect(result.write_off_status).toBe('На балансе');
    });
  });

  describe('LIST', () => {
    beforeEach(async () => {
      await Equipment.bulkCreate([
        {
          inventory_number: 'LIST-001',
          inventory_name: 'Список 1',
          name: 'List 1',
          year_of_release: 2024,
          purchase_basis: 'Тест',
          working_status: 'Исправен'
        },
        {
          inventory_number: 'LIST-002',
          inventory_name: 'Список 2',
          name: 'List 2',
          year_of_release: 2024,
          purchase_basis: 'Тест',
          working_status: 'В ремонте'
        },
        {
          inventory_number: 'LIST-003',
          inventory_name: 'Список 3',
          name: 'List 3',
          year_of_release: 2024,
          purchase_basis: 'Тест',
          working_status: 'Требует ремонта'
        }
      ]);
    });

    it('should list all equipment', async () => {
      const result = await equipmentService.actions.list.handler({ params: {} });
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by working_status', async () => {
      const result = await equipmentService.actions.list.handler({
        params: { working_status: 'Исправен' }
      });
      expect(result.every(e => e.working_status === 'Исправен')).toBe(true);
    });

    it('should filter by write_off_status', async () => {
      const result = await equipmentService.actions.list.handler({
        params: { write_off_status: 'На балансе' }
      });
      expect(result.every(e => e.write_off_status === 'На балансе')).toBe(true);
    });

    it('should search by inventory_number', async () => {
      const result = await equipmentService.actions.list.handler({
        params: { search: 'LIST-001' }
      });
      expect(result.length).toBe(1);
      expect(result[0].inventory_number).toBe('LIST-001');
    });

    it('should search by name', async () => {
      const result = await equipmentService.actions.list.handler({
        params: { search: 'List 2' }
      });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('List 2');
    });
  });

  describe('GET', () => {
    let testEquipment;

    beforeEach(async () => {
      testEquipment = await Equipment.create({
        inventory_number: 'GET-001',
        inventory_name: 'Для получения',
        name: 'Get Me',
        year_of_release: 2024,
        purchase_basis: 'Тест'
      });
    });

    it('should get equipment by id', async () => {
      const result = await equipmentService.actions.get.handler({
        params: { id: testEquipment.id }
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(testEquipment.id);
      expect(result.inventory_number).toBe('GET-001');
    });

    it('should throw error if equipment not found', async () => {
      await expect(
        equipmentService.actions.get.handler({
          params: { id: 99999 }
        })
      ).rejects.toThrow('Оборудование не найдено');
    });
  });

  describe('UPDATE', () => {
    let testEquipment;

    beforeEach(async () => {
      testEquipment = await Equipment.create({
        inventory_number: 'UPDATE-001',
        inventory_name: 'Для обновления',
        name: 'Update Me',
        year_of_release: 2024,
        purchase_basis: 'Тест',
        working_status: 'Исправен'
      });
    });

    it('should update equipment successfully', async () => {
      const result = await equipmentService.actions.update.handler({
        params: {
          id: testEquipment.id,
          name: 'Обновленное название',
          description: 'Новое описание'
        }
      });

      expect(result.name).toBe('Обновленное название');
      expect(result.description).toBe('Новое описание');
    });

    it('should update working_status', async () => {
      const result = await equipmentService.actions.update.handler({
        params: {
          id: testEquipment.id,
          working_status: 'В ремонте'
        }
      });

      expect(result.working_status).toBe('В ремонте');
    });

    it('should prevent update to "Исправен" if has active repairs', async () => {
      await Repair.create({
        equipment_id: testEquipment.id,
        detection_date: new Date(),
        nature_of_malfunction: 'Тест поломки',
        detected_by: 'Тестер',
        is_resolved: false
      });

      await expect(
        equipmentService.actions.update.handler({
          params: {
            id: testEquipment.id,
            working_status: 'Исправен'
          }
        })
      ).rejects.toThrow('активных заявок');
    });

    it('should throw error if equipment not found', async () => {
      await expect(
        equipmentService.actions.update.handler({
          params: {
            id: 99999,
            name: 'Несуществующий'
          }
        })
      ).rejects.toThrow('Оборудование не найдено');
    });
  });

  describe('DELETE', () => {
    it('should delete equipment without photo', async () => {
      const equipment = await Equipment.create({
        inventory_number: 'DELETE-001',
        inventory_name: 'Для удаления',
        name: 'Delete Me',
        year_of_release: 2024,
        purchase_basis: 'Тест'
      });

      const result = await equipmentService.actions.delete.handler({
        params: { id: equipment.id }
      });

      expect(result.success).toBe(true);

      const deleted = await Equipment.findByPk(equipment.id);
      expect(deleted).toBeNull();
    });

    it('should prevent deletion if has active repairs', async () => {
      const equipment = await Equipment.create({
        inventory_number: 'DELETE-002',
        inventory_name: 'С заявками',
        name: 'With Repairs',
        year_of_release: 2024,
        purchase_basis: 'Тест'
      });

      await Repair.create({
        equipment_id: equipment.id,
        detection_date: new Date(),
        nature_of_malfunction: 'Тест',
        detected_by: 'Тестер',
        is_resolved: false
      });

      await expect(
        equipmentService.actions.delete.handler({
          params: { id: equipment.id }
        })
      ).rejects.toThrow('активных заявок');
    });

    it('should throw error if equipment not found', async () => {
      await expect(
        equipmentService.actions.delete.handler({
          params: { id: 99999 }
        })
      ).rejects.toThrow('Оборудование не найдено');
    });
  });

  describe('VALIDATE STATUS', () => {
    beforeEach(async () => {
      await Equipment.bulkCreate([
        {
          inventory_number: 'VAL-001',
          inventory_name: 'Исправен',
          name: 'Working',
          year_of_release: 2024,
          purchase_basis: 'Тест',
          working_status: 'Исправен'
        },
        {
          inventory_number: 'VAL-002',
          inventory_name: 'В ремонте',
          name: 'In Repair',
          year_of_release: 2024,
          purchase_basis: 'Тест',
          working_status: 'В ремонте'
        },
        {
          inventory_number: 'VAL-003',
          inventory_name: 'Требует ремонта',
          name: 'Needs Repair',
          year_of_release: 2024,
          purchase_basis: 'Тест',
          working_status: 'Требует ремонта'
        }
      ]);
    });

    it('should return invalid equipment', async () => {
      const all = await Equipment.findAll();
      const ids = all.map(e => e.id);

      const result = await equipmentService.actions.validateStatus.handler({
        params: { ids }
      });

      expect(result.length).toBe(2);
      expect(result.every(e => 
        e.working_status === 'В ремонте' || 
        e.working_status === 'Требует ремонта'
      )).toBe(true);
    });
  });
});