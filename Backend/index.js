const express= require('express');
const { connectToDatabase } = require('./database');
const app= express();
const DB= require('./database').connectToDatabase;
const userRouter=require("./routes/userRouter")
const cors = require('cors');
const cookieParser = require("cookie-parser");
const BloodRequestRouter= require("./routes/BloodRequestRouter")
const dotenv=require("dotenv"); 
const http = require('http');    
const socket = require('./utils/socket');

dotenv.config();

// Run the database connection
connectToDatabase();

//Add necessary middleware
app.use(express.json());
app.use(cookieParser()); // ✅ Middleware to handle cookies

// TODO: Check the below 
/*app.use(express.urlencoded({extended:true})) Was used in project setup */

app.use(cors({
    origin: "http://localhost:3001", // Allow your frontend domain
    credentials: true, // Allow credentials like cookies
}));

const server = http.createServer(app);

socket.init(server); // Initialize WebSocket

server.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});


app.options('*', cors());

app.use("/api/Requests", BloodRequestRouter)

app.use("/api/users", userRouter)



