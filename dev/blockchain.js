const sha256 = require('sha256');

function Blockchain(){
    this.chain = [];
    this.pendingTransactions = [];

    // Crear el bloque genesis
    this.createNewBlock(100, '0','0');
}

// Crear un bloque
Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash){
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash 
    };
    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
}
// Obtener el ultimo bloque
Blockchain.prototype.getLastBlock = function(){
    return this.chain[this.chain.length-1];
}
// Crear una transaccion
Blockchain.prototype.createNewTransaction = function(amount, sender, recepient){
    const newTransaction = {
        amount: amount,
        sender: sender,
        recepient: recepient
    } 
    this.pendingTransactions.push(newTransaction);
    // Devuelve el numero de bloque el cual debe almacenar la transaccion
    return this.getLastBlock()['index'] + 1;
}
// Hashea el bloque
Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce){
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash; 
}
// Prueba de trabajo: prueba la legitimidad del bloque creado
Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData){
    // Se hashea reiteradas veces el bloque hasta encontrar un hash que comience con '0000ADPFINUWOIE' 4 ceros
    // esto se hace incrementando el valor del nonce hasta conseguirlo
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while(hash.substring(0,4) !== '0000'){
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        console.log(hash);
    }
    return nonce;
}

module.exports = Blockchain;