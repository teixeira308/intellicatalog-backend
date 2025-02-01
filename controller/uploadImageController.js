const express = require('express');
const multer = require('multer');
const pool = require('../config/dbConfig');
const fs = require('fs');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require('path');
const sharp = require('sharp');

const { Logmessage } = require("../helper/Tools");


const { v4: uuidv4 } = require('uuid'); // Importando a função para gerar UUID

const getProductImageById = async (req, res) => {
    const { product_id } = req.params;
    const { arquivo } = req.query;
    Logmessage('Obter imagem por id - produto: ' + product_id)
    Logmessage('Obter imagem por id - arquivo: ' + arquivo)
    try {
        // Verificar se o arquivo foi especificado
        if (!arquivo) {
            Logmessage('Nome do arquivo não especificado')
            return res.status(400).json({ message: 'Nome do arquivo não especificado' });
        }

        // Caminho absoluto do arquivo
        const filePath = path.resolve(__dirname, '..', 'uploads', arquivo);
        Logmessage(`Tentando servir: ${filePath}`);

        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
            Logmessage('Arquivo não encontrado')
            return res.status(404).json({ message: 'Arquivo não encontrado' });
        }

        // Consultar no banco de dados se o usuário tem acesso ao documento
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM products_images WHERE product_id = ? AND nomearquivo = ?',
            [product_id, arquivo]
        );
        connection.release();

        if (!rows.length) {
            Logmessage('Usuário não tem acesso a este documento')
            return res.status(403).json({ message: 'Usuário não tem acesso a este documento' });
        }

        // Detectar o tipo de arquivo dinamicamente
        const fileExtension = path.extname(filePath).toLowerCase();
        let mimeType = 'application/octet-stream'; // Tipo padrão caso não reconheça

        switch (fileExtension) {
            case '.jpg':
            case '.jpeg':
                mimeType = 'image/jpeg';
                break;
            case '.png':
                mimeType = 'image/png';
                break;
            case '.webp':
                mimeType = 'image/webp';
                break;
            case '.gif':
                mimeType = 'image/gif';
                break;
        }
        Logmessage(res.json)
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por um dia
        res.sendFile(filePath);
    } catch (error) {
        Logmessage('Erro ao processar a imagem:', error);
        res.status(500).json({ message: 'Erro interno ao processar a imagem' });
    }
};


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Diretório onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {


        // Gerar um UUID para o nome do arquivo
        const uniqueFileName = uuidv4();

        // Obter a extensão do arquivo original
        const fileExtension = path.extname(file.originalname).toLowerCase();

        // Nome final do arquivo (UUID + extensão)
        const fileName = `${uniqueFileName}${fileExtension}`;
        Logmessage("Upload imagem store: " + req.user.userId + " - store_id : " + req.params.store_id + " - nome do arquivo: " + fileName);
        cb(null, fileName); // Nome do arquivo salvo
    }
});

const upload = multer({ storage: storage });

// Middleware para processar o upload de um único arquivo
const uploadSingleFile = upload.single('file');


// Dentro da função UploadFile
const UploadFile = async (req, res) => {
    try {
        if (!req.file) {
            Logmessage('Nenhum arquivo foi enviado na requisição.');
            return res.status(400).json({ message: 'Nenhum arquivo foi enviado' });
        }

        const { userId } = req.user;
        const { product_id } = req.params;
        const nomearquivo = req.file.filename;
        const tamanho = req.file.size;
        const tipo = req.file.originalname.split('.').pop().toLowerCase();

        const originalFilePath = path.resolve(__dirname, '..', 'uploads', nomearquivo);
        const processedFilePath = path.resolve(__dirname, '..', 'uploads', `processed_${nomearquivo}.jpg`);

        Logmessage(`Início do upload de imagem para o produto: ${product_id} pelo usuário: ${userId}`);
        Logmessage(`Detalhes do arquivo recebido: Nome: ${nomearquivo}, Tamanho: ${tamanho}, Tipo: ${tipo}`);

        // Verifica se o arquivo existe antes de processar
        if (!fs.existsSync(originalFilePath)) {
            Logmessage(`Erro: O arquivo ${originalFilePath} não foi encontrado.`);
            return res.status(400).json({ message: 'Arquivo de imagem inválido ou corrompido' });
        }

        try {
            // Processa a imagem e remove metadados
            await sharp(originalFilePath)
                .rotate() // Corrige a orientação
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .withMetadata({}) // REMOVE OS METADADOS EXIF
                .toFile(processedFilePath);

            Logmessage(`Imagem processada e metadados removidos com sucesso para o produto: ${product_id}`);

            // Deleta o arquivo original para economizar espaço
            fs.unlinkSync(originalFilePath);

            // Insere os detalhes no banco de dados
            const connection = await pool.getConnection();
            const query = 'INSERT INTO products_images (nomearquivo, tipo, tamanho, product_id, user_id) VALUES (?, ?, ?, ?, ?)';
            const values = [`processed_${nomearquivo}.jpg`, tipo, tamanho, product_id, userId];
            const [result] = await connection.query(query, values);
            connection.release();

            Logmessage(`Arquivo inserido no banco de dados com sucesso. ID gerado: ${result.insertId}`);

            // Retorna os detalhes do arquivo inserido
            res.status(200).json({
                message: 'Arquivo enviado com sucesso',
                fileDetails: { id: result.insertId, nomearquivo: `processed_${nomearquivo}.jpg`, tipo, tamanho, product_id, userId }
            });

        } catch (error) {
            Logmessage('Erro durante o upload do arquivo:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }

    } catch (error) {
        Logmessage(`Erro inesperado: ${error.message}`);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = { UploadFile };



const getProductImagesByUserId = async (req, res) => {
    const userId = req.params.userid;
    Logmessage("Usuario: " + userId)
    try {
        // Consultar templates no banco de dados com base no ID do usuário
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM products_images WHERE user_id = ?', [userId]);
        connection.release();

        res.status(200).json(rows);
    } catch (error) {
        Logmessage('Erro ao buscar product images por ID do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const getProductImagesByProductId = async (req, res) => {
    const product_id = req.params.product_id;
    Logmessage("Produto: " + product_id)
    try {
        // Consultar templates no banco de dados com base no ID do usuário
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM products_images WHERE product_id = ?', [product_id]);
        connection.release();

        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar product images por ID do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const deleteTemplateById = async (req, res) => {
    const templateId = req.params.id;

    try {
        // Consultar o nome do arquivo do template no banco de dados
        const connection = await pool.getConnection();
        const query = 'SELECT nomearquivo FROM templates WHERE id = ?';
        const [rows] = await connection.query(query, [templateId]);
        connection.release();

        if (!rows.length) {
            return res.status(404).json({ message: 'Template não encontrado' });
        }

        const { nomearquivo } = rows[0];

        // Excluir o arquivo da pasta
        const filePath = path.join(__dirname, '..', 'uploads', nomearquivo);
        Logmessage(filePath);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Erro ao excluir o arquivo:', err);
                return res.status(500).json({ message: 'Erro interno do servidor ao excluir o arquivo' });
            }

            // Excluir o template do banco de dados
            deleteTemplateFromDatabase(templateId, res);
        });
    } catch (error) {
        console.error('Erro ao consultar o nome do arquivo do template:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


const deleteProductImageById = async (req, res) => {
    try {
        Logmessage("ID da imagem a deletar: " + req.params.product_image_id);
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
        console.error('Erro ao excluir o template do banco de dados:', error); a
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = { getProductImageById, deleteProductImageById, UploadFile, uploadSingleFile, getProductImagesByUserId, deleteTemplateById, getProductImagesByProductId };