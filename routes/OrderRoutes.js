// routes/ordersRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login'); // Corrigido: middleware deveria ser em 'middleware', não 'midlleware'
const OrderItemsController = require('../controller/OrderItemsController');

// Rota para criar um pedido (order)
router.post('/orders', login.required, OrderItemsController.createOrder);

// Rota para obter um pedido específico
router.get('/orders/:id', login.required, OrderItemsController.getOrderById);

// Rota para obter um pedido 
router.get('/orders/user/:id', login.required, OrderItemsController.getOrders);

// Rota para atualizar um pedido
router.put('/orders/:id', login.required, OrderItemsController.updateOrder);

// Rota para atualizar um item de pedido
router.delete('/order-items/:order_id/item/:product_id', login.required, OrderItemsController.deleteOrderItem);

/*
// Rota para excluir um pedido
router.delete('/orders/:id', login.required, OrderItemsController.deleteOrder);

// ------------------------ Order Items ------------------------


// Rota para excluir um item de pedido
router.delete('/order-items/:order_id/:product_id', login.required, OrderItemsController.deleteOrderItem);
*/
module.exports = router;
