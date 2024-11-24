const pool = require('../config/dbConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { Logmessage } = require("../helper/Tools");
const bodyParser = require('body-parser');
const { getAuthUrl, getOAuth2Client, setTokens } = require('../services/GAuth');


dotenv.config();

createUser = async (req, res, next) => {

    try {

        const { email, password } = req.body;
        Logmessage("Criar usuario", email)
        // Verificar se o email já está cadastrado
        const [existingUser] = await pool.execute('SELECT * FROM users_catalog WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).send({ message: 'Usuário já cadastrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir o usuário no banco de dados
        const query = 'INSERT INTO users_catalog (email,password) VALUES (?,?)';
        const connection = await pool.getConnection();
        const results = await connection.execute(query, [email, hashedPassword]);
        connection.release();

        // Preparar a resposta de sucesso
        const response = {
            message: 'Usuário criado com sucesso',
            createdUser: { email }
        };

        // Enviar a resposta
        return res.status(201).send(response);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).send({ error: 'Erro interno do servidor' });
    }

};

ResetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Verificar se o e-mail está registrado
        const [results] = await pool.execute('SELECT * FROM users_catalog WHERE email = ?', [email]);
        if (results.length < 1) {
            return res.status(404).json({ errors: ["Usuário não encontrado!"] });
        }

        const user = results[0];

        // Gerar um token de reset
        const resetToken = generateResetToken(user.id);
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Enviar o e-mail com o link de redefinição
        await sendResetEmail(email, resetLink);

        return res.status(200).send({ message: 'Link de redefinição enviado para o e-mail' });
    } catch (error) {
        console.error('Erro ao enviar e-mail de redefinição:', error);
        return res.status(500).send({ error: 'Erro interno do servidor' });
    }
};

// Autenticação no Google Calendar
const CalendarAuth = async (req, res) => {
    const code = req.query.code;
    const userId = req.user?.userId;
  
    if (!userId) {
      return res.status(400).send({ error: 'Usuário não identificado' });
    }
  
    try {
      const tokens = await setTokens(code);
  
      // Salvar tokens no banco
      await saveTokensToDatabase(userId, tokens);
  
      return res.status(200).send({ message: 'Tokens salvos com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar tokens:', error);
      return res.status(500).send({ error: 'Erro ao salvar tokens' });
    }
  };

Login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Consultar o usuário pelo email
        const query = `SELECT * FROM users_catalog WHERE status = "ativo" and email = ?`;
        const [results] = await pool.execute(query, [email]);

        if (results.length < 1) {
            console.log("não encontrado")
            return res.status(404).json({ errors: ["Usuário não encontrado!"] });
        }

        const user = results[0];
        Logmessage("Login usuario", user.email)
        // Comparando as senhas
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if ((user.email === "admin67321679392136@adminintellicatalog.com")) {
            console.log("token admin")
            if (isPasswordValid) {
                const token = jwt.sign({
                    userId: user.id,
                    email: user.email
                }, process.env.JWT_SECRET);
                return res.status(200).send({
                    message: 'Autenticado com sucesso',
                    userId: user.id,
                    username: user.username,
                    token: token
                });
            } else {
                return res.status(401).send({ errors: ['Falha na autenticação'] });
            }

        }

        if (isPasswordValid) {
            const token = jwt.sign({
                userId: user.id,
                email: user.email
            }, process.env.JWT_SECRET, {
                expiresIn: "1h"
            });
            return res.status(200).send({
                message: 'Autenticado com sucesso',
                userId: user.id,
                username: user.username,
                token: token
            });
        } else {
            return res.status(401).send({ errors: ['Falha na autenticação'] });
        }
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(500).send({ message: 'Falha na autenticação' });
    }
};

function generateResetToken(userId) {
    const secret = process.env.JWT_SECRET; // Mantenha a chave segura no .env
    const expiresIn = '1h'; // Token expira em 1 hora
    return jwt.sign({ userId }, secret, { expiresIn });
}


async function saveTokensToDatabase(userId, tokens) {
    const query = `
      INSERT INTO user_tokens (user_id, access_token, refresh_token, scope, token_type, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      access_token = VALUES(access_token),
      refresh_token = VALUES(refresh_token),
      scope = VALUES(scope),
      token_type = VALUES(token_type),
      expiry_date = VALUES(expiry_date)
    `;
    const values = [
      userId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.scope,
      tokens.token_type,
      new Date(tokens.expiry_date),
    ];
  
    try {
      await pool.execute(query, values);
    } catch (error) {
      console.error('Erro ao salvar tokens no banco:', error.message);
      throw error;
    }
  }
  


module.exports = { Login, createUser, ResetPassword, CalendarAuth };