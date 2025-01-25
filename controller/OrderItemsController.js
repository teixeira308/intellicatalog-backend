
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

deleteOrderItem = async (req, res) => {
    const { product_id, order_id } = req.params; // IDs necessários para localizar o item do pedido

    try {
        const connection = await pool.getConnection();

        // Verificar se o item do pedido existe
        const [itemResult] = await connection.query(
            'SELECT * FROM order_items WHERE product_id = ? AND order_id = ?',
            [product_id, order_id]
        );
        if (itemResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Item do pedido não encontrado' });
        }

        // Recuperar o valor total do item antes de deletá-lo
        const { total_price } = itemResult[0];

        // Excluir o item do pedido
        await connection.query(
            'DELETE FROM order_items WHERE product_id = ? AND order_id = ?',
            [product_id, order_id]
        );

        // Recalcular o valor total do pedido
        const [orderResult] = await connection.query(
            'SELECT total_amount FROM orders WHERE id = ?',
            [order_id]
        );

        if (orderResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        const currentTotalAmount = parseFloat(orderResult[0].total_amount || 0);
        const updatedTotalAmount = currentTotalAmount - parseFloat(total_price);

        // Atualizar o valor total do pedido na tabela `orders`
        await connection.query(
            'UPDATE orders SET total_amount = ? WHERE id = ?',
            [updatedTotalAmount, order_id]
        );

        connection.release();

        res.status(200).json({
            message: 'Item do pedido excluído com sucesso',
            total_amount: updatedTotalAmount,
        });
    } catch (error) {
        Logmessage('Erro ao excluir o item do pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


addOrderItems = async (req, res) => {
    const { order_id } = req.params; // ID do pedido
    const { items } = req.body; // Lista de itens a serem adicionados

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Itens inválidos ou ausentes' });
    }
    Logmessage('entrou')
    Logmessage(items)

    try {
        const connection = await pool.getConnection();

        // Verificar se o pedido existe
        const [orderResult] = await connection.query('SELECT * FROM orders WHERE id = ?', [order_id]);
        if (orderResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        // Verificar se algum item já existe no pedido
        for (const item of items) {
            const { product_id } = item;

            // Consultar se o produto já está no pedido
            const [existingItem] = await connection.query(
                'SELECT * FROM order_items WHERE order_id = ? AND product_id = ?',
                [order_id, product_id]
            );

            if (existingItem.length > 0) {
                connection.release();
                return res.status(400).json({
                    message: `O produto já está no pedido.`,
                });
            }
        }

        // Adicionar cada item ao pedido
        let totalNewItemsPrice = 0; // Soma do valor total dos itens adicionados
        const insertItems = items.map((item) => {
            const { product_id, quantity, unit_price } = item;
            Logmessage(item)
            // Verificar se os dados do item são válidos
            if (!product_id || !quantity || !unit_price) {
                throw new Error('Dados do item inválidos');
            }

            const total_price = quantity * unit_price; // Calcular o preço total do item
            totalNewItemsPrice += total_price; // Somar ao total dos novos itens

            return connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                [order_id, product_id, quantity, unit_price, total_price]
            );
        });

        // Executar todas as inserções
        await Promise.all(insertItems);

        // Calcular o novo total do pedido
        const [orderTotalResult] = await connection.query(
            'SELECT total_amount FROM orders WHERE id = ?',
            [order_id]
        );

        const currentTotalPrice = parseFloat(orderTotalResult[0].total_price || 0);
        const updatedTotalPrice = currentTotalPrice + totalNewItemsPrice;

        // Atualizar o valor total do pedido na tabela `orders`
        await connection.query('UPDATE orders SET total_amount = ? WHERE id = ?', [updatedTotalPrice, order_id]);

        connection.release();

        res.status(201).json({ message: 'Itens adicionados ao pedido com sucesso e total atualizado', total_price: updatedTotalPrice });
    } catch (error) {
        Logmessage('Erro ao adicionar itens ao pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const deleteOrder = async (req, res) => {
    const { order_id } = req.params; // ID do pedido a ser excluído

    try {
        const connection = await pool.getConnection();

        // Verificar se o pedido existe
        const [orderResult] = await connection.query(
            'SELECT * FROM orders WHERE id = ?',
            [order_id]
        );
        if (orderResult.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        // Iniciar uma transação para garantir a integridade dos dados
        await connection.beginTransaction();

        try {
            // Excluir itens do pedido na tabela `order_items`
            await connection.query(
                'DELETE FROM order_items WHERE order_id = ?',
                [order_id]
            );

            // Excluir o pedido na tabela `orders`
            await connection.query(
                'DELETE FROM orders WHERE id = ?',
                [order_id]
            );

            // Confirmar a transação
            await connection.commit();

            res.status(200).json({ message: 'Pedido excluído com sucesso' });
        } catch (transactionError) {
            // Reverter a transação em caso de erro
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }
    } catch (error) {
        Logmessage('Erro ao excluir o pedido no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};



module.exports = { createOrder, getOrderById, getOrders, updateOrder, deleteOrderItem, addOrderItems, deleteOrder}