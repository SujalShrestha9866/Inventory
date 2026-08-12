const express = require('express');
const router = express.Router();
const partyController = require('../controllers/party.controller');
const { authorise } = require('../middleware/auth');

router.get('/',authorise('Admin','Staff'),partyController.getAll);
router.get('/:id',authorise('Admin','Staff'),partyController.getOne);
router.post('/',authorise('Admin','Staff'),partyController.create);
router.put('/:id',authorise('Admin'),partyController.update);
router.delete('/:id',authorise('Admin'),partyController.del);

module.exports=router;