const express = require('express');
const router = express.Router();
const workTimeController = require('../controllers/workTimeController');

/**
 * @swagger
 * /api/worktime:
 *   get:
 *     summary: Получить все записи о работе
 *     tags: [WorkTime]
 *     responses:
 *       200:
 *         description: Список записей
 */
router.get('/', workTimeController.getAll);

/**
 * @swagger
 * /api/worktime:
 *   post:
 *     summary: Создать запись о работе оборудования
 *     tags: [WorkTime]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipment_id
 *               - start_time
 *               - end_time
 *             properties:
 *               equipment_id:
 *                 type: integer
 *               lesson_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               students_count:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Запись создана
 */
router.post('/', workTimeController.create);

/**
 * @swagger
 * /api/worktime/equipment/{equipmentId}:
 *   get:
 *     summary: Получить историю работы оборудования
 *     tags: [WorkTime]
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: История работы
 */
router.get('/equipment/:equipmentId', workTimeController.getByEquipment);

/**
 * @swagger
 * /api/worktime/report:
 *   get:
 *     summary: Отчёт за период
 *     tags: [WorkTime]
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Начало периода
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Конец периода
 *       - in: query
 *         name: equipmentId
 *         schema:
 *           type: integer
 *         description: ID оборудования (опционально)
 *     responses:
 *       200:
 *         description: Отчёт
 */
router.get('/report', workTimeController.getReport);

/**
 * @swagger
 * /api/worktime/summary/{equipmentId}:
 *   get:
 *     summary: Сводка по оборудованию
 *     tags: [WorkTime]
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Сводка
 */
router.get('/summary/:equipmentId', workTimeController.getSummary);

module.exports = router;