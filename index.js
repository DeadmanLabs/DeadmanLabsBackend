const express = require('express');
const app = express();
const http = require('http');
const solana = require('@solana/web3.js');
const solanaSPL = require('@solana/spl-token');
const fs = require('fs');
const uuid = require('uuid');
const cors = require('cors');
const crypto = require('crypto');
const socketio = require('socket.io');

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