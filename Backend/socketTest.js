const io = require("socket.io-client");

const socket = io("http://localhost:3000"); // Connect to your server

const requestId = "67cd9988b17fc98cba9d6962"; // Replace with an actual blood request ID

socket.emit("joinBloodRequestRoom", requestId);

socket.on("bloodRequestUpdated", (updatedRequest) => {
  console.log("📢 Blood request updated:", updatedRequest);
});

socket.on("newBloodRequest", (data) => {
  console.log("🆕 New Blood Request Received:", data);
});

socket.on("testEvent", (data) => {
  console.log("⚡ Test Event:", data);
});

// Keep the script running
setInterval(() => console.log("Listening for updates..."), 5000);
