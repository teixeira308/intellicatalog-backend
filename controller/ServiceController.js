const pool = require('../config/dbConfig.js');
const { Logmessage } = require('../helper/Tools.js');

const createService = async (req, res) => {
    const serviceData = req.body;
    const userId = req.user.userId; // Obtendo o userId do request
    Logmessage("Criar serviço, dados do body:", serviceData);

    try {
        const connection = await pool.getConnection();
        
        // Incluindo o userId no objeto de dados a ser inserido
        const serviceWithUserId = { ...serviceData, user_id: userId };

        const [result] = await connection.query('INSERT INTO services SET ?', serviceWithUserId);
        connection.release();

        Logmessage('Dados do serviço inseridos no banco de dados:', serviceWithUserId);
        res.status(201).json({ id: result.insertId, ...serviceWithUserId });
    } catch (error) {
        // Melhorando o log de erro
        Logmessage('Erro ao inserir serviço no banco de dados:', {
            message: error.message, // Mensagem do erro
            stack: error.stack, // Stack trace para diagnóstico
            serviceData: serviceData, // Dados do body que causaram o erro
        });
        res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
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

// Atualizar um serviço (apenas os campos informados)
const UpdateService = async (req, res) => {
    const { id } = req.params; // ID do serviço
    const updates = req.body; // Dados a serem atualizados

    Logmessage('Dados para atualização:', updates);

    try {
        const connection = await pool.getConnection();

        // Itera sobre o objeto `updates` para pegar o campo e o valor
        const [field, value] = Object.entries(updates)[0]; 

        // Executar a query de atualização
        const updateQuery = `UPDATE services SET ${field} = ? WHERE id = ?`;
        const [result] = await connection.query(updateQuery, [value, id]);

        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Serviço não encontrado ou nada foi alterado' });
        }

        Logmessage('Dados do serviço atualizados no banco de dados:', { id, field, value });
        res.status(200).json({ message: 'Serviço atualizado com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar serviço no banco de dados: ' + error);
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
            return res.status(404).json({ message: 'DeleteService:Serviço não encontrado' });
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
            return res.status(404).json({ message: 'GetService: Serviço não encontrado' });
        }

        Logmessage('Serviço recuperado do banco de dados:', service);
        res.status(200).json(service[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar serviço do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Obter serviços por UserId via query string
const GetServiceByUserId = async (req, res) => {
    const { user: userId } = req.query; // Parâmetro de consulta (query string)

    if (!userId) {
        return res.status(400).json({ message: 'O parâmetro "user" é obrigatório' });
    }

    try {
        const connection = await pool.getConnection();

        // Query para buscar serviços por user_id
        const [services] = await connection.query('SELECT * FROM services WHERE user_id = ? ORDER BY servico_order', [userId]);
        connection.release();

        if (services.length === 0) {
            return res.status(404).json({ message: 'Serviços não encontrados para este usuário' });
        }

        Logmessage('Serviços recuperados do banco de dados:', services);
        res.status(200).json(services);
    } catch (error) {
       Logmessage('Erro ao consultar serviço no banco de dados:', {
            message: error.message, // Mensagem do erro
            stack: error.stack, // Stack trace para diagnóstico
        });
        res.status(500).json({ message: 'Erro consultar do servidor', error: error.message });
    }
};

const reorderServices = async (req, res) => {
    Logmessage('entrou');
    const { services } = req.body; // Espera-se que o corpo contenha um array de categorias
    Logmessage(services);
 
    try {
        const connection = await pool.getConnection();

        // Usar uma transação para garantir que todas as atualizações sejam feitas ou nenhuma delas
        await connection.beginTransaction();

        // Atualizar a ordem das categorias
        for (const service of services) {
            await connection.query('UPDATE services SET servico_order = ? WHERE id = ?', [service.servico_order, service.id]);
        }

        // Se tudo correr bem, confirma a transação
        await connection.commit();
        connection.release();

        Logmessage('Ordem dos serviços atualizada com sucesso');
        res.status(200).json({ message: 'Ordem dos serviços atualizada com sucesso.' });
    } catch (error) {
        // Se ocorrer um erro, reverte a transação
        await connection.rollback();
        Logmessage('Erro ao atualizar a ordem dos serviços:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


module.exports = {
    createService,
    UpdateService,
    DeleteService,
    GetService,
    GetServiceByUserId,
    reorderServices
};
