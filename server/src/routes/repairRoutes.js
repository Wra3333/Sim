const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');

/**
 * @swagger
 * /api/repairs:
 *   get:
 *     summary: Получить все заявки о неисправностях
 *     tags: [Repairs]
 *     responses:
 *       200:
 *         description: Список заявок
 */
router.get('/', repairController.getAll);

/**
 * @swagger
 * /api/repairs:
 *   post:
 *     summary: Создать заявку о неисправности
 *     tags: [Repairs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipment_id
 *               - detection_date
 *               - nature_of_malfunction
 *               - detected_by
 *             properties:
 *               equipment_id:
 *                 type: integer
 *               detection_date:
 *                 type: string
 *                 format: date-time
 *               nature_of_malfunction:
 *                 type: string
 *               detected_by:
 *                 type: string
 *               repair_possibility:
 *                 type: string
 *                 enum: [Самостоятельно, Требуется сервисный инженер]
 *     responses:
 *       201:
 *         description: Заявка создана
 */
router.post('/', repairController.create);

/**
 * @swagger
 * /api/repairs/equipment/{equipmentId}:
 *   get:
 *     summary: Получить все заявки для оборудования
 *     tags: [Repairs]
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список заявок
 */
router.get('/equipment/:equipmentId', repairController.getByEquipment);

/**
 * @swagger
 * /api/repairs/{id}/resolve:
 *   put:
 *     summary: Закрыть заявку
 *     tags: [Repairs]
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
 *             properties:
 *               resolved_by:
 *                 type: string
 *               resolution_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Заявка закрыта
 */
router.put('/:id/resolve', repairController.resolve);

module.exports = router;