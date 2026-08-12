const express = require('express');
const router = express.Router();
const { authorise } = require('../middleware/auth');
const categoryController = require('../controllers/category.controller');

router.get('/',authorise('Admin','Staff'), categoryController.getAll);
router.get('/:id',authorise('Admin','Staff'), categoryController.getOne);
router.post('/',authorise('Admin','Staff'), categoryController.create);
router.put('/:id',authorise('Admin'), categoryController.update);
router.delete('/:id',authorise('Admin'), categoryController.del);

module.exports = router;