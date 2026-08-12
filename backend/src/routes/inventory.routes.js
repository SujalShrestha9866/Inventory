const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authorise } = require('../middleware/auth');


router.get('/',authorise('Admin','Staff'),inventoryController.getAll);
router.put('/:id',authorise('Admin'),inventoryController.update);
router.get('/:id',authorise('Admin'),inventoryController.getLogs);

module.exports =router;