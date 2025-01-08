const pool = require('../config/dbConfig.js');
const { Logmessage } = require('../helper/Tools.js');

// Criar agendamento
const createAppointments = async (req, res) => {
    const { service_id, availability_id, appointment_date, appointment_time, status } = req.body;
    Logmessage("Criando agendamento, dados do body:", req.body);

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO appointments (service_id, availability_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?)', 
            [service_id, availability_id, appointment_date, appointment_time, status || 'pending']
        );
        connection.release();

        Logmessage('Agendamento criado no banco de dados:', { service_id, availability_id, appointment_date, appointment_time, status });
        res.status(201).json({ id: result.insertId, service_id, availability_id, appointment_date, appointment_time, status: status || 'pending' });
    } catch (error) {
        Logmessage('Erro ao criar agendamento no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Listar todos os agendamentos
const GetAllAppointments = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [appointments] = await connection.query('SELECT * FROM appointments');
        connection.release();

        Logmessage('Lista de agendamentos recuperada do banco de dados:', appointments);
        res.status(200).json(appointments);
    } catch (error) {
        Logmessage('Erro ao recuperar agendamentos do banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Atualizar um agendamento
const UpdateAppointments = async (req, res) => {
    const { id } = req.params;
    const { service_id, availability_id, appointment_date, appointment_time, status } = req.body;

    try {
        const connection = await pool.getConnection();
        const [existingAppointment] = await connection.query('SELECT * FROM appointments WHERE id = ?', [id]);

        if (existingAppointment.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        await connection.query(
            'UPDATE appointments SET service_id = ?, availability_id = ?, appointment_date = ?, appointment_time = ?, status = ? WHERE id = ?',
            [service_id, availability_id, appointment_date, appointment_time, status, id]
        );
        connection.release();

        Logmessage('Agendamento atualizado no banco de dados:', { service_id, availability_id, appointment_date, appointment_time, status });
        res.status(200).json({ message: 'Agendamento atualizado com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar agendamento no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Excluir um agendamento
const DeleteAppointments = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [existingAppointment] = await connection.query('SELECT * FROM appointments WHERE id = ?', [id]);

        if (existingAppointment.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        await connection.query('DELETE FROM appointments WHERE id = ?', [id]);
        connection.release();

        Logmessage('Agendamento excluído do banco de dados:', id);
        res.status(200).json({ message: 'Agendamento excluído com sucesso', id });
    } catch (error) {
        Logmessage('Erro ao excluir agendamento do banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Obter um agendamento específico
const GetAppointments = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [appointment] = await connection.query('SELECT * FROM appointments WHERE id = ?', [id]);
        connection.release();

        if (appointment.length === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        Logmessage('Agendamento recuperado do banco de dados:', appointment);
        res.status(200).json(appointment[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar agendamento do banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = {
    createAppointments,
    GetAllAppointments,
    UpdateAppointments,
    DeleteAppointments,
    GetAppointments
};
