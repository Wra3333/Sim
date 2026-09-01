const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

/**
 * @swagger
 * /api/equipment:
 *   get:
 *     summary: Получить всё оборудование
 *     tags: [Equipment]
 *     parameters:
 *       - in: query
 *         name: working_status
 *         schema:
 *           type: string
 *           enum: [Исправен, Требует ремонта, В ремонте]
 *         description: Фильтр по статусу работоспособности
 *       - in: query
 *         name: write_off_status
 *         schema:
 *           type: string
 *           enum: [На балансе, На списание, Списан]
 *         description: Фильтр по статусу списания
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по инвентарному номеру, имени
 *     responses:
 *       200:
 *         description: Список оборудования
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Equipment'
 */
router.get('/', equipmentController.getAll);

/**
 * @swagger
 * /api/equipment/{id}:
 *   get:
 *     summary: Получить оборудование по ID
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID оборудования
 *     responses:
 *       200:
 *         description: Данные оборудования
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Equipment'
 *       404:
 *         description: Оборудование не найдено
 */
router.get('/:id', equipmentController.getById);

/**
 * @swagger
 * /api/equipment:
 *   post:
 *     summary: Создать новое оборудование
 *     tags: [Equipment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inventory_number
 *               - inventory_name
 *               - name
 *             properties:
 *               inventory_number:
 *                 type: string
 *                 description: Инвентарный номер
 *                 example: "INV-001"
 *               inventory_name:
 *                 type: string
 *                 description: Официальное название
 *                 example: "Симулятор сердечно-легочной реанимации"
 *               name:
 *                 type: string
 *                 description: Рабочее название
 *                 example: "Симулятор СЛР"
 *               year_of_release:
 *                 type: integer
 *                 example: 2023
 *               description:
 *                 type: string
 *                 example: "Симулятор для обучения СЛР"
 *               working_status:
 *                 type: string
 *                 enum: [Исправен, Требует ремонта, В ремонте]
 *                 default: Исправен
 *               write_off_status:
 *                 type: string
 *                 enum: [На балансе, На списание, Списан]
 *                 default: На балансе
 *     responses:
 *       201:
 *         description: Оборудование создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Equipment'
 *       400:
 *         description: Ошибка валидации
 */
router.post('/', equipmentController.create);

/**
 * @swagger
 * /api/equipment/{id}:
 *   put:
 *     summary: Обновить оборудование
 *     tags: [Equipment]
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
 *               name:
 *                 type: string
 *               working_status:
 *                 type: string
 *                 enum: [Исправен, Требует ремонта, В ремонте]
 *               write_off_status:
 *                 type: string
 *                 enum: [На балансе, На списание, Списан]
 *     responses:
 *       200:
 *         description: Оборудование обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Equipment'
 *       404:
 *         description: Оборудование не найдено
 */
router.put('/:id', equipmentController.update);

/**
 * @swagger
 * /api/equipment/{id}:
 *   delete:
 *     summary: Удалить оборудование
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Оборудование удалено
 *       404:
 *         description: Оборудование не найдено
 */
router.delete('/:id', equipmentController.delete);

module.exports = router;