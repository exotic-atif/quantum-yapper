const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/user");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
const MAX_MSG_LENGTH = 2000;

// Static files with cache headers
app.use(express.static(publicDirectoryPath, {
  maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
  etag: true,
}));

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage("System", "Welcome to Quantum Yapper!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("System", `${user.username} has joined`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    if (!user) {
      return callback("You are not authenticated");
    }

    // Trim and validate
    if (typeof message !== "string") {
      return callback("Invalid message");
    }

    message = message.trim();
    if (!message) {
      return callback("Message cannot be empty");
    }

    if (message.length > MAX_MSG_LENGTH) {
      return callback("Message too long (max " + MAX_MSG_LENGTH + " characters)");
    }

    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }

    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  // Typing indicators
  socket.on("typing", (isTyping) => {
    const user = getUser(socket.id);
    if (user) {
      socket.broadcast.to(user.room).emit("userTyping", {
        username: user.username,
        isTyping: !!isTyping,
      });
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("System", `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);

    if (!user) {
      return callback("You are not authenticated");
    }

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.Latitude},${coords.Longitude}`
      )
    );
    callback();
  });
});

server.listen(port, () => {
  console.log(`Quantum Yapper is running on port ${port}`);
});
