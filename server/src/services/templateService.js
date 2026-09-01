const { Template, Lesson } = require('../models');

const templateService = {
  async create(data) {
    return await Template.create(data);
  },

  async getAll() {
    return await Template.findAll({
      where: { is_active: true },
      include: [{ model: Lesson, as: 'lessons' }]
    });
  },

  async getById(id) {
    return await Template.findByPk(id, {
      include: [{ model: Lesson, as: 'lessons' }]
    });
  },

  async update(id, data) {
    const template = await Template.findByPk(id);
    if (!template) return null;
    await template.update(data);
    return template;
  },

  async delete(id) {
    const template = await Template.findByPk(id);
    if (!template) return null;
    await template.update({ is_active: false });
    return true;
  }
};

module.exports = templateService;