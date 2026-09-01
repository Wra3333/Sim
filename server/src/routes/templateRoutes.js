const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Получить все шаблоны
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Список шаблонов
 */
router.get('/', templateController.getAll);

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Создать шаблон занятия
 *     tags: [Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - discipline
 *             properties:
 *               title:
 *                 type: string
 *               discipline:
 *                 type: string
 *               module:
 *                 type: string
 *               equipment_list:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     equipment_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Шаблон создан
 */
router.post('/', templateController.create);

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Получить шаблон по ID
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные шаблона
 */
router.get('/:id', templateController.getById);

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: Обновить шаблон
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Шаблон обновлён
 */
router.put('/:id', templateController.update);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: Удалить шаблон (деактивировать)
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Шаблон удалён
 */
router.delete('/:id', templateController.delete);

module.exports = router;