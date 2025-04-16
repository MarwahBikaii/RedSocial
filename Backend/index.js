const express = require("express");
const { connectToDatabase } = require("./database");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const http = require("http");
const socket = require("./utils/socket"); // ✅ Import socket module

dotenv.config();

// Connect to Database
connectToDatabase();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:3001", // Adjust to match frontend
    credentials: true,
}));

// Create HTTP server
const server = http.createServer(app);

// ✅ Initialize WebSocket BEFORE starting server
socket.init(server); 

// ✅ Listen for connections
server.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});

// Routes
app.use("/api/Requests", require("./routes/BloodRequestRouter"));
app.use("/api/users", require("./routes/userRouter"));
app.use("/api/EducationalContent", require("./routes/EducationalContentRouter"));
