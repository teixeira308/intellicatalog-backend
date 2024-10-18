
const pool = require('../config/dbConfig');
const {Logmessage} = require( "../helper/Tools");


createProduct = async (req, res) => {
    const productData = req.body;
    Logmessage("Criar produto, dados do body: "+ JSON.stringify(productData));

    try {
        const categoryId = productData.category_id;

        // Verifica se a categoria com o ID fornecido existe
        const categoryExists = await checkCategoryExists(categoryId);

        if (!categoryExists) {
            // Retorna uma resposta indicando que a categoria não existe
            return res.status(400).json({ message: 'A categoria fornecida não existe.' });
        }

        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO products SET ?', productData);
        connection.release();

        // 'result' contém informações sobre a inserção, incluindo o ID gerado
        const insertedId = result.insertId; // Aqui está o ID gerado automaticamente pelo MySQL

        Logmessage('Dados do produto inseridos no banco de dados. ID: ' + insertedId);
        
        // Retorna os dados do produto com o ID inserido
        res.status(201).json({ id: insertedId, ...productData });
    } catch (error) {
        Logmessage('Erro ao inserir dados do produto no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

// Função para verificar se a categoria existe
async function checkCategoryExists(categoryId) {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
        connection.release();

        return result.length > 0; // Retorna true se encontrar a categoria com o ID fornecido
    } catch (error) {
        console.error('Erro ao verificar a existência da categoria:', error);
        return false; // Retorna false em caso de erro
    }
}



listAllProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamanho da página (padrão: 10)

    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM products');

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        // TO DO - PAGINATION const [results] = await connection.query('SELECT * FROM products LIMIT ?, ?', [offset, pageSize]);
        const [results] = await connection.query('SELECT * FROM products ');
        connection.release();
        var now = new Date();
        //Logmessage('Lista de pessoas recuperada do banco de dados:'+ results);

        // Definir o cabeçalho X-Total-Count para enviar o total de resultados
        res.header('X-Total-Count', totalCount[0].total);

        // Enviar os resultados e informações de paginação
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de products do banco de dados:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


alterProduct = async (req, res) => {
    const { id } = req.params; // Captura o ID do parâmetro da rota
    const newData = req.body; // Novos dados da pessoa a serem atualizados

    try {
        // Verifica se o registro com o ID especificado existe
        const [existingProduct] = await pool.query('SELECT * FROM products WHERE status="ativo" and id = ?', [id]);
        if (existingProduct.length === 0) {
            return res.status(404).json({ message: 'Product não encontrada' });
        }

        // Atualiza os dados da pessoa no banco de dados
        const connection = await pool.getConnection();
        await connection.query('UPDATE products SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage('Dados da product ID: '+id+' atualizados no banco de dados: '+ JSON.stringify(newData));
        res.status(200).json({ message: 'Dados da product atualizados com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar dados da product no banco de dados:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


deleteProduct = async (req, res) => {
    const { id } = req.params; // Captura o ID do query param
    Logmessage("deletando product: "+id)
    try {
        // Verifica se a pessoa com o ID especificado existe
        const [existingProduct] = await pool.query('SELECT * FROM products WHERE status="ativo" and id = ?', [id]);
        if (existingProduct.length === 0) {
            return res.status(404).json({ message: 'Product não encontrada' });
        }

        // Exclui a pessoa do banco de dados
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM products WHERE id = ?', [id]);
        connection.release();

        Logmessage('Product excluída do banco de dados: '+id);
        res.status(200).json({ message: 'Product excluída com sucesso', id :id });
    } catch (error) {
        Logmessage('Erro ao excluir product do banco de dados:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


getProduct = async (req, res) => {
    const { id } = req.params; // Captura o ID da product da URL

    try {
        const connection = await pool.getConnection();
        const [product] = await connection.query('SELECT * FROM products WHERE status="ativo" and id = ?', [id]); // Consulta uma pessoa com base no ID
        connection.release();

        if (product.length === 0) { // Se não houver product com o ID especificado, retorna 404
            return res.status(404).json({ message: 'Product não encontrada' });
        }

        Logmessage('Product recuperada do banco de dados: '+ JSON.stringify(product));

        // Retorna a pessoa encontrada
        res.status(200).json(product[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar a product do banco de dados:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

simpleListAllProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamanho da página (padrão: 10)
    const { category_id } = req.params; 

    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM products where user_id= ?',category_id);

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        // TO DO - PAGINATION -const [results] = await connection.query('SELECT * FROM products WHERE category_id = ? LIMIT ?, ?', [category_id,offset, pageSize]);
        const [results] = await connection.query('SELECT * FROM products WHERE category_id = ? ', [category_id]);
        connection.release();
        var now = new Date();
        //Logmessage('Lista de pessoas recuperada do banco de dados:'+ results);

        // Definir o cabeçalho X-Total-Count para enviar o total de resultados
        res.header('X-Total-Count', totalCount[0].total);

        // Enviar os resultados e informações de paginação
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de products do banco de dados:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

module.exports = { createProduct, listAllProducts, alterProduct, deleteProduct, getProduct, simpleListAllProducts }