const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.post('/', userController.createUser);
router.post('/login', userController.Login);
router.post('/resetpassword', userController.ResetPassword);
router.post('/updatepassword', userController.UpdatePassword);



module.exports = router;