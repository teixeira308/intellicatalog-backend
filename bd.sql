-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 172.17.0.2:3306
-- Tempo de geração: 01/11/2024 às 12:43
-- Versão do servidor: 8.4.0
-- Versão do PHP: 8.2.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+03:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `intellicatalog`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `categories`
--



-- Criação da tabela services
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    duration INT NOT NULL,
    price DECIMAL(10,2) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users_catalog (id) ON DELETE CASCADE
);

CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL, -- Chave estrangeira para a tabela de usuários
  `store_id` INT NOT NULL, -- Chave estrangeira para a tabela de lojas
  `order_date` DATETIME DEFAULT CURRENT_TIMESTAMP, -- Data e hora do pedido
  `status` ENUM('pending', 'confirmed', 'shipped', 'completed', 'cancelled') 
            DEFAULT 'pending' NOT NULL, -- Status do pedido
  `total_amount` DECIMAL(10, 2) NOT NULL, -- Valor total do pedido
  `payment_method` VARCHAR(100) NOT NULL, -- Método de pagamento
  `phone` VARCHAR(100) NOT NULL, -- Método de pagamento
  `delivery_address` TEXT, -- Endereço de entrega (se aplicável)
  `notes` TEXT, -- Observações adicionais sobre o pedido
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp de criação
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Timestamp de atualização automática
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users_catalog`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('available', 'unavailable') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_id FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    availability_id INT NOT NULL,
    obs TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_id2 FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
    CONSTRAINT fk_availability_id FOREIGN KEY (availability_id) REFERENCES availability (id) ON DELETE CASCADE
);



CREATE TABLE `categories` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `catalog_order` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `description` text,
  `status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `created_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `products`
--

CREATE TABLE `products` (
  `id` int NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `product_order` int DEFAULT NULL,
  `brand` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `promocional_price` decimal(10,2) DEFAULT NULL,
  `unit` varchar(100) NOT NULL,
  `unitquantity` varchar(100) NOT NULL,
  `status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `category_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `store_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `products_images`
--

CREATE TABLE `products_images` (
  `id` int NOT NULL,
  `description` text,
  `nomearquivo` varchar(100) NOT NULL,
  `status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `tipo` varchar(100) NOT NULL,
  `tamanho` varchar(100) NOT NULL,
  `product_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `stores`
--

CREATE TABLE `stores` (
  `id` int NOT NULL,
  `namestore` varchar(255) NOT NULL,
  `opening_hours` varchar(255) DEFAULT NULL,
  `closing_hours` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `identificadorexterno` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `delivery_fee` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `store_config`
--

CREATE TABLE `store_config` (
  `id` int NOT NULL,
  `store_id` int NOT NULL,
  `cor_primaria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cor_secundaria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cor_botao_primaria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cor_botao_secundaria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `taxa_entrega` double NOT NULL,
  `numero_whatsapp` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `instagram` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `facebook` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `usa_Status` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chave_pix` varchar(100) NOT NULL,
  `usa_estoque` varchar(100) NOT NULL,
  `usa_logo_fundo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `store_images`
--

CREATE TABLE `store_images` (
  `id` int NOT NULL,
  `description` varchar(100) NOT NULL,
  `nomearquivo` varchar(100) DEFAULT NULL,
  `tipo` varchar(45) DEFAULT NULL,
  `tamanho` varchar(45) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `store_id` int DEFAULT NULL,
  `created_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `users_catalog`
--

CREATE TABLE `users_catalog` (
  `id` int NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `created_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_atUTC` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE user_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Chave estrangeira para a tabela de usuários
    access_token TEXT NOT NULL, -- Token de acesso
    refresh_token TEXT NOT NULL, -- Token de renovação
    scope TEXT NOT NULL, -- Escopo autorizado
    token_type VARCHAR(50), -- Tipo de token (geralmente "Bearer")
    expiry_date DATETIME, -- Data de expiração do access_token
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação do registro
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Data de atualização automática
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users_catalog(id) ON DELETE CASCADE -- Relaciona com a tabela de usuários
);


--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_store` (`store_id`);

--
-- Índices de tabela `products_images`
--
ALTER TABLE `products_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `store_config`
--
ALTER TABLE `store_config`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id_f` (`store_id`);

--
-- Índices de tabela `store_images`
--
ALTER TABLE `store_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_store_image_store` (`store_id`),
  ADD KEY `fk_store_image_user` (`user_id`);

--
-- Índices de tabela `users_catalog`
--
ALTER TABLE `users_catalog`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `products_images`
--
ALTER TABLE `products_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `store_config`
--
ALTER TABLE `store_config`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `store_images`
--
ALTER TABLE `store_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `users_catalog`
--
ALTER TABLE `users_catalog`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_catalog` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users_catalog` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `products_images`
--
ALTER TABLE `products_images`
  ADD CONSTRAINT `products_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_images_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users_catalog` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `stores`
--
ALTER TABLE `stores`
  ADD CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_catalog` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `store_config`
--
ALTER TABLE `store_config`
  ADD CONSTRAINT `store_id_f` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Restrições para tabelas `store_images`
--
ALTER TABLE `store_images`
  ADD CONSTRAINT `fk_store_image_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_store_image_user` FOREIGN KEY (`user_id`) REFERENCES `users_catalog` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

ALTER TABLE users_catalog
ADD COLUMN reset_token VARCHAR(255),
ADD COLUMN reset_token_expiration DATETIME;
