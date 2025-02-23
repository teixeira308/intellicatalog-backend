const express = require('express');
const multer = require('multer');
const pool = require('../config/dbConfig');
const fs = require('fs');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require('path');

const { v4: uuidv4 } = require('uuid'); // Importando a função para gerar UUID

//heif convert
const sizeOf = require('image-size');
const { execSync } = require('child_process');

const { Logmessage } = require("../helper/Tools");

const dotenv = require('dotenv');

dotenv.config();



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
    const storeImageData = req.body;
    Logmessage("Criar store image, dados do body: " + JSON.stringify(storeImageData));
    Logmessage("store_id: " + req.params.store_id);
    Logmessage("User_id: " + JSON.stringify(req.user.userId));
    if (!req.file) {
        Logmessage('Nenhum arquivo foi enviado na requisição.');
        return res.status(400).json({ message: 'Nenhum arquivo foi enviado' });
    }


    const { userId } = req.user;
    const { store_id } = req.params;
    let nomearquivo = req.file.filename;
    const tamanho = req.file.size;
    let tipo = req.file.originalname.split('.').pop().toLowerCase()

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
        if (tipo === 'heif' || tipo === 'heic') {
            const convertedFilePath = filePath.replace('.heif', '.jpg').replace('.heic', '.jpg');
            execSync(`convert ${filePath} ${convertedFilePath}`);
            Logmessage(`Imagem HEIF convertida para JPEG: ${convertedFilePath}`);

            fs.renameSync(convertedFilePath, filePath);  // Substituir o arquivo original com o convertido
            nomearquivo = nomearquivo.replace('.heif', '.jpg').replace('.heic', '.jpg');  // Atualizar o nome do arquivo
            tipo = 'jpeg';  // Atualizar o tipo para 'jpeg' após conversão
        }
        // Gravar os detalhes do arquivo no banco de dados
        const connection = await pool.getConnection();
        const query = 'INSERT INTO store_images ( nomearquivo,tipo,tamanho,store_id,user_id) VALUES (?, ?, ?, ?,?)';
        const values = [nomearquivo, tipo, tamanho, store_id, userId];
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
        deleteStoreImageFromDatabase(store_image_id, req, res);
         
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
    const user_id = req.user.userId;
    try {

        // Consultar no banco de dados se o usuário possui acesso ao documento
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM store_images WHERE user_id = ? AND store_id = ? AND id = ?', [user_id, store_id, store_image_id]);
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
        //console.log(filePath)
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Documento não encontrado' });
        }

        // Consultar no banco de dados se o usuário possui acesso ao documento
        let query = ""
        let parametros = []
        if (user_id == process.env.ADMIN_USER) {
            console.log("entrou admin download")
            query = 'SELECT * FROM store_images WHERE  store_id = ? AND nomearquivo = ?'
            parametros = [store_id, arquivo]
        } else {
            query = 'SELECT * FROM store_images WHERE  user_id = ? AND store_id = ? AND nomearquivo = ?'
            parametros = [user_id, store_id, arquivo]
        }
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query, parametros);
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
const getStoreImagesByStore = async (req, res) => {
    const { store_id } = req.params; // Acessar o parâmetro de caminho
    const user_id = req.user.userId;
    console.log(user_id);

    try {

        // Consultar no banco de dados se o usuário possui acesso ao documento
        const connection = await pool.getConnection();
        let query = "";
        if (user_id == process.env.ADMIN_USER) {

            query = 'SELECT * FROM store_images WHERE store_id = ?'
        }
        else {

            query = 'SELECT * FROM store_images WHERE store_id = ? AND user_id = ?'

        }
        const [rows] = await connection.query(query, [store_id, user_id]);
        connection.release();

        if (!rows.length) {
            return res.status(403).json({ message: 'Usuário não tem acesso a este documento' });
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error('Erro ao consultar a imagem:', error);
        res.status(500).json({ message: 'Erro ao consultar a imagem' });
    }

};

module.exports = { getStoreImageByUserId, UploadFile, uploadSingleFile, deleteStoreImageById, getStoreImagesByStoreId, getStoreImageDownload, getStoreImagesByStore };