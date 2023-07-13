const express = require('express');
const app = express();
const http = require('http');
const solana = require('@solana/web3.js');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const cors = require('cors');

const server = http.createServer(app);

app.get('/', (req, res) => {
    res.status(200).json({ response: "Hello from backend server!" });
});

server.listen(8081);