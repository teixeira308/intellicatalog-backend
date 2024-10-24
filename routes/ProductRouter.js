// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const ProductController = require('../controller/ProductController');

// Rota para receber dados de um candidato
router.post('/products', login.required, ProductController.createProduct ); 
router.get('/products', login.required, ProductController.listAllProducts );
router.get('/products/category/:category_id',login.required, ProductController.simpleListAllProducts );
router.get('/products/:id', login.required, ProductController.getProduct );
router.delete('/products/:id', login.required,ProductController.deleteProduct);
router.put('/products/:id', login.required,ProductController.alterProduct);
router.put('/products/reorder', login.required,ProductController.reorderProducts);
module.exports = router;
