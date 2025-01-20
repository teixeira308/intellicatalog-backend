const pool = require('../config/dbConfig');
const {Logmessage} = require( "../helper/Tools");

createOrder = async (req, res) => {
    const orderData = req.body;
    Logmessage("Criar pedido, dados do body: " + JSON.stringify(orderData));

    try {
        const { user_id, total_price } = orderData;

        // Verifica se o usuário existe
        const userExists = await checkUserExists(user_id);
        if (!userExists) {
            return res.status(400).json({ message: 'O usuário fornecido não existe.' });
        }

        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO orders SET ?', orderData);
        connection.release();

        const insertedId = result.insertId;

        Logmessage('Pedido inserido no banco de dados. ID: ' + insertedId);
        
        res.status(201).json({ id: insertedId, ...orderData });
    } catch (error) {
        Logmessage('Erro ao inserir dados do pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Função para verificar se o usuário existe
async function checkUserExists(userId) {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('SELECT id FROM users_catalog WHERE id = ?', [userId]);
        connection.release();

        return result.length > 0;
    } catch (error) {
        console.error('Erro ao verificar a existência do usuário:', error);
        return false;
    }
}

listAllOrders = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { user_id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [user_id]);

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?, ?', [user_id, offset, pageSize]);
        connection.release();

        res.header('X-Total-Count', totalCount[0].total);
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar os pedidos do banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

createOrderItems = async (req, res) => {
    const orderItemsData = req.body; // Espera-se um array de itens do pedido no corpo da requisição
    Logmessage("Criar itens do pedido, dados do body: " + JSON.stringify(orderItemsData));

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // Insere os itens do pedido
        for (const item of orderItemsData) {
            const { order_id, product_id, quantity, unit_price } = item;
            const total_price = quantity * unit_price;

            await connection.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)', [order_id, product_id, quantity, unit_price, total_price]);
        }

        await connection.commit();
        connection.release();

        Logmessage('Itens do pedido inseridos no banco de dados');
        res.status(201).json({ message: 'Itens do pedido criados com sucesso' });
    } catch (error) {
        await connection.rollback();
        Logmessage('Erro ao inserir itens do pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

listOrderItems = async (req, res) => {
    const { order_id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [items] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [order_id]);
        connection.release();

        if (items.length === 0) {
            return res.status(404).json({ message: 'Nenhum item encontrado para o pedido especificado' });
        }

        Logmessage('Itens do pedido recuperados: ' + JSON.stringify(items));
        res.status(200).json(items);
    } catch (error) {
        Logmessage('Erro ao recuperar os itens do pedido: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

alterOrderItem = async (req, res) => {
    const { order_id, product_id } = req.params;
    const newData = req.body; // Novos dados do item do pedido

    try {
        const connection = await pool.getConnection();
        
        const [existingItem] = await connection.query('SELECT * FROM order_items WHERE order_id = ? AND product_id = ?', [order_id, product_id]);
        if (existingItem.length === 0) {
            return res.status(404).json({ message: 'Item do pedido não encontrado' });
        }

        const { quantity, unit_price } = newData;
        const total_price = quantity * unit_price;

        await connection.query('UPDATE order_items SET quantity = ?, unit_price = ?, total_price = ? WHERE order_id = ? AND product_id = ?', [quantity, unit_price, total_price, order_id, product_id]);
        connection.release();

        Logmessage('Item do pedido atualizado: ' + JSON.stringify(newData));
        res.status(200).json({ message: 'Item do pedido atualizado com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar item do pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

deleteOrderItem = async (req, res) => {
    const { order_id, product_id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [existingItem] = await connection.query('SELECT * FROM order_items WHERE order_id = ? AND product_id = ?', [order_id, product_id]);
        if (existingItem.length === 0) {
            return res.status(404).json({ message: 'Item do pedido não encontrado' });
        }

        await connection.query('DELETE FROM order_items WHERE order_id = ? AND product_id = ?', [order_id, product_id]);
        connection.release();

        Logmessage('Item do pedido excluído: ' + order_id + ', ' + product_id);
        res.status(200).json({ message: 'Item do pedido excluído com sucesso' });
    } catch (error) {
        Logmessage('Erro ao excluir item do pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};




module.exports = { createOrder,listAllOrders,createOrderItems,listOrderItems,alterOrderItem,deleteOrderItem}