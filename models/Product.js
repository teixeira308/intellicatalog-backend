import { DataTypes } from 'sequelize';
import database from '../infra/database.js';

const Product = database.define('products', {
    nameprod: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    brand: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    descprod: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    }, 
    unit: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    unitquantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    image_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    category_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'categories',
            key: 'id',
        },
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: true,
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

await Product.sync();

export default Product;
