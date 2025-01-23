
const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");


createOrder = async (req, res) => {
    const orderData = req.body;
    const { items, ...orderDetails } = orderData;

    Logmessage("Criar pedido, dados do body: " + JSON.stringify(orderData));

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Inserir a ordem
        const [orderResult] = await connection.query('INSERT INTO orders SET ?', orderDetails);
        const orderId = orderResult.insertId;
        Logmessage('Pedido inserido no banco de dados. ID: ' + orderId);

        // Inserir cada item individualmente
        for (const item of items) {
            const { product_id, quantity, unit_price, total_price } = item;
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                [orderId, product_id, quantity, unit_price, total_price]
            );
        }

        await connection.commit();
        connection.release();

        Logmessage('Itens do pedido inseridos no banco de dados');
        res.status(201).json({ id: orderId, ...orderDetails, items });
    } catch (error) {
        await connection.rollback();
        connection.release();
        Logmessage('Erro ao inserir dados do pedido e itens no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

getOrderById = async (req, res) => {
    const { id } = req.params; // ID do pedido

    try {
        const connection = await pool.getConnection();

        // Buscar os dados do pedido
        const [orderResult] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);

        if (orderResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        const order = orderResult[0];

        // Buscar os itens do pedido
        const [itemsResult] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
        connection.release();

        // Formatar a resposta com os itens
        res.status(200).json({
            ...order,
            items: itemsResult,
        });
    } catch (error) {
        Logmessage('Erro ao buscar pedido e itens no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
getOrders = async (req, res) => {
    const { id } = req.params; // ID do usuário

    try {
        const connection = await pool.getConnection();

        // Buscar todos os pedidos do usuário
        const [ordersResult] = await connection.query('SELECT * FROM orders WHERE user_id = ?', [id]);

        if (ordersResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Nenhum pedido encontrado para este usuário' });
        }

        // Para cada pedido, buscar os itens correspondentes
        const ordersWithItems = await Promise.all(
            ordersResult.map(async (order) => {
                const [itemsResult] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
                return {
                    ...order,
                    items: itemsResult,
                };
            })
        );

        connection.release();

        // Retornar a resposta com os pedidos e seus itens
        res.status(200).json(ordersWithItems);
    } catch (error) {
        Logmessage('Erro ao buscar pedidos e itens no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

updateOrder = async (req, res) => {
    const { id } = req.params; // ID do pedido
    const updates = req.body; // Campos a serem atualizados na tabela `orders`

    try {
        const connection = await pool.getConnection();

        // Verificar se o pedido existe
        const [orderResult] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (orderResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        // Construir a query dinâmica com base nos campos recebidos
        const fields = Object.keys(updates);
        if (fields.length === 0) {
            connection.release();
            return res.status(400).json({ message: 'Nenhum campo para atualizar' });
        }

        const placeholders = fields.map((field) => `${field} = ?`).join(', ');
        const values = fields.map((field) => updates[field]);

        // Executar a atualização
        await connection.query(`UPDATE orders SET ${placeholders} WHERE id = ?`, [...values, id]);
        connection.release();

        res.status(200).json({ message: 'Pedido atualizado com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar o pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

updateOrderItems = async (req, res) => {
    const { id } = req.params; // ID do item do pedido
    const updates = req.body; // Campos a serem atualizados na tabela `order_items`

    try {
        const connection = await pool.getConnection();

        // Verificar se o item existe
        const [itemResult] = await connection.query('SELECT * FROM order_items WHERE id = ?', [id]);
        if (itemResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Item do pedido não encontrado' });
        }

        // Construir a query dinâmica com base nos campos recebidos
        const fields = Object.keys(updates);
        if (fields.length === 0) {
            connection.release();
            return res.status(400).json({ message: 'Nenhum campo para atualizar' });
        }

        const placeholders = fields.map((field) => `${field} = ?`).join(', ');
        const values = fields.map((field) => updates[field]);

        // Executar a atualização
        await connection.query(`UPDATE order_items SET ${placeholders} WHERE id = ?`, [...values, id]);
        connection.release();

        res.status(200).json({ message: 'Item do pedido atualizado com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar o item do pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

deleteOrderItem = async (req, res) => {
    const { product_id, order_id } = req.params; // IDs necessários para localizar o item do pedido

    try {
        const connection = await pool.getConnection();

        // Verificar se o item do pedido existe
        const [itemResult] = await connection.query(
            'SELECT * FROM order_items WHERE product_id = ? AND order_id = ?',
            [product_id, order_id] // Passar os valores como um array
        );
        if (itemResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Item do pedido não encontrado' });
        }

        // Excluir o item do pedido
        await connection.query(
            'DELETE FROM order_items WHERE product_id = ? AND order_id = ?',
            [product_id, order_id] // Passar os valores como um array
        );
        connection.release();

        res.status(200).json({ message: 'Item do pedido excluído com sucesso' });
    } catch (error) {
        Logmessage('Erro ao excluir o item do pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

addOrderItems = async (req, res) => {
    const { order_id } = req.params; // ID do pedido
    const { items } = req.body; // Lista de itens a serem adicionados
    Logmessage(order_id)
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Itens inválidos ou ausentes' });
    }

    try {
        const connection = await pool.getConnection();

        // Verificar se o pedido existe
        const [orderResult] = await connection.query('SELECT * FROM orders WHERE id = ?', [order_id]);
        if (orderResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        // Adicionar cada item ao pedido
        const insertItems = items.map(item => {
            const { product_id, quantity, unit_price, total_price } = item;
            if (!product_id || !quantity || !unit_price || !total_price) {
                throw new Error('Dados do item inválidos');
            }

            return connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                [order_id, product_id, quantity, price]
            );
        });

        // Executar todas as inserções
        await Promise.all(insertItems);
        connection.release();

        res.status(201).json({ message: 'Itens adicionados ao pedido com sucesso' });
    } catch (error) {
        Logmessage('Erro ao adicionar itens ao pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


module.exports = { createOrder, getOrderById, getOrders, updateOrder, deleteOrderItem, addOrderItems}