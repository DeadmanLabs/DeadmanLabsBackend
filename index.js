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
const fetch = require('node-fetch');
const musicMeta = require('music-metadata');

const { ChatOpenAI } = require('langchain/chat_models/openai');
const { HumanChatMessage, SystemChatMessage } = require('langchain/schema');

app.use(express.json());
app.use(cors({}));

//Handle HTTPS
const privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const creds = { key: privateKey, cert: certificate };
const server = https.createServer(app, creds);

//Transcription Settings
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
const transcriptionModel = "gpt-3.5-turbo-16k";
const upload = multer({ storage });
const whisperPath = path.resolve('whisper.exe');
const modelType = "small.en";
const basicChat = new ChatOpenAI({ temperature: 0.9, openAIApiKey: process.env.OPENAI_API_KEY, modelName: transcriptionModel });
const titleChat = new ChatOpenAI({ temperature: 1.0, openAIApiKey: process.env.OPENAI_API_KEY, modelName: transcriptionModel });
const obsidianServerPort = 4444;

//Blog Settings
const posts = [];

const getCurrentTime = () => {
    const now = new Date();
    return now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
};

//Time Settings
const units = ['day', 'hour', 'min', 'sec'];
const lengths = [24*60*60, 60*60, 60, 1];
const formatDuration = (s) => {
    const result = "";
    for (let i = 0; i < lengths.length; i++) {
        const val = Math.floor(duration / lengths[i]);
        if (result !== "" || val !== 0)
        {
            result += val;
        }
        duration -= val * lengths[i];
    }
    return result;
}

async function getAudioDuration(filename) {
    const metadata = await musicMeta.parseFile(filename);
    const duration = metadata.format.duration;
    return formatDuration(duration);
}

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function handleTranscribe(transcription, file) {
    console.log(`Processing idea...`);
    const summerizeNote = await basicChat.call([
        new SystemMessage(
            `You are an AI assistant that takes long transcriptions and summarizes them to the key details and facts for a notebook. You are detailed, but do not waste your time on irrelevant information.`
        ),
        new HumanMessage(
            `Please summarize the text below for my notes:

            "
            ${transcription}
            "`
        )
    ]);
    const keyPoints = await basicChat.call([
        new SystemMessage(
            `You are an AI assistant that takes long transcriptions and compiles them to the key details and facts for a notebook. You are detailed, but do not waste your time on irrelevant information.`
        ),
        new HumanMessage(
            `Please compile the text below into the key points for my notes:

            "
            ${transcription}
            "`
        )
    ]);
    const titleNote = await titleChat.call([
        new SystemMessage(
            `You are an AI assistant that takes notes and generates a title for the note page. You only respond with the title and create the most relevant title to the provided content.`
        ),
        new HumanMessage(
            `Please create a note title for the content below:

            "
            ${summerizeNote.content}

            ${keyPoints.content}
            "`
        )
    ]);
    const markDown = await basicChat.call([
        new SystemMessage(
            `You are an AI assistant that takes notes and generates a markdown copy of the notes. You only respond with the markdown code and can only write content in the markdown that is from the provided content. You also add code blocks, titles and sub titles where applicable. You may use the following commands inside the markdown to insert details: "[insertDate]" to insert the current date, "[insertTime]" to insert the current time, "[insertDuration]" to insert the duration of the audio that the notes were generated from.`
        ),
        new HumanMessage (
            `Please create a markdown note for the content below:

            "
            ${summerizeNote.content}

            ${keyPoints.content}
            "`
        )
    ]);
    const result = markDown
        .replace("[insertDate]", new Date().toString())
        .replace("[insertTime]", getCurrentTime())
        .replace("[insertDuration]", await getAudioDuration(file));
    const response = await fetch(`https://127.0.0.1:${obsidianServerPort}/insert`, 
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: titleNote.content.replace('"', ''),
            body: markDown.content
        })
    });
    return response;
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
    childProcess.exec(`${whisperPath} --fp16 False --output_format txt --model ${modelType} ${filePath}`, async (error, stdout, stderr) => {
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
        const transcribedAudio = text.join(" ");
        const response = await handleTranscribe(transcribedAudio, filePath);
    });
    console.log("[+] - New audio upload! Transcribing...");
    res.json({ status: 'success' });
});

app.get('/blog/posts', (req, res) => {
    res.status(200).json(posts);
});

app.post('/blog/image', (req, res) => {

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