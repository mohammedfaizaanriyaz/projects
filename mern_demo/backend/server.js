const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;


// Test route
app.get("/", (req, res) => {
    res.send("Node + Express server is working");
});


// GET - Read messages from MariaDB
app.get("/api/messages", async (req, res) => {
    try {
        const rows = await pool.query(
            "SELECT * FROM messages"
        );
        console.log("GET Request received");

        res.json(rows);

    } catch (error) {
        console.error("GET ERROR:", error);

        res.status(500).json({
            error: "Failed to get messages"
        });
    }
});


// POST - Save message to MariaDB
app.post("/api/messages", async (req, res) => {
    try {
        const { message } = req.body;

        console.log("POST Received message:", message);

        if (!message) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        const result = await pool.query(
            "INSERT INTO messages (message) VALUES (?)",
            [message]
        );

        console.log("Message inserted successfully");

        res.status(201).json({
            message: "Message saved successfully",
            id: Number(result.insertId)
        });

    } catch (error) {
        console.error("POST ERROR:", error);

        res.status(500).json({
            error: "Failed to save message"
        });
    }
});


// Start Express server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});