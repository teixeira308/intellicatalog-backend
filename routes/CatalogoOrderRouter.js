const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const CatalogoOrdemController = require('../controller/catalogoOrderController');

// Criar item no catálogo (combo ou produto)
router.post('/catalogo-order', login.required, CatalogoOrdemController.createCatalogoItem);

// Listar todos os itens do catálogo em ordem
router.get('/catalogo-order', login.required, CatalogoOrdemController.listCatalogo);

// Atualizar item do catálogo
router.put('/catalogo-order/:id', login.required, CatalogoOrdemController.updateCatalogoItem);

// Deletar item do catálogo
router.delete('/catalogo-order/:id', login.required, CatalogoOrdemController.deleteCatalogoItem);

// Reordenar todos os itens (array com { id, ordem })
router.put('/catalogo/reorder', login.required, CatalogoOrdemController.reorderCatalogo);


module.exports = router;
