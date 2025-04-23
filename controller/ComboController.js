const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

const createCombo = async (req, res) => {
    const comboData = req.body;
    Logmessage("Criar combo, dados do body: " + JSON.stringify(comboData));

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO combos SET ?', comboData);
        connection.release();

        const insertedId = result.insertId;
        Logmessage('Dados do combo inseridos no banco de dados. ID: ' + insertedId);
        res.status(201).json({ id: insertedId, ...comboData });
    } catch (error) {
        Logmessage('Erro ao inserir dados do combo no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const listAllCombos = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM combos');

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query('SELECT * FROM combos LIMIT ?, ?', [offset, pageSize]);
        connection.release();

        Logmessage('Lista de combos recuperada do banco de dados: ' + JSON.stringify(results));

        res.header('X-Total-Count', totalCount[0].total);
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de combos do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const alterCombo = async (req, res) => {
    const { id } = req.params;
    const newData = req.body;

    try {
        const [existingCombo] = await pool.query('SELECT * FROM combos WHERE id = ?', [id]);
        if (existingCombo.length === 0) {
            return res.status(404).json({ message: 'Combo não encontrado' });
        }

        const connection = await pool.getConnection();
        await connection.query('UPDATE combos SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage('Dados do combo ID: ' + id + ' atualizados no banco de dados: ' + JSON.stringify(newData));
        res.status(200).json({ message: 'Dados do combo atualizados com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar dados do combo no banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const deleteCombo = async (req, res) => {
    const { id } = req.params;
    Logmessage("Deletando Combo: ", id);

    try {
        const [existingCombo] = await pool.query('SELECT * FROM combos WHERE status="ativo" AND id = ?', [id]);
        if (existingCombo.length === 0) {
            return res.status(404).json({ message: 'Combo não encontrado' });
        }

        const connection = await pool.getConnection();
        await connection.query('DELETE FROM combos WHERE id = ?', [id]);
        connection.release();

        Logmessage('Combo excluído do banco de dados', id);
        res.status(200).json({ message: 'Combo excluído com sucesso', id });
    } catch (error) {
        Logmessage('Erro ao excluir combo do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const getCombo = async (req, res) => {
    const { id } = req.params;
    Logmessage("Consulta Combo: " + id);

    try {
        const connection = await pool.getConnection();
        const [combo] = await connection.query('SELECT * FROM combos WHERE status="ativo" AND id = ?', [id]);
        connection.release();

        if (combo.length === 0) {
            return res.status(404).json({ message: 'Combo não encontrado' });
        }

        Logmessage('Combo recuperado do banco de dados: ' + JSON.stringify(combo));
        res.status(200).json(combo[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar o combo do banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


module.exports = {
    createCombo,
    listAllCombos,
    alterCombo,
    deleteCombo,
    getCombo
};
