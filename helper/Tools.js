const pool = require('../config/dbConfig');

Logmessage = async (message) => {
    try {
        // Calculando GMT-3
        var now = new Date();
        const offset = -3 * 60 * 60 * 1000;
        const gmtMinus3Date = new Date(now.getTime() + offset);
        const formattedDate = gmtMinus3Date.toISOString().slice(0, 19).replace("T", " ");

        // Log de sistema no console
        console.log(formattedDate, "->", message);

        // Inserindo no banco de dados
        const connection = await pool.getConnection();
        await connection.query("INSERT INTO logs (message, createdAt) VALUES (?, ?)", [message, formattedDate]);
        connection.release();
    } catch (error) {
        console.error("Erro ao salvar log no banco de dados:", error);
    }
};

module.exports = { Logmessage };
