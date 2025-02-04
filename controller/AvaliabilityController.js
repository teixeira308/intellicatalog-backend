const pool = require('../config/dbConfig.js');
const { Logmessage } = require('../helper/Tools.js');

// Criar disponibilidade
CreateAvaliability = async (req, res) => {
    const data = req.body;
    const userId = req.user.userId;
    const dataWithUserId = {
        ...data,
        user_id: userId
    };

    Logmessage(`[DISPONIBILIDADE] Tentando criar disponibilidade para o usuário ${userId}`);
    Logmessage(`[DISPONIBILIDADE] Dados recebidos: ${JSON.stringify(data, null, 2)}`);

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO availability SET ?', dataWithUserId);
        connection.release();

        Logmessage(`[DISPONIBILIDADE] Disponibilidade criada com sucesso! ID: ${result.insertId}`);
        res.status(201).json({ id: result.insertId, ...data });
    } catch (error) {
        Logmessage(`[ERRO DISPONIBILIDADE] Falha ao criar disponibilidade para o usuário ${userId}`);
        Logmessage(`[ERRO DISPONIBILIDADE] Detalhes do erro: ${error.message}`);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


// Listar todas as disponibilidades
GetAllAvaliability = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 100;
    const userId = req.user.userId;

    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM availability where user_id = ?',[userId]);
        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query('SELECT * FROM availability where user_id = ? LIMIT ?, ?', [userId,offset, pageSize]);
        connection.release();

        res.header('X-Total-Count', totalCount[0].total);
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de disponibilidades do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

// Obter disponibilidade por ID
GetAvaliability = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [availability] = await connection.query('SELECT * FROM availability WHERE id = ?', [id]);
        connection.release();

        if (availability.length === 0) {
            return res.status(404).json({ message: 'Disponibilidade não encontrada' });
        }

        Logmessage('Disponibilidade recuperada do banco de dados:', availability);
        res.status(200).json(availability[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar disponibilidade do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

// Atualizar disponibilidade (apenas os campos informados)
const UpdateAvaliability = async (req, res) => {
    const { id } = req.params; // ID da disponibilidade
    const updates = req.body; // Dados a serem atualizados

    try {
        const connection = await pool.getConnection();

        // Verificar se a disponibilidade existe
        const [existingAvailability] = await connection.query('SELECT * FROM availability WHERE id = ?', [id]);

        if (existingAvailability.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Disponibilidade não encontrada' });
        }

        // Construir query dinamicamente
        const updateFields = [];
        const updateValues = [];

        for (const [field, value] of Object.entries(updates)) {
            updateFields.push(`${field} = ?`);
            updateValues.push(value);
        }

        // Se nenhum campo foi informado, retornar erro
        if (updateFields.length === 0) {
            connection.release();
            return res.status(400).json({ message: 'Nenhum campo para atualizar informado' });
        }

        // Adicionar o ID ao final dos valores
        updateValues.push(id);

        // Executar a query de atualização
        const updateQuery = `UPDATE availability SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.query(updateQuery, updateValues);

        connection.release();

        Logmessage('Dados da disponibilidade atualizados no banco de dados:', { id, ...updates });
        res.status(200).json({ message: 'Disponibilidade atualizada com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar disponibilidade no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


// Deletar disponibilidade
DeleteAvaliability = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [existingAvailability] = await connection.query('SELECT * FROM availability WHERE id = ?', [id]);

        if (existingAvailability.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Disponibilidade não encontrada' });
        }

        await connection.query('DELETE FROM availability WHERE id = ?', [id]);
        connection.release();

        Logmessage('Disponibilidade excluída do banco de dados:', id);
        res.status(200).json({ message: 'Disponibilidade excluída com sucesso', id });
    } catch (error) {
        Logmessage('Erro ao excluir disponibilidade do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

module.exports = {
    DeleteAvaliability,
    UpdateAvaliability,
    GetAvaliability,
    GetAllAvaliability,
    CreateAvaliability
};
