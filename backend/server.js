const express = require('express')
const path = require('path')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const userRoutes = require('./routes/userRoutes')
const chatRoutes = require('./routes/chatRoutes')
const messageRoutes = require('./routes/messageRoutes')

const app = express()
app.use(express.json());
app.use(express.static(path.join(__dirname, 'index')))
app.use(cors())

dotenv.config()
connectDB()

app.use('/api/user', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/message', messageRoutes)


const POST = process.env.PORT

const server = app.listen(POST, () => {
	console.log('Server up')
})

const io = require("socket.io")(server, {
	pingTimeout: 60000,
	cors: {
	  origin: "http://localhost:3001",
	  // credentials: true,
	},
  });
  
  io.on("connection", (socket) => {
	console.log("Connected to socket.io");
	socket.on("setup", (userData) => {
	  socket.join(userData._id);
	  socket.emit("connected");
	});
  
	socket.on("join chat", (room) => {
	  socket.join(room);
	  console.log("User Joined Room: " + room);
	});
	socket.on("typing", (room) => socket.in(room).emit("typing"));
	socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  
	socket.on("new message", (newMessageRecieved) => {
	  var chat = newMessageRecieved.chat;
  
	  if (!chat.users) return console.log("chat.users not defined");
  
	  chat.users.forEach((user) => {
		if (user._id == newMessageRecieved.sender._id) return;
  
		socket.in(user._id).emit("message recieved", newMessageRecieved);
	  });
	});
  
	socket.off("setup", () => {
	  console.log("USER DISCONNECTED");
	  socket.leave(userData._id);
	});
  });