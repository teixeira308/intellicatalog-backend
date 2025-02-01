// routes/fileUploadRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/dbConfig');
const fs = require('fs');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const login = require('../midlleware/login');

const uploadStoreImageController = require('../controller/uploadStoreImageController');



// Rota para upload de arquivo
router.post('/stores/:store_id/store_images/upload', login.required, uploadStoreImageController.uploadSingleFile, uploadStoreImageController.UploadFile);

router.get('/stores/store_images/user/:userid', login.required, uploadStoreImageController.getStoreImageByUserId);

router.get('/stores/:store_id/store_images', login.required, uploadStoreImageController.getStoreImagesByStore);

router.get('/stores/:store_id/store_images/download', login.required, uploadStoreImageController.getStoreImageDownload);

router.get('/stores/:store_id/store_images/:store_image_id', login.required, uploadStoreImageController.getStoreImagesByStoreId);

router.delete('/stores/:store_id/store_images/:store_image_id', login.required, uploadStoreImageController.deleteStoreImageById);

module.exports = router;
