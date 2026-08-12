const express = require('express');
const router = express.Router();
const { authorise } = require('../middleware/auth');
const usersController = require('../controllers/user.controller');


router.get('/', authorise('Admin'), usersController.getAll);
router.post('/', authorise('Admin'), usersController.create);
router.put('/:id', authorise('Admin'), usersController.update);
router.delete('/:id', authorise('Admin'), usersController.del);

module.exports = router;