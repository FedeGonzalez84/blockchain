/*
    Esta API debe pensarse como un unico nodo corriendo en la red blockchain, debido a eso, al principio
    se le asigna una nodeAddress, de manera tal, de tener una direccion donde enviar la recompensa obteni
    da por el minado de un bloque.
*/
var express = require('express');
var app = express();
const Blockchain = require('./blockchain');
const {v4: uuidv4} = require('uuid'); // Crea un id unico utilizado como direccion del nodo

// Se le quitan los - para que sea un unico bloque de direccion
const nodeAddress = uuidv4().split('-').join('');

// Creo una instancia de la blockchain
const bitcoin = new Blockchain();

// Permite analizar al cuerpo de la peticion
app.use(express.json());
app.use(express.urlencoded({ extended: false}));

// Trae la bockchain completa
app.get('/blockchain', (req, res) => {
    res.send(bitcoin);
});
// Envia una transaccion
app.post('/transaction', (req, res) => {
    const blockIndex = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    res.json({
        note: `Transaction will be added in block ${blockIndex}.`
    });
});
// Mina un nuevo bloque
app.get('/mine', (req, res) => {
    // Trae el ultimo bloque de la cadena
    const lastBlock = bitcoin.getLastBlock();
    // Obtiene su hash, necesario para posteriores operaciones
    const previousBlockHash = lastBlock['hash'];
    // Arma la data del bloque a minar
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    };
    // Realiza la POW para poder minar el bloque
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    // Obtiene el hash del bloque con los parametros necesarios
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
    // Recompensar por la transaccion, el sender 00 significa que es recompensa (mining reward)
    bitcoin.createNewTransaction(12.5,'00', nodeAddress);
    // Crea el nuevo bloque
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);
    res.json({
        note: "New Block mined successfully",
        block: newBlock
    });
});
// Node esta escuchando en el puerto 3000
app.listen(3000, () => {
    console.log('Listening on port 3000');
});