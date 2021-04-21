var express = require('express');
var app = express();
const Blockchain = require('./blockchain');
const {v4: uuidv4} = require('uuid'); // Crea un id unico utilizado como direccion del nodo
const rp = require('request-promise'); // para hacer peticiones a otros endpoints


// Accedo a traves de nodemon (ver package.json, cuando se ingresa el comando nodemon)
const port = process.argv[2];

// Se le quitan los - para que sea un unico bloque de direccion
const nodeAddress = uuidv4().split('-').join('');

// Creo una instancia de la blockchain
const bitcoin = new Blockchain();

// Permite analizar al cuerpo de la peticion
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
// ---------------------------------------------------------------------
// Trae la bockchain completa
app.get('/blockchain', (req, res) => {
    res.send(bitcoin);
});
// ---------------------------------------------------------------------
// Envia una transaccion
app.post('/transaction', (req, res) => {
    const blockIndex = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    res.json({
        note: `Transaction will be added in block ${blockIndex}.`
    });
});
// ---------------------------------------------------------------------
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
// ---------------------------------------------------------------------
// Registrar un nodo (en un nodo en particular) y hacer un broadcast a toda la red
// (a los otros nodos)
// 1--> Se almacena en el nodo actual la direccion del nuevo nodo
// 2--> Se hace mediante el endpoint /register-node un broadcast con la direccion del nuevo nodo
// 3--> Se envia al nuevo nodo, las direcciones de todos los nodos de la red 

app.post('/register-and-broadcast-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    // Registro el nuevo nodo en el nodo actual
    if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1 )bitcoin.networkNodes.push(newNodeUrl);
    
    // Pone todos los request en este arrays, ya que es asincronico 
    const regNodesPromises = [];

    // Realizo un broadcast a los otros nodos informando el nodo nuevo
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl},
            json: true
        }
        regNodesPromises.push(rp(requestOptions));
    });
    // Ejecuta una promesa una vez que fueron ejecutadas las peticiones
    Promise.all(regNodesPromises)
	.then(data => {
		const bulkRegisterOptions = {
			uri: newNodeUrl + '/register-nodes-bulk',
			method: 'POST', 
            // Envia todos los nodos y el nodo actual
			body: { allNetworkNodes: [ ...bitcoin.networkNodes, bitcoin.currentNodeUrl ] }, 
			json: true
		};

		return rp(bulkRegisterOptions);
	})
	.then(data => {
		res.json({ note: 'New node registered with network successfully.' });
	});
});
// ---------------------------------------------------------------------
// Registrar un nodo nuevo, en cada uno de los nodos de la red
app.post('/register-node', (req, res) => {
	const newNodeUrl = req.body.newNodeUrl;
	const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
	const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
	if (nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(newNodeUrl);
	res.json({ note: 'New node registered successfully.' });
});
// ---------------------------------------------------------------------
// Envia informacion de todos los nodos de la red (al nodo nuevo)
app.post('/register-nodes-bulk', (req, res) => {
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl => {
		const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
		if (nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);
	});

	res.json({ note: 'Bulk registration successful.' });
});
// ---------------------------------------------------------------------
// Node esta escuchando en el puerto 3000
app.listen(port, () => {
    console.log(`Listening on port ${port}..`);
});