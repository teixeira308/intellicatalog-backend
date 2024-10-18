const express = require('express');
const router = express.Router();
const login = require('../midlleware/login');
const StoreController = require('../controller/StoreController');

// Rota para receber dados de um candidato
router.post('/stores', login.required, StoreController.createStore ); 
router.get('/stores', login.required, StoreController.listAllStores );
router.get('/stores/:id', login.required, StoreController.getStore );
router.delete('/stores/:id', login.required,StoreController.deleteStore);
router.put('/stores/:id', login.required,StoreController.alterStore);

//store config
router.get('/stores/:id/config', login.required, StoreController.getStoreConfigs );
router.post('/stores/:id/config', login.required, StoreController.createStoreConfigs );
router.put('/stores/:id/config', login.required,StoreController.alterStoreConfigs);


module.exports = router;
