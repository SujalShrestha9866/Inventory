const express = require('express');

const router = express.Router();

const { login } = require('../controllers/authcontroller');


// Public login route
router.post('/login', login);


module.exports = router;
