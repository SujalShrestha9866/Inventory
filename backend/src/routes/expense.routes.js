const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authorise } = require('../middleware/auth');

router.get('/',authorise('Admin','Staff'),expenseController.getAll);
router.get('/:id',authorise('Admin','Staff'),expenseController.getOne);
router.post('/',authorise('Admin','Staff'),expenseController.create);
router.put('/:id',authorise('Admin'), expenseController.update);
router.delete('/:id',authorise('Admin'),expenseController.del);

module.exports = router;