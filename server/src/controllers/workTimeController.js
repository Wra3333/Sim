// src/controllers/workTimeController.js
const workTimeService = require('../services/workTimeService');

const workTimeController = {
  async create(req, res) {
    try {
      console.log('📝 Создание записи WorkTime');
      console.log('  body:', req.body);
      
      const record = await workTimeService.create(req.body);
      res.status(201).json(record);
    } catch (error) {
      console.error('❌ Ошибка создания:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const records = await workTimeService.getAll();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByEquipment(req, res) {
    try {
      const records = await workTimeService.getByEquipmentId(req.params.equipmentId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getReport(req, res) {
    try {
      const { start, end, equipmentId } = req.query;
      if (!start || !end) {
        return res.status(400).json({ error: 'start and end dates required' });
      }
      const report = await workTimeService.getReport(start, end, equipmentId);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getSummary(req, res) {
    try {
      const { start, end } = req.query;
      if (!start || !end) {
        return res.status(400).json({ error: 'start and end dates required' });
      }
      const summary = await workTimeService.getSummary(req.params.equipmentId, start, end);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = workTimeController;