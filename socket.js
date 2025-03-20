const socketIO = require("socket.io");

function initializeSocket(server) { 
  const io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN||"*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);
    // Send acknowledgment to the client
    socket.emit("handshake", { message: "Connected to WebSocket server" })
    socket.on("joinAuction", (couponId) => {
      socket.join(couponId);
      console.log(`User joined auction: ${couponId}`);
    });
  });

  return io;
}

module.exports = initializeSocket;
