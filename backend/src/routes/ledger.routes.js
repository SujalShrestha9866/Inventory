const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledger.controller');
const { authorise } = require('../middleware/auth');

router.get('/:partyId', authorise('Admin','Staff'),ledgerController.getByParty);

router.get('/:partyId/balance', authorise('Admin','Staff'),ledgerController.getBalance);

module.exports = router;