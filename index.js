const express = require('express');
const app = express();
const cors = require('cors');
const userRoute = require('./routes/userRoutes');
const categoryRoute = require('./routes/CategoryRouter');
const productRoute = require('./routes/ProductRouter');
const uploadImageRouter = require('./routes/uploadImageRouter');
const storeRouter = require('./routes/storeRouter');
const uploadStoreImageRouter = require('./routes/UploadStoreImageRouter');


// Middleware para analisar o corpo das solicitações e habilitar CORS
app.use(express.json());
app.use(cors());

// Middleware de roteamento para os candidatos e outras rotas

app.use('/intellicatalog/v1/users', userRoute);
app.use('/intellicatalog/v1/', categoryRoute);
app.use('/intellicatalog/v1/', productRoute);
app.use('/intellicatalog/v1/', uploadImageRouter);
app.use('/intellicatalog/v1/', storeRouter);
app.use('/intellicatalog/v1/', uploadStoreImageRouter);

app.use(express.urlencoded({
    extended: true
  }))

// Define os cabeçalhos CORS manualmente não é mais necessário
    

     
// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
