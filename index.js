const express = require('express');
const app = express();
const cors = require('cors');
const userRoute = require('./routes/userRoutes');
const categoryRoute = require('./routes/CategoryRouter');
const productRoute = require('./routes/ProductRouter');
const uploadImageRouter = require('./routes/uploadImageRouter');
const storeRouter = require('./routes/storeRouter');
const uploadStoreImageRouter = require('./routes/UploadStoreImageRouter');
const ServicesRouter = require('./routes/ServicesRouter');
const AvailabilityRouter = require('./routes/AvailabilityRouter');
const AppointmentsRouter = require('./routes/AppointmentsRouter');
const OrdersRouter = require('./routes/OrderRoutes');
const ComboRouter = require('./routes/ComboRouter');
const ComboProdutoRouter = require('./routes/ComboProdutoRouter');

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
app.use('/intellicatalog/v1/', ServicesRouter);
app.use('/intellicatalog/v1/', AvailabilityRouter);
app.use('/intellicatalog/v1/', AppointmentsRouter);
app.use('/intellicatalog/v1/', OrdersRouter);
app.use('/intellicatalog/v1/', ComboRouter);
app.use('/intellicatalog/v1/', ComboProdutoRouter);


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.urlencoded({
    extended: true
  }))

 

     
// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
