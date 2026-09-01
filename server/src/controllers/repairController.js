const repairService = require('../services/repairService');

const repairController = {
  async create(req, res) {
    try {
      const repair = await repairService.create(req.body);
      res.status(201).json(repair);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const repairs = await repairService.getAll();
      res.json(repairs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByEquipment(req, res) {
    try {
      const repairs = await repairService.getByEquipmentId(req.params.equipmentId);
      res.json(repairs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async resolve(req, res) {
    try {
      const repair = await repairService.resolve(req.params.id, req.body);
      if (!repair) {
        return res.status(404).json({ error: 'Repair not found' });
      }
      res.json(repair);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = repairController;