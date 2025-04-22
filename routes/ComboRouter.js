

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const ComboController = require('../controller/ComboController');

// Rota para criar um novo combo
router.post('/combos', login.required, ComboController.createCombo);

// Rota para listar todos os combos
router.get('/combos', login.required, ComboController.listAllCombos);

// Rota para obter um combo específico
router.get('/combos/:id', login.required, ComboController.getCombo);

// Rota para alterar um combo específico
router.put('/combos/:id', login.required, ComboController.alterCombo);

// Rota para deletar um combo
router.delete('/combos/:id', login.required, ComboController.deleteCombo);

// Rota para reordenar os produtos dentro de um combo
router.put('/combos/reorder', login.required, ComboController.reorderCombo);

module.exports = router;
