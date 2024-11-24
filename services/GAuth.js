const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo de credenciais
const CLIENT_SECRET_PATH = path.join(__dirname, 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Carregar credenciais
let credentials;
try {
  credentials = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH));
} catch (error) {
  console.error('Erro ao carregar o arquivo de credenciais:', error.message);
  throw new Error('Credenciais inválidas ou não encontradas');
}

const { client_id, client_secret, redirect_uris } = credentials.web;

// Inicializar o cliente OAuth2
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Gerar URL de autenticação
function getAuthUrl() {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
}

// Retornar cliente OAuth2
function getOAuth2Client() {
  return oAuth2Client;
}

// Obter tokens a partir de um código de autenticação
async function setTokens(code) {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Erro ao obter tokens:', error.message);
    throw error;
  }
}

module.exports = {
  getAuthUrl,
  getOAuth2Client,
  setTokens,
};
