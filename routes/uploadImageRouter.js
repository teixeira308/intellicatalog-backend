// routes/fileUploadRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../config/dbConfig');
const fs = require('fs');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const login = require('../midlleware/login');

const uploadImageController = require('../controller/uploadImageController');



// Rota para upload de arquivo
router.post('/products/:product_id/products_images/upload', login.required, uploadImageController.uploadSingleFile, uploadImageController.UploadFile);

router.get('/products/products_images/user/:userid', login.required, uploadImageController.getProductImagesByUserId);

router.get('/products/:product_id/products_images/', login.required, uploadImageController.getProductImagesByProductId);

router.get('/products/:product_id/products_images/download', login.required, uploadImageController.getProductImageById);

router.delete('/products/:product_image_id/products_images/', login.required, uploadImageController.deleteProductImageById);

module.exports = router;
