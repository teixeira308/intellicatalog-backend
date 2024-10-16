// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/dbConfig');
const login = require('../midlleware/login');
const PessoaController = require('../controller/PessoaController');

// Rota para receber dados de um candidato
router.post('/pessoas', login.required, PessoaController.createPessoa ); 
router.get('/pessoas', login.required, PessoaController.listAllPessoas );
router.get('/pessoas/:id', login.required, PessoaController.getPessoa );
router.delete('/pessoas/:id', login.required,PessoaController.deletePessoa);
router.put('/pessoas/:id', login.required,PessoaController.alterPessoa);

module.exports = router;
