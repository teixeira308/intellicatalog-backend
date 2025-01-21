
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



module.exports = { createOrder}