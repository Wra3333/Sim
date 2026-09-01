const templateService = require('../services/templateService');

const templateController = {
  async create(req, res) {
    try {
      const template = await templateService.create(req.body);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const templates = await templateService.getAll();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const template = await templateService.getById(req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const template = await templateService.update(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const result = await templateService.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = templateController;