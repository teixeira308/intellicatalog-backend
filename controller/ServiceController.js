const pool = require('../config/dbConfig.js');
const { Logmessage } = require('../helper/Tools.js');

// Criar um serviço
const createService = async (req, res) => {
    const serviceData = req.body;
    Logmessage("Criar serviço, dados do body:", serviceData);

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO services SET ?', serviceData);
        connection.release();

        Logmessage('Dados do serviço inseridos no banco de dados:', serviceData);
        res.status(201).json({ id: result.insertId, ...serviceData });
    } catch (error) {
        Logmessage('Erro ao inserir serviço no banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Listar todos os serviços
const GetAllServices = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM services');
        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query('SELECT * FROM services LIMIT ?, ?', [offset, pageSize]);
        connection.release();

        res.header('X-Total-Count', totalCount[0].total);
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de serviços do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Atualizar um serviço
const UpdateService = async (req, res) => {
    const { id } = req.params; // ID do serviço
    const updatedData = req.body;

    try {
        const connection = await pool.getConnection();
        const [existingService] = await connection.query('SELECT * FROM services WHERE id = ?', [id]);

        if (existingService.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }

        await connection.query('UPDATE services SET ? WHERE id = ?', [updatedData, id]);
        connection.release();

        Logmessage('Dados do serviço atualizados no banco de dados:', updatedData);
        res.status(200).json({ message: 'Serviço atualizado com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar serviço no banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Deletar um serviço
const DeleteService = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [existingService] = await connection.query('SELECT * FROM services WHERE id = ?', [id]);

        if (existingService.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }

        await connection.query('DELETE FROM services WHERE id = ?', [id]);
        connection.release();

        Logmessage('Serviço excluído do banco de dados:', id);
        res.status(200).json({ message: 'Serviço excluído com sucesso', id });
    } catch (error) {
        Logmessage('Erro ao excluir serviço do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Obter um serviço por ID
const GetService = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [service] = await connection.query('SELECT * FROM services WHERE id = ?', [id]);
        connection.release();

        if (service.length === 0) {
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }

        Logmessage('Serviço recuperado do banco de dados:', service);
        res.status(200).json(service[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar serviço do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = {
    createService,
    GetAllServices,
    UpdateService,
    DeleteService,
    GetService
};
