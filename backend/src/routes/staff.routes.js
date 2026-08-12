const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authorise } = require('../middleware/auth');

router.get('/',authorise('Admin'),staffController.getAll);
router.get('/:id',authorise('Admin'),staffController.getOne);
router.post('/',authorise('Admin'),staffController.create);
router.put ('/:id',authorise('Admin'),staffController.update);
router.delete('/:id',authorise('Admin'),staffController.del);
module.exports=router;