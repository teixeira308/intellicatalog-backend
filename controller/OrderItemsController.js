
const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

createOrder = async(req, res) => {
    const orderData = req.body;
    Logmessage("Criar pedido, dados do body: " + JSON.stringify(orderData));

    try {
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
}


module.exports = { createOrder}