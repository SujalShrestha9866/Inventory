const express = require("express");
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const { authorise } = require('../middleware/auth');

router.get('/',authorise('Admin','Staff'),salesController.getAll);
router.get('/:id',authorise('Admin','Staff'),salesController.getOne);
router.post('/',authorise('Admin','Staff'),salesController.create);
router.delete('/:id',authorise('Admin','Staff'),salesController.del);

module.exports = router;