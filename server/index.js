const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const Room = require("./models/room");

const app = express();
const port = process.env.PORT || 3000;
var server = http.createServer(app);

var io = require("socket.io")(server);

// middleware
app.use(express.json());

const DB =
  "mongodb+srv://arun:dev123@cluster0.i0g6xn1.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection Succesfull!");
  })
  .catch((error) => {
    console.log(error);
  });

io.on("connection", (socket) => {
  console.log("connected!");
  socket.on("createRoom", async ({ nickname }) => {
    console.log(nickname);
    console.log(socket.id);
    // room creation
    try {
      let room = new Room();
      let player = {
        socketID: socket.id,
        nickname: nickname,
        playerType: "X",
      };
      room.players.push(player);
      room.turn = player;
      // Saving to DB
      room = await room.save();
      // returns an id which will be the romm id.
      const roomId = room._id.toString();
      socket.join(roomId);
      // Notify client the room has been created
      io.to(roomId).emit("createRoomSuccess", room);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("joinRoom", async ({ nickname, roomId }) => {
    console.log(nickname);
    console.log(roomId);
    try {
      if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
        socket.emit("errorOccured", "Please Enter valid room Id!");
        return;
      }
      let room = await Room.findById(roomId);
      if (room.isJoin) {
        let player = {
          nickname,
          socketID: socket.id,
          playerType: "O",
        }
        socket.join(roomId);
        room.players.push(player);
        room = await room.save();
        io.to(roomId).emit("joinRoomSuccess", room);
      } else {
        socket.emit("errorOccured", "Game is in progress, Try again later!");
      }
    } catch (error) {
      console.log(error);
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log("Server started and running on..." + port);
});
