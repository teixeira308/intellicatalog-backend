const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const OpcoesController = require('../controller/OpcoesController');

// Criar nova opção de personalização
router.post('/opcoes-personalizacao', login.required, OpcoesController.createOpcao);

// Listar todas as opções de personalização
router.get('/opcoes-personalizacao', login.required, OpcoesController.listAllOpcoes);

// Obter uma opção específica
router.get('/opcoes-personalizacao/:id', login.required, OpcoesController.getOpcao);

// Atualizar uma opção específica
router.put('/opcoes-personalizacao/:id', login.required, OpcoesController.alterOpcao);

// Deletar (inativar) uma opção
router.delete('/opcoes-personalizacao/:id', login.required, OpcoesController.deleteOpcao);

module.exports = router;
