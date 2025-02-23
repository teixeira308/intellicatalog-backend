    const express = require('express');
    const multer = require('multer');
    const pool = require('../config/dbConfig');
    const fs = require('fs');
    const PizZip = require("pizzip");
    const Docxtemplater = require("docxtemplater"); 
    const path = require('path');

    //heif-convert
    const sizeOf = require('image-size');
    const { execSync } = require('child_process');

    const {Logmessage} = require( "../helper/Tools");

    const getProductImageById = async (req, res) => {
        const { product_id } = req.params; // Acessar o parâmetro de caminho
        const { arquivo } = req.query; // Acessar o parâmetro de consulta

        try {
            
            // Verificar se o documento existe na pasta de uploads e se pertence ao usuário
            const filePath = path.join(__dirname, '..', 'uploads', arquivo);
            console.log(filePath)
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Documento não encontrado' });
            }

            // Consultar no banco de dados se o usuári o possui acesso ao documento
            const connection = await pool.getConnection();
            const [rows] = await connection.query('SELECT * FROM products_images WHERE product_id = ?  AND nomearquivo = ?', [product_id,arquivo]);
            connection.release();

            if (!rows.length) {
                return res.status(403).json({ message: 'Usuário não tem acesso a este documento' });
            }

            // Se tudo estiver correto, enviar o arquivo para download
            res.setHeader('Content-Disposition', 'inline');
            res.download(filePath);
        } catch (error) {
            console.error('Erro ao baixar o arquivo:', error);
            res.status(500).json({ message: 'Erro ao baixar o arquivo' });
        }
    }


    // Configuração do Multer para salvar os arquivos no disco
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = 'uploads/';

            Logmessage(`Definindo destino do upload. Diretório: ${uploadPath}`);
            
            // Verificar se o diretório existe e criar caso não exista
            try {
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                    Logmessage(`Diretório criado: ${uploadPath}`);
                }
            } catch (error) {
                Logmessage(`Erro ao criar o diretório ${uploadPath}`, error);
                return cb(new Error(`Erro ao criar o diretório de upload: ${error.message}`), null);
            }
            Logmessage("Arquivo recebido no backend:", req.file);

            cb(null, uploadPath); // Diretório onde os arquivos serão salvos
        },
        filename: function (req, file, cb) {
            Logmessage(`Iniciando processamento do nome do arquivo. Usuário: ${req.user?.userId || 'desconhecido'}, Produto: ${req.params?.product_id || 'desconhecido'}`);
            Logmessage('file: ',file)
            try {
                // Obter a data e hora atual
                const currentDateTime = new Date().toISOString()
                    .replace(/[-:]/g, '')
                    .replace('T', '')
                    .replace(/\..+/, '');

                // Obter o ID do usuário
                const userId = req.user?.userId || 'unknown'; // Caso o ID do usuário não esteja disponível

                // Obter o ID do produto
                const productId = req.params?.product_id || 'unknown'; // Caso o ID do produto não esteja disponível

                // Obter o nome original do arquivo
                const originalFileName = file.originalname.replace(/\s+/g, '_'); // Substituir espaços por underscores para evitar problemas

                // Gerar o nome do arquivo
                const fileName = `${userId}-${productId}-${currentDateTime}-${originalFileName}`;

                Logmessage(`Nome do arquivo gerado: ${fileName}`);

                cb(null, fileName); // Nome do arquivo salvo
            } catch (error) {
                Logmessage('Erro ao gerar o nome do arquivo', error);
                return cb(new Error('Erro ao gerar o nome do arquivo'), null);
            }
        }
    });


    const upload = multer({ storage: storage });

    // Middleware para processar o upload de um único arquivo
    const uploadSingleFile = upload.single('file');

    const UploadFile = async (req, res) => {
        Logmessage(`Início do upload de imagem para o produto: ${req.params.product_id} pelo usuário: ${req.user.userId}`);

        if (!req.file) {
            Logmessage('Nenhum arquivo foi enviado na requisição.');
            return res.status(400).json({ message: 'Nenhum arquivo foi enviado' });
        }

        const { userId } = req.user;
        const { product_id } = req.params;
        let nomearquivo = req.file.filename;
        const tamanho = req.file.size;
        let tipo = req.file.originalname.split('.').pop().toLowerCase();

        Logmessage(`Detalhes do arquivo recebido: Nome: ${nomearquivo}, Tamanho: ${tamanho}, Tipo: ${tipo}`);

        try {
            // Verificar o tipo real da imagem usando image-size
            const filePath = path.join('uploads', nomearquivo);
            const dimensions = sizeOf(filePath);  // Tenta pegar o tipo real da imagem

            if (!dimensions) {
                return res.status(400).json({ message: 'Imagem inválida' });
            }

            tipo = dimensions.type;  // Agora tipo será 'jpg', 'heif', etc.

            Logmessage(`Tipo da imagem detectado: ${tipo}`);

            // Caso a imagem seja HEIF ou HEIC, realizar conversão
            if (tipo === 'heif' || tipo === 'heic') {
                const convertedFilePath = filePath.replace('.heif', '.jpg').replace('.heic', '.jpg');
                execSync(`convert ${filePath} ${convertedFilePath}`);
                Logmessage(`Imagem HEIF convertida para JPEG: ${convertedFilePath}`);

                fs.renameSync(convertedFilePath, filePath);  // Substituir o arquivo original com o convertido
                nomearquivo = nomearquivo.replace('.heif', '.jpg').replace('.heic', '.jpg');  // Atualizar o nome do arquivo
                tipo = 'jpeg';  // Atualizar o tipo para 'jpeg' após conversão
            }

            // Inserir os detalhes do arquivo no banco de dados
            Logmessage('Tentando inserir detalhes do arquivo no banco de dados...');
            const connection = await pool.getConnection();
            const query = 'INSERT INTO products_images ( nomearquivo, tipo, tamanho, product_id, user_id) VALUES (?, ?, ?, ?, ?)';
            const values = [nomearquivo, tipo, tamanho, product_id, userId];
            const [result] = await connection.query(query, values);

            Logmessage(`Arquivo inserido no banco de dados com sucesso. ID gerado: ${result.insertId}`);

            // Recuperar os detalhes do arquivo inserido
            const [rows] = await connection.query('SELECT * FROM products_images WHERE id = ?', [result.insertId]);
            connection.release();

            if (!rows.length) {
                Logmessage('Falha ao recuperar os detalhes do arquivo recém-inserido no banco de dados.');
                return res.status(404).json({ message: 'Detalhes do arquivo não encontrados' });
            }

            Logmessage(`Upload concluído com sucesso para o arquivo: ${nomearquivo}`);
            res.status(200).json({ message: 'Arquivo enviado com sucesso', fileDetails: rows[0] });
        } catch (error) {
            Logmessage('Erro durante o upload do arquivo:', error);
            console.error('Erro ao inserir detalhes do arquivo no banco de dados:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    };


    const getProductImagesByUserId = async (req, res) => {
        const userId = req.params.userid; 
        try {
            // Consultar templates no banco de dados com base no ID do usuário
            const connection = await pool.getConnection();
            const [rows] = await connection.query('SELECT * FROM products_images WHERE user_id = ? order by image_product_order asc', [userId]);
            connection.release();
        
            res.status(200).json(rows);
        } catch (error) {
            console.error('Erro ao buscar product images por ID do usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    const getProductImagesByProductId = async (req, res) => {
        const product_id = req.params.product_id; 
        try {
            // Consultar templates no banco de dados com base no ID do usuário
            const connection = await pool.getConnection();
            const [rows] = await connection.query('SELECT * FROM products_images WHERE product_id = ? order by image_product_order asc', [product_id]);
            connection.release();
        
            res.status(200).json(rows);
        } catch (error) {
            console.error('Erro ao buscar product images por ID do usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

     


    const deleteProductImageById = async (req, res) => {
        try {
            Logmessage("ID da imagem a deletar: "+req.params.product_image_id);
            const product_image_id = req.params.product_image_id;
            const connection = await pool.getConnection();
            const query = 'DELETE FROM products_images WHERE id = ?';
            const [result] = await connection.query(query, product_image_id);
            connection.release(); 

            // Verificar se o template foi excluído com sucesso
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Imagem do produto não encontrada.' });
            }

            // Retornar uma resposta de sucesso
            res.status(200).json({ message: 'Imagem excluída com sucesso', id: product_image_id });
        } catch (error) {
            console.error('Erro ao excluir o template do banco de dados:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    };

    module.exports = { getProductImageById,deleteProductImageById, UploadFile, uploadSingleFile, getProductImagesByUserId ,getProductImagesByProductId};
