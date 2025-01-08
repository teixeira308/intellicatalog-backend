// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const AppointmentsController = require('../controller/AppointmentController');

// Rota para receber dados de um candidato
router.post('/appointments', login.required, AppointmentsController.createAppointments); 
router.get('/appointments', login.required, AppointmentsController.GetAllAppointments);
router.put('/appointments', login.required, AppointmentsController.UpdateAppointments);
router.delete('/appointments', login.required, AppointmentsController.DeleteAppointments);
router.get('/appointments/:id', login.required, AppointmentsController.GetAppointments);

module.exports = router;
