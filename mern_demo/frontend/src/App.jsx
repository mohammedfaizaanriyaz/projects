import { useEffect, useState } from "react";

function App() {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    const getMessages = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/messages"
            );

            const data = await response.json();

            setMessages(data);
        } catch (error) {
            console.error("GET error:", error);
        }
    };

    useEffect(() => {
        getMessages();
    }, []);

    const saveMessage = async () => {
        if (!message.trim()) {
            return;
        }

        try {
            await fetch(
                "http://localhost:5000/api/messages",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: message
                    })
                }
            );

            setMessage("");

            getMessages();
        } catch (error) {
            console.error("POST error:", error);
        }
    };

    return (
        <div>
            <h1>React ↔ Node ↔ MariaDB</h1>

            <input
                type="text"
                placeholder="Enter a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />

            <button onClick={saveMessage}>
                Save
            </button>

            <h2>Messages from MariaDB</h2>

            {messages.map((item) => (
                <p key={item.id}>
                    {item.message}
                </p>
            ))}
        </div>
    );
}

export default App;