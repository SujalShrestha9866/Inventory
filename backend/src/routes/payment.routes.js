const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authorise } = require('../middleware/auth');

router.get('/',authorise('Admin','Staff'),paymentController.getAll);
router.post('/',authorise('Admin','Staff'),paymentController.create);

module.exports = router;