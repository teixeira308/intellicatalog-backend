// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const ServiceController = require('../controller/ServiceController');

// Rota para receber dados de um candidato

router.post('/services', login.required, ServiceController.createService);  
router.get('/services/:id', login.required, ServiceController.GetService);
router.get('/services', login.required, ServiceController.GetServiceByUserId);
router.delete('/services/:id', login.required, ServiceController.DeleteService);
router.put('/services/reorder', login.required,ServiceController.reorderServices);
router.put('/services/:id', login.required, ServiceController.UpdateService);


module.exports = router;
