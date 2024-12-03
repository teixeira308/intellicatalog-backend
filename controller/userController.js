const pool = require('../config/dbConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { Logmessage } = require("../helper/Tools");
const bodyParser = require('body-parser');


dotenv.config();

const nodemailer = require('nodemailer');

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

        // Gerar token de redefinição
        const resetToken = generateResetToken(user.id);
        const expirationTime = new Date(Date.now() + 3600000); // 1 hora a partir de agora

        // Salvar o token e a validade no banco de dados
        const query = 'UPDATE users_catalog SET reset_token = ?, reset_token_expiration = ? WHERE id = ?';
        await pool.execute(query, [resetToken, expirationTime, user.id]);

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Enviar o e-mail com o link de redefinição
        await sendResetEmail(email, resetLink);

        return res.status(200).send({ message: 'Link de redefinição enviado para o e-mail' });
    } catch (error) {
        console.error('Erro ao enviar e-mail de redefinição:', error);
        return res.status(500).send({ error: 'Erro interno do servidor' });
    }
};




async function sendResetEmail(email, resetLink) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // Altere para true se usar SSL/TLS direto
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: '"Sua Empresa" <noreply@suaempresa.com>',
        to: email,
        subject: 'Redefinição de Senha',
        html: `<p>Clique no link abaixo para redefinir sua senha:</p>
               <a href="${resetLink}">Redefinir Senha</a>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail enviado para:', email);
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        throw new Error('Falha ao enviar e-mail');
    }
}

 

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

UpdatePassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Verificar se o token é válido
        const query = 'SELECT * FROM users_catalog WHERE reset_token = ? AND reset_token_expiration > NOW()';
        const [results] = await pool.execute(query, [token]);

        if (results.length < 1) {
            return res.status(400).json({ errors: ["Token inválido ou expirado!"] });
        }

        const user = results[0];

        // Atualizar a senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = 'UPDATE users_catalog SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE id = ?';
        await pool.execute(updateQuery, [hashedPassword, user.id]);

        return res.status(200).send({ message: 'Senha atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        return res.status(500).send({ error: 'Erro interno do servidor' });
    }
};


  


module.exports = { Login, createUser, ResetPassword, UpdatePassword };