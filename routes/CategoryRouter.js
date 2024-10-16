// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const CategoryController = require('../controller/CategoryController');

// Rota para receber dados de um candidato
router.post('/categories', login.required, CategoryController.createCategory ); 
router.get('/categories', login.required, CategoryController.listAllCategories );
router.get('/categories/users/:user_id', login.required,CategoryController.simpleListAllCategories );
router.get('/categories/:id', login.required, CategoryController.getCategory );
router.delete('/categories/:id', login.required,CategoryController.deleteCategory);
router.put('/categories/:id', login.required,CategoryController.alterCategory);

module.exports = router;
