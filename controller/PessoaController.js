
const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");


createPessoa = async (req, res) => {
    const pessoaData = req.body;
    Logmessage("Criar pessoa, dados do body:", pessoaData)
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO pessoas SET ?', pessoaData);
        connection.release();
        Logmessage('Dados do candidato inseridos no banco de dados:' + pessoaData);
        res.status(201).json(pessoaData);
    } catch (error) {
        Logmessage('Erro ao inserir dados do candidato no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

listAllPessoas = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamanho da página (padrão: 10)

    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM pessoas');

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query('SELECT * FROM pessoas LIMIT ?, ?', [offset, pageSize]);
        connection.release();
        var now = new Date();
        //Logmessage('Lista de pessoas recuperada do banco de dados:'+ results);

        // Definir o cabeçalho X-Total-Count para enviar o total de resultados
        res.header('X-Total-Count', totalCount[0].total);

        // Enviar os resultados e informações de paginação
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de pessoas do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


alterPessoa = async (req, res) => {
    const { id } = req.params; // Captura o ID do parâmetro da rota
    const newData = req.body; // Novos dados da pessoa a serem atualizados

    try {
        // Verifica se o registro com o ID especificado existe
        const [existingPessoa] = await pool.query('SELECT * FROM pessoas WHERE id = ?', [id]);
        if (existingPessoa.length === 0) {
            return res.status(404).json({ message: 'Pessoa não encontrada' });
        }

        // Atualiza os dados da pessoa no banco de dados
        const connection = await pool.getConnection();
        await connection.query('UPDATE pessoas SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage('Dados da pessoa ID '+id+' atualizados no banco de dados:', newData);
        res.status(200).json({ message: 'Dados da pessoa atualizados com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar dados da pessoa no banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

deletePessoa = async (req, res) => {
    const { id } = req.params; // Captura o ID do query param
    Logmessage("deletando pessoa:", id)
    try {
        // Verifica se a pessoa com o ID especificado existe
        const [existingPessoa] = await pool.query('SELECT * FROM pessoas WHERE id = ?', [id]);
        if (existingPessoa.length === 0) {
            return res.status(404).json({ message: 'Pessoa não encontrada' });
        }

        // Exclui a pessoa do banco de dados
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM pessoas WHERE id = ?', [id]);
        connection.release();

        Logmessage('Pessoa excluída do banco de dados', id);
        res.status(200).json({ message: 'Pessoa excluída com sucesso', id: [id] });
    } catch (error) {
        Logmessage('Erro ao excluir pessoa do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

getPessoa = async (req, res) => {
    const { id } = req.params; // Captura o ID da pessoa da URL

    try {
        const connection = await pool.getConnection();
        const [pessoa] = await connection.query('SELECT * FROM pessoas WHERE id = ?', [id]); // Consulta uma pessoa com base no ID
        connection.release();

        if (pessoa.length === 0) { // Se não houver pessoa com o ID especificado, retorna 404
            return res.status(404).json({ message: 'Pessoa não encontrada' });
        }

        Logmessage('Pessoa recuperada do banco de dados:', pessoa);

        // Retorna a pessoa encontrada
        res.status(200).json(pessoa[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar a pessoa do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}



module.exports = { createPessoa, listAllPessoas, alterPessoa, deletePessoa, getPessoa }