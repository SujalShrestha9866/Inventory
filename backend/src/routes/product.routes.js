const express = require('express');
const router = express.Router() ;
const productController = require('../controllers/product.controller');
const { authorise } = require('../middleware/auth');

router.get('/',authorise('Admin','Staff'),productController.getAll);
router.get('/:id',authorise('Admin','Staff'),productController.getOne);
router.post('/',authorise('Admin'),productController.create);
router.put('/:id',authorise('Admin'),productController.update);
router.delete('/:id',authorise('Admin'),productController.del);

module.exports= router;