const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const ComboProdutoController = require('../controller/ComboProdutoController');

// Adiciona um produto ao combo
router.post('/combo-produtos', login.required, ComboProdutoController.addProdutoAoCombo);

// Remove um produto do combo
router.delete('/combo-produtos', login.required, ComboProdutoController.removerProdutoDoCombo);

// Lista todos os produtos de um combo
router.get('/combo-produtos/:combo_id', login.required, ComboProdutoController.listarProdutosDoCombo);

module.exports = router;
