const equipmentService = require('../services/equipmentService');

const equipmentController = {
  async create(req, res) {
    try {
      const equipment = await equipmentService.create(req.body);
      res.status(201).json(equipment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const { working_status, write_off_status, search } = req.query;
      const equipment = await equipmentService.getAll({
        working_status,
        write_off_status,
        search
      });
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const equipment = await equipmentService.getById(req.params.id);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const equipment = await equipmentService.update(req.params.id, req.body);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }
      res.json(equipment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const result = await equipmentService.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Equipment not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = equipmentController;