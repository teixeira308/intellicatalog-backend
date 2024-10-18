const pool = require('../config/dbConfig');
const {Logmessage} = require( "../helper/Tools");

const createStore = async (req, res) => {
    const storeData = req.body;
    Logmessage("Criar store, dados do body: " + JSON.stringify(storeData)); // Ajustei para stringify para mostrar o objeto completo

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO stores SET ?', storeData);
        connection.release();

        // 'result' conterá informações sobre a inserção, incluindo o ID gerado
        const insertedId = result.insertId; // Aqui está o ID gerado automaticamente pelo MySQL

        Logmessage('Dados da store inseridos no banco de dados. ID: ' + insertedId);
        res.status(201).json({  id: insertedId,...storeData }); // Retorna os dados da categoria com o ID inserido
    } catch (error) {
        Logmessage('Erro ao inserir dados da store no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const listAllStores = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamanho da página (padrão: 10)
    console.log(req.user.userId)
    try {
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM stores WHERE user_id= ?',req.user.userId);

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query('SELECT * FROM stores WHERE user_id= ? LIMIT ?, ?', [req.user.userId,offset, pageSize]);
        connection.release();
        var now = new Date();
        //Logmessage('Lista de pessoas recuperada do banco de dados:'+ results);

        // Definir o cabeçalho X-Total-Count para enviar o total de resultados
        res.header('X-Total-Count', totalCount[0].total);

        // Enviar os resultados e informações de paginação
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de stores do banco de dados:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


alterStore = async (req, res) => {
    const { id } = req.params; // Captura o ID do parâmetro da rota
    const newData = req.body; // Novos dados da pessoa a serem atualizados

    try {
        // Verifica se o registro com o ID especificado existe
        const [existingPessoa] = await pool.query('SELECT * FROM stores WHERE id = ?', [id]);
        if (existingPessoa.length === 0) {
            return res.status(404).json({ message: 'Store não encontrada' });
        }

        // Atualiza os dados da pessoa no banco de dados
        const connection = await pool.getConnection();
        await connection.query('UPDATE stores SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage('Dados da store ID '+id+' atualizados no banco de dados: '+ JSON.stringify(newData));
        res.status(200).json({ message: 'Dados da Store atualizados com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar dados da Store no banco de dados: '+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

deleteStore = async (req, res) => {
    const { id } = req.params; // Captura o ID do query param
    Logmessage("deletando store: " + id)
    try {
        // Verifica se a pessoa com o ID especificado existe
        const [existingStore] = await pool.query('SELECT * FROM stores WHERE id = ?', [id]);
        if (existingStore.length === 0) {
            return res.status(404).json({ message: 'Store não encontrada' });
        }

        // Exclui a pessoa do banco de dados
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM stores WHERE id = ?', [id]);
        connection.release();

        Logmessage('Store excluída do banco de dados: '+id);
        res.status(200).json({ message: 'Store excluída com sucesso', id : id });
    } catch (error) {
        Logmessage('Erro ao excluir Store do banco de dados:' +error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

getStore = async (req, res) => {
    const { id } = req.params; // Captura o ID da pessoa da URL

    try {
        const connection = await pool.getConnection();
        const [store] = await connection.query('SELECT * FROM stores WHERE identificadorexterno = ?', id); // Consulta uma pessoa com base no ID
        connection.release();

        if (store.length === 0) { // Se não houver pessoa com o ID especificado, retorna 404
            return res.status(404).json({ message: 'Store não encontrada' });
        }

        Logmessage('Store recuperada do banco de dados: '+ JSON.stringify(store));

        // Retorna a pessoa encontrada
        res.status(200).json(store[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar a store do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const getStoreConfigs = async(req,res) =>{
    const { id } = req.params; // Captura o ID da pessoa da URL

    try {
        const connection = await pool.getConnection();
        const [store] = await connection.query('SELECT * FROM store_config WHERE store_id = ?', id); // Consulta uma pessoa com base no ID
        connection.release();

        if (store.length === 0) { // Se não houver pessoa com o ID especificado, retorna 404
            return res.status(404).json({ message: 'Store não encontrada' });
        }

        Logmessage('Store recuperada do banco de dados: '+ JSON.stringify(store));

        // Retorna a pessoa encontrada
        res.status(200).json(store[0]);
    } catch (error) {
        Logmessage('Erro ao recuperar a store do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const createStoreConfigs = async (req, res) => {
    const storeData = req.body;
    const { id } = req.params; // Captura o ID da pessoa da URL
    Logmessage("Criar store, dados do body: " + JSON.stringify(storeData)); // Ajustei para stringify para mostrar o objeto completo
    storeData.store_id = id; 
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO store_config SET ?', storeData);
        connection.release();

        // 'result' conterá informações sobre a inserção, incluindo o ID gerado
        const insertedId = result.insertId; // Aqui está o ID gerado automaticamente pelo MySQL

        Logmessage('Dados da store inseridos no banco de dados. ID: ' + insertedId);
        res.status(201).json({  id: insertedId,...storeData }); // Retorna os dados da categoria com o ID inserido
    } catch (error) {
        Logmessage('Erro ao inserir dados da store no banco de dados: ' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const alterStoreConfigs = async (req, res) => {
    const { id } = req.params; // Captura o ID do parâmetro da rota
    const newData = req.body; // Novos dados da pessoa a serem atualizados
    
    try {
        // Verifica se o registro com o ID especificado existe
        const [existingStoreConfig] = await pool.query('SELECT * FROM stores WHERE id = ?', [id]);
        if (existingStoreConfig.length === 0) {
            return res.status(404).json({ message: 'Store não encontrada' });
        }

        // Atualiza os dados da pessoa no banco de dados
        const connection = await pool.getConnection();
        await connection.query('UPDATE store_config SET ? WHERE store_id = ?', [newData, id]);
        connection.release();

        Logmessage('Dados da store ID '+id+' atualizados no banco de dados: '+ JSON.stringify(newData));
        res.status(200).json({ message: 'Dados da Store atualizados com sucesso' });
    } catch (error) {
        Logmessage('Erro ao atualizar dados da Store no banco de dados: '+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}



module.exports = { createStore, listAllStores, alterStore, deleteStore, getStore, getStoreConfigs, createStoreConfigs, alterStoreConfigs }