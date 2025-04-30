const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const CatalogoOrdemController = require('../controller/catalogoOrdemController');

// Criar item no catálogo (combo ou produto)
router.post('/catalogo-order', login.required, CatalogoOrdemController.createCatalogoItem);

// Listar todos os itens do catálogo em ordem
router.get('/catalogo-order', login.required, CatalogoOrdemController.listCatalogo);

// Atualizar item do catálogo
router.put('/catalogo-order/:id', login.required, CatalogoOrdemController.updateCatalogoItem);

// Deletar item do catálogo
router.delete('/catalogo-order/:id', login.required, CatalogoOrdemController.deleteCatalogoItem);

module.exports = router;
