// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const ServiceController = require('../controller/ServiceController');

// Rota para receber dados de um candidato
router.post('/services', login.required, ServiceController.createService); 
router.get('/services', login.required, ServiceController.GetAllServices);
router.put('/services/:id', login.required, ServiceController.UpdateService);
router.delete('/services/:id', login.required, ServiceController.DeleteService);
router.get('/services/:id', login.required, ServiceController.GetService);

module.exports = router;
