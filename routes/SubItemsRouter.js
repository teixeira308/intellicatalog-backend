const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const SubItemsController = require('../controller/SubItemsController');

// CRUD principal
router.post('/subitems', login.required, SubItemsController.createSubItem);
router.get('/subitems', login.required, SubItemsController.listSubItems);
router.get('/subitems/:id', login.required, SubItemsController.getSubItem);
router.put('/subitems/:id', login.required, SubItemsController.updateSubItem);
router.delete('/subitems/:id', login.required, SubItemsController.deleteSubItem);

// Rota específica para reordenar
router.put('/reorder/all', login.required, SubItemsController.reorderSubItems);

module.exports = router;
