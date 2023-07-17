const express = require('express');
const app = express();
const https = require('https');
const solana = require('@solana/web3.js');
const solanaSPL = require('@solana/spl-token');
const fs = require('fs');
const uuid = require('uuid');
const cors = require('cors');
const crypto = require('crypto');
const socketio = require('socket.io');
const multer = require('multer');
const childProcess = require('child_process');
const path = require('path');

const { ChatOpenAI } = require('langchain/chat_models/openai');
const { HumanChatMessage, SystemChatMessage } = require('langchain/schema');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.round() * 1e9)}`;
        const extension = path.extname(file.originalname);
        cb(null, `audio_${uniqueSuffix}${extension}.webm`);
    }
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors({}));
//Handle HTTPS

const privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const creds = { key: privateKey, cert: certificate };
const server = https.createServer(app, creds);

const whisperPath = path.resolve('whisper.exe');
const modelType = "small.en";

const posts = [];

const basicChat = new ChatOpenAI({ temperature: 0.8, openAIApiKey: process.env.OPENAI_API_KEY });

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function handleTranscribe(transcription, prompt) {

}

app.get('/', (req, res) => {
    res.status(200).json({ response: "Hello from backend server!" });
});

app.post('/', (req, res) => {
    res.status(200).json({ response: req.body.message });
});

app.post('/transcribe', upload.single('audio'), (req, res) => {
    console.log(`Audio file: ${req.file}`);
    const filePath = path.resolve(req.file.path);
    childProcess.exec(`${whisperPath} --fp16 False --output_format txt --model ${modelType} ${filePath}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        const lines = stdout.split("\n");
        let text = [];
        lines.forEach((line) => {
            if (line.trim() !== '') {
                console.log(`[!] - ${line}`);
                text.push(line.split("] ")[1]);
            }
        });
        fs.unlinkSync(filePath);
        const transcribedAudio = text.join(" ");
        handleTranscribe(transcribedAudio, "");
    });
    console.log("[+] - New audio upload! Transcribing...");
    res.json({ status: 'success' });
});

app.get('/blog/posts', (req, res) => {
    res.status(200).json(posts);
});

app.post('/blog/image', (req, res) => {

});

app.get('/about', (req, res) => {

});

app.get('/admin', (req, res) => {

});

app.get('/casino', (req, res) => {

});

app.get('/claw', (req, res) => {

});

app.get('/contact', (req, res) => {

});

app.get('/home', (req, res) => {

});

app.get('/invest', (req, res) => {

});

app.get('/lake', (req, res) => {

});

app.get('/projects', (req, res) => {

});

server.listen(8081, () => {
    console.log(`Server running on port 8081`);
});

module.exports = server;