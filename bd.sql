CREATE DATABASE IF NOT EXISTS intellicatalog;
USE intellicatalog;

SET GLOBAL time_zone = '-03:00';


DROP TABLE IF EXISTS `intellicatalog`.`products_images`;
DROP TABLE IF EXISTS `intellicatalog`.`products`;
DROP TABLE IF EXISTS `intellicatalog`.`categories`;
DROP TABLE IF EXISTS `intellicatalog`.`stores`;
DROP TABLE IF EXISTS `intellicatalog`.`users_catalog`;


CREATE TABLE users_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
    created_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    namestore VARCHAR(255) NOT NULL,
    opening_hours VARCHAR(255),
    closing_hours VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    identificadorexterno VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    user_id INT,
    created_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_catalog(id) ON DELETE SET NULL
);
-- Criação da tabela categories (sessões)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_id INT,
    description TEXT,
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
    created_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_catalog(id) ON DELETE SET NULL
);

-- Criação da tabela products (produtos)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(100) NOT NULL,
    unitquantity VARCHAR(100) NOT NULL,
	status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
    category_id INT,
    user_id INT,
    created_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users_catalog(id) ON DELETE SET NULL
);

CREATE TABLE products_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    nomearquivo VARCHAR(100) NOT NULL,
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
    tipo VARCHAR(100) NOT NULL,
    tamanho VARCHAR(100) NOT NULL,
    product_id INT,
     user_id INT,
    created_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_atUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users_catalog(id) ON DELETE SET NULL
);
