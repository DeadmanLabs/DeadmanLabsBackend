const express = require('express');
const app = express();
const http = require('http');
const solana = require('@solana/web3.js');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const cors = require('cors');

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ response: "Hello from backend server!" });
});

app.post('/', (req, res) => {
    res.status(200).json({ response: req.body.message });
});

const server = app.listen(8081, () => {
    console.log(`Listening on port 8081`);
});

module.exports = server;