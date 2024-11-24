const { google } = require('googleapis');
const { getGoogleOAuthClient } = require('../services/dbService'); // Serviço para acessar o banco

async function getAuthUrl(clientId) {
  const oAuth2Client = await createOAuth2Client(clientId);
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });
}

async function setTokens(clientId, code) {
  const oAuth2Client = await createOAuth2Client(clientId);
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  return tokens;
}

async function createOAuth2Client(clientId) {
  const credentials = await getGoogleOAuthClient(clientId);
  const { client_id, client_secret, redirect_uri } = credentials;

  return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
}

module.exports = {
  getAuthUrl,
  setTokens,
};
