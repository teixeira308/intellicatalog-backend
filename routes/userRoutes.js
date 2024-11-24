const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const userController = require('../controller/userController');

router.post('/', userController.createUser);
router.post('/login', userController.Login);
router.post('/resetpassword', userController.ResetPassword);
router.post('/resetpassword', userController.ResetPassword);
router.get('/externalautentication', login.required,userController.CalendarAuth)


module.exports = router;