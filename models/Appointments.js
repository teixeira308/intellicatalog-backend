// models/Appointment.js

import { DataTypes } from 'sequelize';
import database from '../infra/database.js';

const Appointment = database.define('appointments', {
    service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'services',
            key: 'id',
        },
    },
    availability_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'availability',
            key: 'id',
        },
    },
    appointment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    appointment_time: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending',
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
}, {
    timestamps: false,
    underscored: true,
});

await Appointment.sync();

export default Appointment;
