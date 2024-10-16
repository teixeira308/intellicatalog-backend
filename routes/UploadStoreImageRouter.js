// routes/fileUploadRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../config/dbConfig');
const fs = require('fs');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const login = require('../midlleware/login');

const uploadStoreImageController = require('../controller/uploadStoreImageController');



// Rota para upload de arquivo
router.post('/stores/:store_id/store_images/upload', login.required, uploadStoreImageController.uploadSingleFile, uploadStoreImageController.UploadFile);

router.get('/stores/store_images/user/:userid', login.required, uploadStoreImageController.getStoreImageByUserId);

//router.get('/stores/:store_id/store_image/', login.required, uploadStoreImageController.getProductImagesByProductId);

//router.get('/stores/:store_id/storr_image/download', login.required, uploadStoreImageController.getProductImageById);

router.delete('/stores/:store_id/store_images/:store_image_id', login.required, uploadStoreImageController.deleteStoreImageById);

module.exports = router;
