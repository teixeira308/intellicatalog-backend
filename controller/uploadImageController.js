const express = require('express');
const multer = require('multer');
const pool = require('../config/dbConfig');
const fs = require('fs');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater"); 
const path = require('path');

const {Logmessage} = require( "../helper/Tools");

getProductImageById = async (req, res) => {
    const { product_id } = req.params; // Acessar o parâmetro de caminho
    const { arquivo } = req.query; // Acessar o parâmetro de consulta

    try {
        
        // Verificar se o documento existe na pasta de uploads e se pertence ao usuário
        const filePath = path.join(__dirname, '..', 'uploads', arquivo);
        console.log(filePath)
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Documento não encontrado' });
        }

        // Consultar no banco de dados se o usuário possui acesso ao documento
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
        cb(null, 'uploads/'); // Diretório onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        Logmessage("Upload imagem usuario: "+req.user.userId+" - produto: "+req.params.product_id)
        
        
        // Obter a data e hora atual
        const currentDateTime = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').replace(/\..+/, '');
        
        // Obter o ID do usuário
        const userid = req.user.userId; // Supondo que o ID do usuário está disponível na requisição

        // Obter o nome do arquivo original
        const originalFileName = file.originalname;
        const { product_id } = req.params;

        // Gerar o nome do arquivo usando a data e hora atual, o ID do usuário e o nome do arquivo original
        const fileName = `${userid}-${product_id}-${currentDateTime}-${originalFileName}`;

        cb(null, fileName); // Nome do arquivo salvo
    }
});


const upload = multer({ storage: storage });

// Middleware para processar o upload de um único arquivo
const uploadSingleFile = upload.single('file');

const UploadFile = async (req, res) => {
    const productImageData = req.body;
    Logmessage("Criar produto, dados do body: "+ JSON.stringify(productImageData));
    Logmessage("Product_id: "+req.params.product_id);
    Logmessage("User_id: "+JSON.stringify(req.user.userId));
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo foi enviado' });
    }

    const { description } = req.body;
    const { userId } = req.user;
    const {  product_id } = req.params;
    const nomearquivo = req.file.filename;
    const tamanho = req.file.size; 
    const tipo = req.file.originalname.split('.').pop().toLowerCase()

    try {
        // Gravar os detalhes do arquivo no banco de dados
        const connection = await pool.getConnection();
        const query = 'INSERT INTO products_images (description, nomearquivo,tipo,tamanho,product_id,user_id) VALUES (?, ?, ?, ?,?,?)';
        const values = [description, nomearquivo, tipo, tamanho, product_id,userId];
        const [result] = await connection.query(query, values);

        
        
        const insertedId = result.insertId; // Aqui está o ID gerado automaticamente pelo MySQL

        // Buscar os dados recém-inseridos no banco de dados
        const [rows] = await connection.query('SELECT * FROM products_images WHERE id = ?', [insertedId]);
        connection.release();

        if (!rows.length) {
            return res.status(404).json({ message: 'Detalhes do arquivo não encontrados' });
        }

        // Retornar os dados do arquivo junto com a mensagem de sucesso
        const insertedFileDetails = rows[0];
        res.status(200).json({ message: 'Arquivo enviado com sucesso', fileDetails: insertedFileDetails });
    } catch (error) {
        console.error('Erro ao inserir detalhes do arquivo no banco de dados:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const getProductImagesByUserId = async (req, res) => {
    const userId = req.params.userid; 
    try {
        // Consultar templates no banco de dados com base no ID do usuário
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM products_images WHERE user_id = ?', [userId]);
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

module.exports = { getProductImageById,deleteProductImageById, UploadFile, uploadSingleFile, getProductImagesByUserId,deleteTemplateById ,getProductImagesByProductId};