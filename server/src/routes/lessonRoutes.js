const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');

/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: Получить все занятия
 *     tags: [Lessons]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Запланировано, Проведено, Отменено]
 *       - in: query
 *         name: group
 *         schema:
 *           type: string
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список занятий
 */
router.get('/', lessonController.getAll);

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Создать занятие
 *     tags: [Lessons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - group
 *               - teacher
 *               - date
 *               - start_time
 *               - end_time
 *             properties:
 *               title:
 *                 type: string
 *               group:
 *                 type: string
 *               teacher:
 *                 type: string
 *               students_count:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               start_time:
 *                 type: string
 *                 format: time
 *               end_time:
 *                 type: string
 *                 format: time
 *               template_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Запланировано, Проведено, Отменено]
 *     responses:
 *       201:
 *         description: Занятие создано
 */
router.post('/', lessonController.create);

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Получить занятие по ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные занятия
 */
router.get('/:id', lessonController.getById);

/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Обновить занятие
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Занятие обновлено
 */
router.put('/:id', lessonController.update);

/**
 * @swagger
 * /api/lessons/{id}/complete:
 *   put:
 *     summary: Завершить занятие (создать записи в WorkTime)
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Занятие завершено
 */
router.put('/:id/complete', lessonController.complete);

/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Удалить занятие
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Занятие удалено
 */
router.delete('/:id', lessonController.delete);

module.exports = router;