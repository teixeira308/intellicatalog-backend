// routes/ordersRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../middleware/login'); // Corrigido: middleware deveria ser em 'middleware', não 'midlleware'
const OrdersController = require('../controller/OrdersController');
const OrderItemsController = require('../controller/OrderItemsController');

// Rota para criar um pedido (order)
router.post('/orders', login.required, OrdersController.createOrder);

// Rota para obter todos os pedidos
router.get('/orders', login.required, OrdersController.getAllOrders);

// Rota para obter um pedido específico
router.get('/orders/:id', login.required, OrdersController.getOrder);

// Rota para atualizar um pedido
router.put('/orders/:id', login.required, OrdersController.updateOrder);

// Rota para excluir um pedido
router.delete('/orders/:id', login.required, OrdersController.deleteOrder);

// ------------------------ Order Items ------------------------

// Rota para adicionar um item a um pedido
router.post('/order-items', login.required, OrderItemsController.createOrderItem);

// Rota para obter todos os itens de um pedido
router.get('/order-items/:order_id', login.required, OrderItemsController.getOrderItems);

// Rota para atualizar um item de pedido
router.put('/order-items/:order_id/:product_id', login.required, OrderItemsController.updateOrderItem);

// Rota para excluir um item de pedido
router.delete('/order-items/:order_id/:product_id', login.required, OrderItemsController.deleteOrderItem);

module.exports = router;
