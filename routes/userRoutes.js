const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');

router.post('/', userController.createUser);
router.post('/login', userController.Login)

module.exports = router;