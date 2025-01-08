// controllers/AppointmentsController.js

import Appointment from '../models/Appointment.js';
import { Logmessage } from "../helper/Tools";

// Criação de agendamento
const createAppointments = async (req, res) => {
    const { service_id, availability_id, appointment_date, appointment_time, status } = req.body;
    Logmessage("Criando agendamento, dados do body:", req.body);

    try {
        const appointment = await Appointment.create({
            service_id,
            availability_id,
            appointment_date,
            appointment_time,
            status: status || 'pending',
        });

        Logmessage('Agendamento criado no banco de dados:', appointment);
        res.status(201).json(appointment);
    } catch (error) {
        Logmessage('Erro ao criar agendamento no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Listar todos os agendamentos
const GetAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.findAll();
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
        const appointment = await Appointment.findByPk(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        await appointment.update({
            service_id,
            availability_id,
            appointment_date,
            appointment_time,
            status,
        });

        Logmessage('Agendamento atualizado no banco de dados:', appointment);
        res.status(200).json(appointment);
    } catch (error) {
        Logmessage('Erro ao atualizar agendamento no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Excluir um agendamento
const DeleteAppointments = async (req, res) => {
    const { id } = req.params;

    try {
        const appointment = await Appointment.findByPk(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        await appointment.destroy();
        Logmessage('Agendamento excluído do banco de dados:', appointment);
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
        const appointment = await Appointment.findByPk(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        Logmessage('Agendamento recuperado do banco de dados:', appointment);
        res.status(200).json(appointment);
    } catch (error) {
        Logmessage('Erro ao recuperar agendamento do banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export default {
    createAppointments,
    GetAllAppointments,
    UpdateAppointments,
    DeleteAppointments,
    GetAppointments
};
