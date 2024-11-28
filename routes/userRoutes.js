const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const userController = require('../controller/userController');

router.post('/', userController.createUser);
router.post('/login', userController.Login);
router.post('/resetpassword', userController.ResetPassword);



module.exports = router;