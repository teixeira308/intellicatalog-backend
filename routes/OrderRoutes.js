// routes/ordersRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login'); // Corrigido: middleware deveria ser em 'middleware', não 'midlleware'
const OrderItemsController = require('../controller/OrderItemsController');

// Rota para criar um pedido (order)
router.post('/orders', login.required, OrderItemsController.createOrder);
/*
// Rota para obter todos os pedidos
router.get('/orders', login.required, OrderItemsController.listAllOrders);

// Rota para obter um pedido específico
router.get('/orders/:id', login.required, OrderItemsController.getOrder);

// Rota para atualizar um pedido
router.put('/orders/:id', login.required, OrderItemsController.updateOrder);

// Rota para excluir um pedido
router.delete('/orders/:id', login.required, OrderItemsController.deleteOrder);

// ------------------------ Order Items ------------------------

// Rota para atualizar um item de pedido
router.put('/order-items/:order_id/:product_id', login.required, OrderItemsController.updateOrderItem);

// Rota para excluir um item de pedido
router.delete('/order-items/:order_id/:product_id', login.required, OrderItemsController.deleteOrderItem);
*/
module.exports = router;
