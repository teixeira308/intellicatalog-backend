const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

const createOpcao = async (req, res) => {
    const opcaoData = { ...req.body };

    // Serializa o campo 'valores' se ele existir e for um array/objeto
    if (opcaoData.valores) {
        try {
            opcaoData.valores = JSON.stringify(opcaoData.valores);
        } catch (err) {
            return res.status(400).json({ message: 'Erro ao serializar o campo "valores". Verifique o formato.' });
        }
    }

    Logmessage("Criar opção de personalização: " + JSON.stringify(opcaoData));

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO opcoes_personalizacao SET ?', opcaoData);
        connection.release();

        const insertedId = result.insertId;
        Logmessage('Opção inserida com sucesso. ID: ' + insertedId);
        res.status(201).json({ id: insertedId, ...req.body }); // devolve o original (sem JSON string)
    } catch (error) {
        Logmessage('Erro ao criar opção: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


const listAllOpcoes = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [opcoes] = await connection.query('SELECT * FROM opcoes_personalizacao WHERE status = "ativo"');
        connection.release();

        Logmessage('Listando todas as opções de personalização: ' + JSON.stringify(opcoes));
        res.status(200).json(opcoes);
    } catch (error) {
        Logmessage('Erro ao listar opções: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const getOpcao = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('SELECT * FROM opcoes_personalizacao WHERE id = ?', [id]);
        connection.release();

        if (result.length === 0) {
            return res.status(404).json({ message: 'Opção não encontrada' });
        }

        Logmessage('Opção encontrada: ' + JSON.stringify(result[0]));
        res.status(200).json(result[0]);
    } catch (error) {
        Logmessage('Erro ao buscar opção: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const alterOpcao = async (req, res) => {
    const { id } = req.params;
    const newData = req.body;

    try {
        const connection = await pool.getConnection();
        const [existing] = await connection.query('SELECT * FROM opcoes_personalizacao WHERE id = ?', [id]);

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Opção não encontrada' });
        }

        await connection.query('UPDATE opcoes_personalizacao SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage(`Opção ID ${id} atualizada: ` + JSON.stringify(newData));
        res.status(200).json({ message: 'Opção atualizada com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar opção: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const deleteOpcao = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [existing] = await connection.query('SELECT * FROM opcoes_personalizacao WHERE id = ?', [id]);

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Opção não encontrada' });
        }

        await connection.query('UPDATE opcoes_personalizacao SET status = "inativo" WHERE id = ?', [id]);
        connection.release();

        Logmessage(`Opção ID ${id} marcada como inativa.`);
        res.status(200).json({ message: 'Opção excluída (inativada)' });
    } catch (error) {
        Logmessage('Erro ao excluir opção: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = {
    createOpcao,
    listAllOpcoes,
    getOpcao,
    alterOpcao,
    deleteOpcao
};
