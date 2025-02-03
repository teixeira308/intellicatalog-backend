// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const AvaliabilityController = require('../controller/AvaliabilityController');

// Rota para receber dados de um candidato
router.post('/availability', login.required, AvaliabilityController.CreateAvaliability); 
router.get('/availability', login.required, AvaliabilityController.GetAllAvaliability);
router.put('/availability/:id', login.required, AvaliabilityController.UpdateAvaliability);
router.delete('/availability/:id', login.required, AvaliabilityController.DeleteAvaliability);
router.get('/availability/:id', login.required, AvaliabilityController.GetAvaliability);

module.exports = router;
