const express = require('express');
const multer = require('multer');
const pool = require('../config/dbConfig');
const fs = require('fs');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require('path');

const { Logmessage } = require("../helper/Tools");



const getStoreImageByUserId = async (req, res) => {
    const userId = req.params.userid;
    try {
        // Consultar templates no banco de dados com base no ID do usuário
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM store_images WHERE user_id = ?', [userId]);
        connection.release();

        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar store images por ID do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Diretório onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        Logmessage("Upload imagem store: " + req.user.userId + " - store_id : " + req.params.store_id)


        // Obter a data e hora atual
        const currentDateTime = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').replace(/\..+/, '');

        // Obter o ID do usuário
        const userid = req.user.userId; // Supondo que o ID do usuário está disponível na requisição

        // Obter o nome do arquivo original
        const originalFileName = file.originalname;
        const { store_id } = req.params;

        // Gerar o nome do arquivo usando a data e hora atual, o ID do usuário e o nome do arquivo original
        const fileName = `${userid}-${store_id}-${currentDateTime}-${originalFileName}`;

        cb(null, fileName); // Nome do arquivo salvo
    }
});

const upload = multer({ storage: storage });

// Middleware para processar o upload de um único arquivo
const uploadSingleFile = upload.single('file');

const UploadFile = async (req, res) => {
    const storeImageData = req.body;
    Logmessage("Criar store image, dados do body: " + JSON.stringify(storeImageData));
    Logmessage("store_id: " + req.params.store_id);
    Logmessage("User_id: " + JSON.stringify(req.user.userId));
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo foi enviado' });
    }

    const { description } = req.body;
    const { userId } = req.user;
    const { store_id } = req.params;
    const nomearquivo = req.file.filename;
    const tamanho = req.file.size;
    const tipo = req.file.originalname.split('.').pop().toLowerCase()

    try {
        // Gravar os detalhes do arquivo no banco de dados
        const connection = await pool.getConnection();
        const query = 'INSERT INTO store_images (description, nomearquivo,tipo,tamanho,store_id,user_id) VALUES (?, ?, ?, ?,?,?)';
        const values = [description, nomearquivo, tipo, tamanho, store_id, userId];
        const [result] = await connection.query(query, values);
        const insertedId = result.insertId; // Aqui está o ID gerado automaticamente pelo MySQL

        // Buscar os dados recém-inseridos no banco de dados
        const [rows] = await connection.query('SELECT * FROM store_images WHERE id = ?', [insertedId]);
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

const deleteStoreImageById = async (req, res) => {
    const store_image_id = req.params.store_image_id;

    try {
        // Consultar o nome do arquivo do template no banco de dados
        const connection = await pool.getConnection();
        const query = 'SELECT nomearquivo FROM store_images WHERE id = ?';
        const [rows] = await connection.query(query, [store_image_id]);
        connection.release();

        if (!rows.length) {
            return res.status(404).json({ message: 'Template não encontrado' });
        }

        const { nomearquivo } = rows[0];

        // Excluir o arquivo da pasta
        const filePath = path.join(__dirname, '..', 'uploads', nomearquivo);
        Logmessage("Arquivo pra deletar: " + filePath);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Erro ao excluir o arquivo:', err);
                return res.status(500).json({ message: 'Erro interno do servidor ao excluir o arquivo' });
            }

            // Excluir o template do banco de dados
            deleteStoreImageFromDatabase(store_image_id, req, res);
        });
    } catch (error) {
        console.error('Erro ao consultar o nome do arquivo do template:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const deleteStoreImageFromDatabase = async (store_image_id, req, res) => {
    const userId = req.user.userId;
    try {
        // Excluir o template do banco de dados
        const connection = await pool.getConnection();
        const query = 'DELETE FROM store_images WHERE user_id= ? AND id = ?';
        const [result] = await connection.query(query, [userId, store_image_id]);
        connection.release();

        // Verificar se o template foi excluído com sucesso
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Template não encontrado' });
        }

        // Retornar uma resposta de sucesso
        res.setHeader("Access-Control-Allow-Origin", "*")
            .setHeader("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token")
            .setHeader("Access-Control-Allow-Methods", "*")
            .status(200).json({ message: 'Store Image excluído com sucesso', deletedTemplateId: store_image_id });
    } catch (error) {
        console.error('Erro ao excluir o template do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const getStoreImagesByStoreId = async (req, res) => {
    const { store_id } = req.params; // Acessar o parâmetro de caminho
    const { store_image_id } = req.params; // Acessar o parâmetro de caminho

    try {

        // Consultar no banco de dados se o usuário possui acesso ao documento
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM store_images WHERE store_id = ? AND id = ?', [store_id, store_image_id]);
        connection.release();

        if (!rows.length) {
            return res.status(403).json({ message: 'Usuário não tem acesso a este documento' });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Erro ao consultar a imagem:', error);
        res.status(500).json({ message: 'Erro ao consultar a imagem' });
    }

};

const getStoreImageDownload = async (req, res) => {
    const { store_id } = req.params; // Acessar o parâmetro de caminho
    const { arquivo } = req.query; // Acessar o parâmetro de consulta
    const user_id = req.user.userId;
    try {
        // Verificar se o documento existe na pasta de uploads e se pertence ao usuário
        const filePath = path.join(__dirname, '..', 'uploads', arquivo);
        console.log(filePath)
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Documento não encontrado' });
        }

        // Consultar no banco de dados se o usuário possui acesso ao documento
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM store_images WHERE  user_id = ? AND store_id = ? AND nomearquivo = ?', [user_id,store_id, arquivo]);
        connection.release();

        if (!rows.length) {
            return res.status(403).json({ message: 'Usuário não tem acesso a essa imagem' });
        }

        // Se tudo estiver correto, enviar o arquivo para download
        res.download(filePath);
    } catch (error) {
        console.error('Erro ao baixar o arquivo:', error);
        res.status(500).json({ message: 'Erro ao baixar o arquivo' });
    }
};

module.exports = { getStoreImageByUserId, UploadFile, uploadSingleFile, deleteStoreImageById, getStoreImagesByStoreId, getStoreImageDownload };