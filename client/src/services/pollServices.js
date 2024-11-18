const API_URL = 'http://localhost:5000/api/polls';  // Update with your backend's API URL

export async function createPoll(question, options) {
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
}

export async function fetchPolls() {
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
}
