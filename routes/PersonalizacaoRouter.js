const express = require('express');
const router = express.Router();
const personalizacaoController = require('../controller/PersonalizacaoController');

// Criar personalização
router.post('/personalizacoes', personalizacaoController.createPersonalizacao);

// Listar personalizações de um pedido
router.get('/personalizacoes/order/:order_id', personalizacaoController.listPersonalizacoesByOrder);

// Alterar personalização (exemplo: atualizar valor selecionado)
router.put('/personalizacoes/:id', personalizacaoController.alterPersonalizacao);

// Deletar personalização
router.delete('/personalizacoes/:id', personalizacaoController.deletePersonalizacao);

// Obter uma personalização específica
router.get('/personalizacoes/:id', personalizacaoController.getPersonalizacao);

module.exports = router;
