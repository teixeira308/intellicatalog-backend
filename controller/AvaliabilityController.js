// controllers/AvaliabilityController.js

import Availability from '../models/Availability.js';
import { Logmessage } from '../helper/Tools.js';

export const createAvaliability = async (req, res) => {
    try {
        const data = req.body;
        Logmessage('Criando disponibilidade:', data);

        const newAvailability = await Availability.create(data);
        res.status(201).json(newAvailability);
    } catch (error) {
        Logmessage('Erro ao criar disponibilidade:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const GetAllAvaliability = async (req, res) => {
    try {
        const availabilities = await Availability.findAll();
        res.status(200).json(availabilities);
    } catch (error) {
        Logmessage('Erro ao buscar disponibilidades:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const GetAvaliability = async (req, res) => {
    try {
        const { id } = req.params;

        const availability = await Availability.findByPk(id);
        if (!availability) {
            return res.status(404).json({ message: 'Disponibilidade não encontrada' });
        }

        res.status(200).json(availability);
    } catch (error) {
        Logmessage('Erro ao buscar disponibilidade:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const UpdateAvaliability = async (req, res) => {
    try {
        const { id } = req.body; // ID da disponibilidade
        const updates = req.body; // Dados atualizados

        const availability = await Availability.findByPk(id);
        if (!availability) {
            return res.status(404).json({ message: 'Disponibilidade não encontrada' });
        }

        await availability.update(updates);
        res.status(200).json({ message: 'Disponibilidade atualizada com sucesso', availability });
    } catch (error) {
        Logmessage('Erro ao atualizar disponibilidade:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const DeleteAvaliability = async (req, res) => {
    try {
        const { id } = req.body;

        const availability = await Availability.findByPk(id);
        if (!availability) {
            return res.status(404).json({ message: 'Disponibilidade não encontrada' });
        }

        await availability.destroy();
        res.status(200).json({ message: 'Disponibilidade excluída com sucesso' });
    } catch (error) {
        Logmessage('Erro ao excluir disponibilidade:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
