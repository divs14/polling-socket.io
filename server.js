require("dotenv").config();
const MONGO_URI=process.env.MONGO_URI;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const path = require('path');
const Poll = require('./models/Poll');
// Middleware setup
const app = express();
app.use(cors());
app.use(express.json());


// CORS options to allow frontend from localhost:3000
const corsOptions = {
    origin: 'http://localhost:3000',  // Allow frontend to access backend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));  
// MongoDB connection


mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Socket.IO setup
const server = app.listen(5000, () => {
    console.log('Server running on port 5000');
});

const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',  // Allow connections from frontend
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
    }
});


io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

// Create a new poll
app.post('/api/polls', async (req, res) => {
    const { question, options } = req.body;
    try {
        if (!question || !options || options.length < 2) {
            return res.status(400).json({ message: 'Question and at least two options are required.' });
        }

        const newPoll = new Poll({
            question: question,
            options: options.map(option => ({ option, votes: 0 }))
        });

        await newPoll.save();
        io.emit('pollCreated', newPoll); // Emit real-time event
        res.status(201).json(newPoll);
    } catch (error) {
        res.status(400).json({ message: 'Error creating poll', error });
    }
});

// Fetch all polls
app.get('/api/polls', async (req, res) => {
    try {
        const polls = await Poll.find();
        res.status(200).json(polls);
    } catch (error) {
        res.status(400).json({ message: 'Error fetching polls', error });
    }
});

// Vote API
app.post('/api/vote/:pollId', async (req, res) => {
    const { pollId } = req.params; // Poll ID
    const { optionId } = req.body; // Option ID

    console.log(`Received pollId: ${pollId}, optionId: ${optionId}`); // Debug log

    try {
        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        const option = poll.options.id(optionId);
        if (!option) {
            return res.status(404).json({ message: 'Option not found' });
        }

        option.votes++;
        await poll.save();

        io.emit('pollUpdate', { pollId: poll._id, options: poll.options });
 // Emit real-time update
        res.status(200).json(poll);
    } catch (error) {
        res.status(400).json({ message: 'Error casting vote', error });
    }
});
