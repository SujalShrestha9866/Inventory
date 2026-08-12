const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');
const { authorise } = require('../middleware/auth');

router.get('/',authorise('Admin','Staff'),purchaseController.getAll);
router.get('/:id',authorise('Admin','Staff'),purchaseController.getOne);
router.post('/',authorise('Admin','Staff'),purchaseController.create);

module.exports= router;