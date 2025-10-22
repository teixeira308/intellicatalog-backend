const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

// Criar subitem (combo/personalização)
const createSubItem = async (req, res) => {
    const data = req.body;
    Logmessage("Criar subitem, dados do body: " + JSON.stringify(data));

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO product_subitems SET ?', data);
        connection.release();

        const insertedId = result.insertId;
        Logmessage('Subitem inserido no banco de dados. ID: ' + insertedId);
        res.status(201).json({ id: insertedId, ...data });
    } catch (error) {
        Logmessage('Erro ao inserir subitem no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Listar subitens (com opção de filtrar por produto pai)
const listSubItems = async (req, res) => {
    const parentId = req.query.parent_product_id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    try {
        const connection = await pool.getConnection();

        let totalQuery = 'SELECT COUNT(*) as total FROM product_subitems';
        let selectQuery = 'SELECT * FROM product_subitems';
        const params = [];

        if (parentId) {
            totalQuery += ' WHERE parent_product_id = ?';
            selectQuery += ' WHERE parent_product_id = ?';
            params.push(parentId);
        }

        selectQuery += ' ORDER BY group_name, item_order LIMIT ?, ?';
        params.push(offset, pageSize);

        const [totalCount] = await connection.query(totalQuery, parentId ? [parentId] : []);
        const [results] = await connection.query(selectQuery, params);
        connection.release();

        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        res.header('X-Total-Count', totalCount[0].total);
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao listar subitens: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Buscar subitem por ID
const getSubItem = async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM product_subitems WHERE id = ?', [id]);
        connection.release();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subitem não encontrado' });
        }

        Logmessage('Subitem recuperado: ' + JSON.stringify(rows[0]));
        res.status(200).json(rows[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar subitem: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Atualizar subitem
const updateSubItem = async (req, res) => {
    const { id } = req.params;
    const newData = req.body;

    try {
        const [existing] = await pool.query('SELECT * FROM product_subitems WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Subitem não encontrado' });
        }

        const connection = await pool.getConnection();
        await connection.query('UPDATE product_subitems SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage('Subitem atualizado. ID ' + id + ' -> ' + JSON.stringify(newData));
        res.status(200).json({ message: 'Subitem atualizado com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar subitem: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Deletar subitem
const deleteSubItem = async (req, res) => {
    const { id } = req.params;
    Logmessage("Deletando subitem ID: " + id);

    try {
        const [existing] = await pool.query('SELECT * FROM product_subitems WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Subitem não encontrado' });
        }

        const connection = await pool.getConnection();
        await connection.query('DELETE FROM product_subitems WHERE id = ?', [id]);
        connection.release();

        Logmessage('Subitem excluído do banco de dados. ID: ' + id);
        res.status(200).json({ message: 'Subitem excluído com sucesso', id });
    } catch (error) {
        Logmessage('Erro ao excluir subitem: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Reordenar subitens (ex: drag & drop no frontend)
const reorderSubItems = async (req, res) => {
    const updates = req.body; // array: [{ id: 3, item_order: 1 }, { id: 5, item_order: 2 }]

    if (!Array.isArray(updates)) {
        return res.status(400).json({ message: 'Formato inválido. Esperado array de objetos com id e item_order.' });
    }

    try {
        const connection = await pool.getConnection();

        const promises = updates.map(item =>
            connection.query('UPDATE product_subitems SET item_order = ? WHERE id = ?', [item.item_order, item.id])
        );

        await Promise.all(promises);
        connection.release();

        Logmessage('Ordem dos subitens atualizada: ' + JSON.stringify(updates));
        res.status(200).json({ message: 'Ordem atualizada com sucesso' });
    } catch (error) {
        Logmessage('Erro ao reordenar subitens: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = {
    createSubItem,
    listSubItems,
    getSubItem,
    updateSubItem,
    deleteSubItem,
    reorderSubItems
};
