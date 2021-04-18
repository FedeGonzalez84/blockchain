var express = require('express');
var app = express();

// Permite analizar al cuerpo de la peticion
app.use(express.json());
app.use(express.urlencoded({ extended: false}));

// Trae la bockchain completa
app.get('/blockchain', (req, res) => {
    res.send('Hello blockchain');
});
// Envia una transaction
app.post('/transaction', (req, res) => {
    console.log(req.body);
    res.send(`The amount of the transaction is ${req.body.amount} bitcoin.`  );
});
// Mina un nuevo bloque
app.get('/mine', (req, res) => {
    res.send('Hello from mine');
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});