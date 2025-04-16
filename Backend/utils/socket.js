const socketIo = require("socket.io");

let io;

module.exports = {
  init: (server) => {
    console.log("✅ Initializing Socket.io...");
    
    io = socketIo(server, {
      cors: {
        origin: "http://localhost:3001", // Adjust frontend URL
        credentials: true,
      },
    });

    console.log("✅ Socket.io initialized successfully!");

    io.on("connection", (socket) => {
      console.log("🔥 New client connected:", socket.id);

      socket.on("joinBloodRequestRoom", (requestId) => {
        console.log(`📌 User joined blood request room: ${requestId}`);
        socket.join(requestId);
      });

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
