const lessonService = require('../services/lessonService');

const lessonController = {
  async create(req, res) {
    try {
      const lesson = await lessonService.create(req.body);
      res.status(201).json(lesson);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const { status, group, teacher } = req.query;
      const lessons = await lessonService.getAll({ status, group, teacher });
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const lesson = await lessonService.getById(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const lesson = await lessonService.update(req.params.id, req.body);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.json(lesson);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async complete(req, res) {
    try {
      const lesson = await lessonService.complete(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.json(lesson);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const result = await lessonService.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = lessonController;