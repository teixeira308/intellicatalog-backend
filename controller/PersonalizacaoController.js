const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

// Criar personalização
const createPersonalizacao = async (req, res) => {
    const { order_id, produto_id, opcao_id, valor_selecionado } = req.body;
    const personalizacaoData = {
        order_id,
        produto_id,
        opcao_id,
        valor_selecionado: JSON.stringify(valor_selecionado), // Garantir que valor_selecionado seja armazenado como JSON
    };

    Logmessage("Criar personalização: " + JSON.stringify(personalizacaoData));

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO personalizacoes SET ?', personalizacaoData);
        connection.release();

        const insertedId = result.insertId;
        Logmessage('Personalização criada com sucesso. ID: ' + insertedId);
        res.status(201).json({ id: insertedId, ...personalizacaoData });
    } catch (error) {
        Logmessage('Erro ao criar personalização: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Listar todas as personalizações de um pedido
const listPersonalizacoesByOrder = async (req, res) => {
    const { order_id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [personalizacoes] = await connection.query('SELECT * FROM personalizacoes WHERE order_id = ?', [order_id]);
        connection.release();

        if (personalizacoes.length === 0) {
            return res.status(404).json({ message: 'Nenhuma personalização encontrada para este pedido' });
        }

        Logmessage('Personalizações recuperadas para o pedido ID ' + order_id + ': ' + JSON.stringify(personalizacoes));
        res.status(200).json(personalizacoes);
    } catch (error) {
        Logmessage('Erro ao listar personalizações do pedido: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Alterar personalização (por exemplo, atualizar o valor selecionado)
const alterPersonalizacao = async (req, res) => {
    const { id } = req.params;
    const { valor_selecionado } = req.body;

    try {
        const connection = await pool.getConnection();
        const [existing] = await connection.query('SELECT * FROM personalizacoes WHERE id = ?', [id]);

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Personalização não encontrada' });
        }

        const updatedData = {
            valor_selecionado: JSON.stringify(valor_selecionado),
        };

        await connection.query('UPDATE personalizacoes SET ? WHERE id = ?', [updatedData, id]);
        connection.release();

        Logmessage('Personalização ID ' + id + ' atualizada com sucesso');
        res.status(200).json({ message: 'Personalização atualizada com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar personalização: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Deletar personalização
const deletePersonalizacao = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [existing] = await connection.query('SELECT * FROM personalizacoes WHERE id = ?', [id]);

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Personalização não encontrada' });
        }

        await connection.query('DELETE FROM personalizacoes WHERE id = ?', [id]);
        connection.release();

        Logmessage('Personalização ID ' + id + ' deletada com sucesso');
        res.status(200).json({ message: 'Personalização excluída com sucesso' });
    } catch (error) {
        Logmessage('Erro ao deletar personalização: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Obter uma personalização específica
const getPersonalizacao = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [personalizacao] = await connection.query('SELECT * FROM personalizacoes WHERE id = ?', [id]);
        connection.release();

        if (personalizacao.length === 0) {
            return res.status(404).json({ message: 'Personalização não encontrada' });
        }

        Logmessage('Personalização recuperada com sucesso: ' + JSON.stringify(personalizacao[0]));
        res.status(200).json(personalizacao[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar personalização: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = {
    createPersonalizacao,
    listPersonalizacoesByOrder,
    alterPersonalizacao,
    deletePersonalizacao,
    getPersonalizacao
};
