const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

const createCatalogoItem = async (req, res) => {
    const item = req.body;
    Logmessage("Criar item no catálogo: " + JSON.stringify(item));

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO catalogo_ordem SET ?', item);
        connection.release();

        const insertedId = result.insertId;
        Logmessage('Item do catálogo inserido. ID: ' + insertedId);
        res.status(201).json({ id: insertedId, ...item });
    } catch (error) {
        Logmessage('Erro ao inserir item no catálogo: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const listCatalogo = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [items] = await connection.query(`
            SELECT co.*, 
                   CASE WHEN co.tipo = 'combo' THEN c.titulo ELSE p.titulo END AS titulo
            FROM catalogo_ordem co
            LEFT JOIN combos c ON co.tipo = 'combo' AND co.referencia_id = c.id
            LEFT JOIN products p ON co.tipo = 'produto' AND co.referencia_id = p.id
            WHERE co.status = 'ativo'
            ORDER BY co.ordem ASC
        `);
        connection.release();

        Logmessage("Itens do catálogo recuperados: " + JSON.stringify(items));
        res.status(200).json(items);
    } catch (error) {
        Logmessage('Erro ao listar itens do catálogo: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const updateCatalogoItem = async (req, res) => {
    const { id } = req.params;
    const newData = req.body;

    try {
        const [existing] = await pool.query('SELECT * FROM catalogo_ordem WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Item não encontrado' });
        }

        const connection = await pool.getConnection();
        await connection.query('UPDATE catalogo_ordem SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage(`Item do catálogo ID ${id} atualizado: ` + JSON.stringify(newData));
        res.status(200).json({ message: 'Item atualizado com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar item do catálogo: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const deleteCatalogoItem = async (req, res) => {
    const { id } = req.params;
    Logmessage("Excluindo item do catálogo ID: " + id);

    try {
        const [existing] = await pool.query('SELECT * FROM catalogo_ordem WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Item não encontrado' });
        }

        const connection = await pool.getConnection();
        await connection.query('DELETE FROM catalogo_ordem WHERE id = ?', [id]);
        connection.release();

        Logmessage("Item excluído do catálogo ID: " + id);
        res.status(200).json({ message: 'Item excluído com sucesso', id });
    } catch (error) {
        Logmessage('Erro ao excluir item do catálogo: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const reorderCatalogo = async (req, res) => {
    const itens = req.body; // array de objetos: [{ id, ordem }]
    if (!Array.isArray(itens)) {
        return res.status(400).json({ message: "Dados inválidos. Esperado um array de objetos." });
    }

    try {
        const connection = await pool.getConnection();
        const updatePromises = itens.map(item => {
            return connection.query('UPDATE catalogo_ordem SET ordem = ? WHERE id = ?', [item.ordem, item.id]);
        });

        await Promise.all(updatePromises);
        connection.release();

        res.status(200).json({ message: "Ordem atualizada com sucesso" });
    } catch (error) {
        Logmessage("Erro ao reordenar catálogo: " + error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
};

module.exports = {
    createCatalogoItem,
    listCatalogo,
    updateCatalogoItem,
    deleteCatalogoItem,
    reorderCatalogo
};
