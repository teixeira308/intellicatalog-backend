// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const ProductController = require('../controller/ProductController');
const SubItemsController = require('../controller/SubItemsController');

// Rota para receber dados de um candidato
router.post('/products', login.required, ProductController.createProduct ); 
router.get('/products/:user_id', login.required, ProductController.listAllProducts );
router.get('/products/category/:category_id',login.required, ProductController.simpleListAllProducts );
router.get('/products/details/:id', login.required, ProductController.getProduct );
router.delete('/products/:id', login.required,ProductController.deleteProduct); 
router.put('/products/reorder-images', login.required,ProductController.reorderProductImages);
router.put('/products/reorder', login.required,ProductController.reorderProducts);
router.put('/products/:id', login.required,ProductController.alterProduct);
router.get('/products/:id/subitems', login.required, SubItemsController.listByParentProduct);



module.exports = router;
