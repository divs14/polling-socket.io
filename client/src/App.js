import React, { useState, useEffect } from 'react';
import './App.css';
import { io } from 'socket.io-client';

function App() {
    const [polls, setPolls] = useState([]);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [socket, setSocket] = useState(null);

    const API_URL = 'http://localhost:5000/api/polls'; // Replace with your backend's API endpoint

    // Function to fetch existing polls
    const fetchPolls = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Error fetching polls');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    // Function to create a new poll
    const createPoll = async (question, options) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question, options }),
            });

            if (!response.ok) {
                throw new Error('Error creating poll');
            }

            const pollData = await response.json();
            return pollData;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    // Function to vote on a poll option
    const voteOnPoll = async (pollId, optionId) => {
        console.log(`Voting on pollId: ${pollId}, optionId: ${optionId}`); // Debug log
        try {
            const response = await fetch(`http://localhost:5000/api/vote/${pollId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ optionId }),
            });

            if (!response.ok) {
                console.log(response);
                
                console.log("not good");
                
                throw new Error('Error casting vote');
            }

            const updatedPoll = await response.json();
            setPolls((prevPolls) =>
                prevPolls.map((poll) => (poll._id === updatedPoll._id ? updatedPoll : poll))
            );
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch existing polls when the app loads
    useEffect(() => {
        fetchPolls().then(data => setPolls(data));

        // Socket setup for real-time updates
        const socketInstance = io('http://localhost:5000'); // Replace with your backend's URL
        setSocket(socketInstance);
        socketInstance.on('pollCreated', (newPoll) => {
            setPolls(prevPolls => [...prevPolls, newPoll]); // Add new poll to state
        });

        socketInstance.on('pollUpdate', ({ pollId, options }) => {
            setPolls(prevPolls =>
                prevPolls.map(poll =>
                    poll._id === pollId ? { ...poll, options } : poll
                )
            );
        });

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Handle form submission to create a new poll
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (question && options.length >= 2) {
            const newPoll = await createPoll(question, options);
            if (newPoll) {
                setPolls(prevPolls => [...prevPolls, newPoll]);
            }
        } else {
            alert("Please provide a valid question and at least two options.");
        }
    };

    return (
        <div className="App">
            <h1>Polling App</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Question:
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Enter question"
                    />
                </label>
                <br />
                <label>
                    Options:
                    {options.map((option, index) => (
                        <input
                            key={index}
                            type="text"
                            value={option}
                            onChange={(e) => {
                                const newOptions = [...options];
                                newOptions[index] = e.target.value;
                                setOptions(newOptions);
                            }}
                            placeholder={`Option ${index + 1}`}
                        />
                    ))}
                </label>
                <br />
                <button type="submit">Create Poll</button>
            </form>

            <h2>Existing Polls</h2>
            <ul>
                {polls.map((poll) => (
                    <li key={poll._id}>
                        <h3>{poll.question}</h3>
                        <ul>
                            {poll.options.map((option) => (
                                <li key={option._id}>
                                    {option.option}: {option.votes} votes
                                    <button onClick={() => voteOnPoll(poll._id, option._id)}>
                                        Vote
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
