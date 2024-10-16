
const pool = require('../config/dbConfig');
const {Logmessage} = require( "../helper/Tools");


createCategory = async (req, res) => {
    const categoryData = req.body;
    Logmessage("Criar categoria, dados do body: " + JSON.stringify(categoryData)); // Ajustei para stringify para mostrar o objeto completo

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO categories SET ?', categoryData);
        connection.release();

        // 'result' conterá informações sobre a inserção, incluindo o ID gerado
        const insertedId = result.insertId; // Aqui está o ID gerado automaticamente pelo MySQL

        Logmessage('Dados da categoria inseridos no banco de dados. ID: ' + insertedId);
        res.status(201).json({  id: insertedId,...categoryData }); // Retorna os dados da categoria com o ID inserido
    } catch (error) {
        Logmessage('Erro ao inserir dados da categoria no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}



listAllCategories = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamanho da página (padrão: 10)

    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM categories ');

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query('SELECT * FROM categories LIMIT ?, ?', [offset, pageSize]);
        connection.release();
        var now = new Date();
        Logmessage('Lista de categorias recuperada do banco de dados:'+ results);

        // Definir o cabeçalho X-Total-Count para enviar o total de resultados
        res.header('X-Total-Count', totalCount[0].total);

        // Enviar os resultados e informações de paginação
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de categories do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}



alterCategory = async (req, res) => {
    const { id } = req.params; // Captura o ID do parâmetro da rota
    const newData = req.body; // Novos dados da pessoa a serem atualizados

    try {
        // Verifica se o registro com o ID especificado existe
        const [existingCategory] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
        if (existingCategory.length === 0) {
            return res.status(404).json({ message: 'categoria não encontrada' });
        }

        // Atualiza os dados da pessoa no banco de dados
        const connection = await pool.getConnection();
        await connection.query('UPDATE categories SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage('Dados da category ID: '+id+' atualizados no banco de dados: '+ JSON.stringify(newData));
        res.status(200).json({ message: 'Dados da category atualizados com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar dados da cagegory no banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


deleteCategory = async (req, res) => {
    const { id } = req.params; // Captura o ID do query param
    Logmessage("deletando Category: ",id)
    try {
        // Verifica se a pessoa com o ID especificado existe
        const [existingCategory] = await pool.query('SELECT * FROM categories WHERE status="ativo" and id = ?', [id]);
        if (existingCategory.length === 0) {
            return res.status(404).json({ message: 'Category não encontrada' });
        }

        // Exclui a pessoa do banco de dados
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM categories WHERE id = ?', [id]);
        connection.release();

        Logmessage('Category excluída do banco de dados',id);
        res.status(200).json({ message: 'Category excluída com sucesso', id :id });
    } catch (error) {
        Logmessage('Erro ao excluir Category do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


getCategory = async (req, res) => {
    const { id } = req.params; // Captura o ID da pessoa da URL
    Logmessage("Consulta Categoria: "+id)
    try {
        const connection = await pool.getConnection();
        const [category] = await connection.query('SELECT * FROM categories WHERE status="ativo" and id = ?', id); // Consulta uma pessoa com base no ID
        connection.release();

        if (category.length === 0) { // Se não houver pessoa com o ID especificado, retorna 404
            return res.status(404).json({ message: 'Category não encontrada' });
        }

        Logmessage('Category recuperada do banco de dados:'+ JSON.stringify(category));

        // Retorna a pessoa encontrada
        res.status(200).json(category[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar a Category do banco de dados:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

simpleListAllCategories = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamanho da página (padrão: 10)
    const { user_id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM categories where status="ativo" and user_id = ? ',user_id);

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query('SELECT * FROM categories where status="ativo" and user_id = ? LIMIT ?, ?', [user_id,offset, pageSize]);
        connection.release();

        Logmessage('Lista de categorias recuperada do banco de dados:'+ JSON.stringify(results));

        // Definir o cabeçalho X-Total-Count para enviar o total de resultados
        res.header('X-Total-Count', totalCount[0].total);

        // Enviar os resultados e informações de paginação
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de categories do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


module.exports = { createCategory, listAllCategories, alterCategory, deleteCategory, getCategory, simpleListAllCategories}