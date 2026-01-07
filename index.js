const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://awesome-chat-front.vercel.app",
    methods: ["GET", "POST"]
  }
});


let waitingQueue = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("ready", () => {
    if (waitingQueue.length > 0) {
      const partner = waitingQueue.shift();
      const room = `${partner.id}-${socket.id}`;

      socket.join(room);
      partner.join(room);

      socket.emit("matched", room);
      partner.emit("matched", room);
    } else {
      waitingQueue.push(socket);
    }
  });

  socket.on("send-message", ({ room, message }) => {
    socket.to(room).emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    waitingQueue = waitingQueue.filter((s) => s.id !== socket.id);

    socket.rooms.forEach((room) => {
      socket.to(room).emit("partner-left");
    });

    console.log("User disconnected:", socket.id);
  });
});

//for render
app.get("/", (req, res) => {
  res.send("Backend is running");
});




const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
