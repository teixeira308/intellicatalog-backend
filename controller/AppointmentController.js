const pool = require('../config/dbConfig.js');
const { Logmessage } = require('../helper/Tools.js');

// Criar agendamento
const createAppointments = async (req, res) => {
    const { service_id, availability_id, obs, status } = req.body;
    
    Logmessage("Criando agendamento, dados do body:", req.body);

    let connection;
    try {
        connection = await pool.getConnection();

        // Verificar o status da disponibilidade
        const [availability] = await connection.query('SELECT status FROM availability WHERE id = ?', [availability_id]);

        if (availability.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Disponibilidade não encontrada' });
        }

        if (availability[0].status === 'unavailable') {
            connection.release();
            return res.status(409).json({ message: 'Disponibilidade já está indisponível' });
        }

        // Iniciar transação
        await connection.beginTransaction();

        // Inserir agendamento
        const [appointmentResult] = await connection.query(
            'INSERT INTO appointments (service_id, availability_id, obs, status) VALUES (?, ?, ?)', 
            [service_id, availability_id, obs, status || 'pending']
        );

        // Atualizar o status da disponibilidade
        await connection.query(
            'UPDATE availability SET status = ? WHERE id = ?', 
            ['unavailable', availability_id]
        );

        // Confirmar transação
        await connection.commit();
        connection.release();

        Logmessage('Agendamento criado e disponibilidade atualizada no banco de dados:', {
            appointment: {
                id: appointmentResult.insertId,
                service_id,
                availability_id,
                obs,
                status: status || 'pending',
            },
        });

        res.status(201).json({
            id: appointmentResult.insertId,
            service_id,
            availability_id,
            obs,
            status: status || 'pending',
        });
    } catch (error) {
        // Reverter transação em caso de erro
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        Logmessage('Erro ao criar agendamento ou atualizar disponibilidade no banco de dados: ' + error);
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

// Atualizar um agendamento (apenas os campos informados)
const UpdateAppointments = async (req, res) => {
    const { id } = req.params; // ID do agendamento
    const updates = req.body; // Dados a serem atualizados

    try {
        const connection = await pool.getConnection();

        // Verificar se o agendamento existe
        const [existingAppointment] = await connection.query('SELECT * FROM appointments WHERE id = ?', [id]);

        if (existingAppointment.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        // Construir query dinamicamente
        const updateFields = [];
        const updateValues = [];

        for (const [field, value] of Object.entries(updates)) {
            updateFields.push(`${field} = ?`);
            updateValues.push(value);
        }

        // Se nenhum campo foi informado, retornar erro
        if (updateFields.length === 0) {
            connection.release();
            return res.status(400).json({ message: 'Nenhum campo para atualizar informado' });
        }

        // Adicionar o ID ao final dos valores
        updateValues.push(id);

        // Executar a query de atualização
        const updateQuery = `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.query(updateQuery, updateValues);

        connection.release();

        Logmessage('Agendamento atualizado no banco de dados:', { id, ...updates });
        res.status(200).json({ message: 'Agendamento atualizado com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar agendamento no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


// Excluir um agendamento
const DeleteAppointments = async (req, res) => {
    const { id } = req.params;

    let connection; // Define a variável no escopo superior

    try {
        connection = await pool.getConnection();

        // Verificar se o agendamento existe
        const [existingAppointment] = await connection.query('SELECT * FROM appointments WHERE id = ?', [id]);

        if (existingAppointment.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        // Obter o `availability_id` do agendamento
        const availabilityId = existingAppointment[0].availability_id;

        // Iniciar transação
        await connection.beginTransaction();

        // Excluir o agendamento
        await connection.query('DELETE FROM appointments WHERE id = ?', [id]);

        // Atualizar o status da disponibilidade para 'available'
        await connection.query('UPDATE availability SET status = ? WHERE id = ?', ['available', availabilityId]);

        // Confirmar transação
        await connection.commit();
        connection.release();

        Logmessage('Agendamento excluído e disponibilidade atualizada no banco de dados:', {
            appointmentId: id,
            availabilityId,
        });

        res.status(200).json({ message: 'Agendamento excluído com sucesso', id });
    } catch (error) {
        // Reverter transação e liberar conexão em caso de erro
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        Logmessage('Erro ao excluir agendamento ou atualizar disponibilidade no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


// Obter um agendamento específico
const GetAppointment = async (req, res) => {
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

// Obter um agendamento específico
const GetAppointmentByAvailability = async (req, res) => {
    const { availability_id } = req.params;
    
    try {
        const connection = await pool.getConnection();
        const [appointment] = await connection.query('SELECT * FROM appointments WHERE availability_id = ?', [availability_id]);
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
    GetAppointment,
    GetAppointmentByAvailability
};
