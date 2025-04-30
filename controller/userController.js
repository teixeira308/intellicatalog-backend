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

        const { email, password, nome } = req.body;
        Logmessage("Criar usuario", email)
        // Verificar se o email já está cadastrado
        const [existingUser] = await pool.execute('SELECT * FROM users_catalog WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).send({ message: 'Usuário já cadastrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir o usuário no banco de dados
        const query = 'INSERT INTO users_catalog (email,password,nome) VALUES (?,?,?)';
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

        const resetLink = `${process.env.FRONTEND_URL}/redefinirsenha/${resetToken}`;
        console.log(resetLink)
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
        secure: true, // Altere para true se usar SSL/TLS direto
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: '"Vitrine Smart" <contato@vitrinesmart.com>',
        to: email,
        subject: 'Redefinição de Senha',
        html: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Inter', Arial, sans-serif;
                            background-color: #f4f4f9;
                            margin: 0;
                            padding: 0;
                        }
                        table {
                            width: 100%;
                            padding: 20px;
                        }
                        .email-container {
                            width: 600px;
                            background-color: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }
                        .header {
                            background-color: #676767;
                            padding: 20px;
                            text-align: center;
                        }
                        .header img {
                            width: 150px;
                        }
                        .content {
                            padding: 30px;
                            color: #333;
                            font-family: 'Kanit', sans-serif;
                        }
                        .content h2 {
                            color: #676767;
                            text-align: center;
                        }
                        .content p {
                            font-size: 16px;
                        }
                        .btn {
                            display: block;
                            width: 200px;
                            margin: 20px auto;
                            padding: 10px 20px;
                            background-color: #676767;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 4px;
                            text-align: center;
                            font-weight: bold;
                        }
                        .footer {
                            background-color: #f1f1f1;
                            text-align: center;
                            padding: 15px;
                        }
                        .footer p {
                            font-size: 12px;
                            color: #888;
                        }
                    </style>
                </head>
                <body>
                    <table role="presentation">
                        <tr>
                            <td align="center">
                                <table role="presentation" class="email-container">
                                    <tr class="header">
                                        <td>
                                            <!-- Sem logo, apenas o nome ou o título da empresa -->
                                            <h1 style="color: white;">Vitrine Smart</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="content">
                                            <h2>Redefinição de Senha</h2>
                                            <p>Olá,</p>
                                            <p>Recebemos uma solicitação para redefinir sua senha. Para continuar, clique no link abaixo:</p>
                                            <p><a href="${resetLink}" class="btn">Redefinir Senha</a></p>
                                            <p>Se você não solicitou a redefinição, pode ignorar este e-mail.</p>
                                            <p>Atenciosamente,</p>
                                            <p><strong>Equipe Vitrine Smart</strong></p>
                                        </td>
                                    </tr>
                                    <tr class="footer">
                                        <td>
                                            <p>Este e-mail foi enviado para ${email}.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `,
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
        if ((user.email === "admin@email.com")) {
            console.log("token admin")
            if (isPasswordValid) {
                const token = jwt.sign({
                    userId: user.id,
                    email: user.email
                }, process.env.JWT_SECRET);
                return res.status(200).send({
                    message: 'Autenticado com sucesso',
                    userId: user.id,
                    nome: user.nome,
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
                nome: user.nome,
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