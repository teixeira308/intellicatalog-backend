const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
const { Logmessage } = require('../helper/Tools');

dotenv.config();

exports.required = (req, res, next) => {

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        Logmessage(error," : Falha na autenticação")
        return res.status(401).send({ mensagem: 'Falha na autenticação' });
    }

}

exports.optional = (req, res, next) => {

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        next();
    }

}