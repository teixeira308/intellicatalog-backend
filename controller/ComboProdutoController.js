const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

const addProdutoAoCombo = async (req, res) => {
    const { combo_id, product_id } = req.body;
    Logmessage(`Adicionando produto ${product_id} ao combo ${combo_id}`);

    try {
        const connection = await pool.getConnection();
        await connection.query('INSERT INTO combo_produtos (combo_id, product_id,tipo,min,max) VALUES (?, ?,?,?,?)', [combo_id, product_id]);
        connection.release();

        res.status(201).json({ message: 'Produto adicionado ao combo com sucesso.' });
    } catch (error) {
        Logmessage('Erro ao adicionar produto ao combo: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const removerProdutoDoCombo = async (req, res) => {
    const { combo_id, product_id } = req.body;
    Logmessage(`Removendo produto ${product_id} do combo ${combo_id}`);

    try {
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM combo_produtos WHERE combo_id = ? AND product_id = ?', [combo_id, product_id]);
        connection.release();

        res.status(200).json({ message: 'Produto removido do combo com sucesso.' });
    } catch (error) {
        Logmessage('Erro ao remover produto do combo: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const listarProdutosDoCombo = async (req, res) => {
    const { combo_id } = req.params;
    Logmessage(`Listando produtos do combo ${combo_id}`);

    try {
        const connection = await pool.getConnection();
        const [produtos] = await connection.query(`
            SELECT p.*
            FROM combo_produtos cp
            JOIN products p ON cp.product_id = p.id
            WHERE cp.combo_id = ?
        `, [combo_id]);
        connection.release();

        res.status(200).json(produtos);
    } catch (error) {
        Logmessage('Erro ao listar produtos do combo: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = {
    addProdutoAoCombo,
    removerProdutoDoCombo,
    listarProdutosDoCombo
};
