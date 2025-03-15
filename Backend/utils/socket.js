const socketIo = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    io = socketIo(server, { cors: { origin: "*" } });

    io.on('connection', (socket) => {
      console.log(`🔗 New user connected: ${socket.id}`);

      socket.on('registerForNotifications', (userId) => {
        socket.join(userId); // Allow private notifications
        console.log(`✅ User ${userId} registered for blood request notifications`);
      });

      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
      });
    });
  },
  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
  }
};
