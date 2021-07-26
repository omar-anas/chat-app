const path = require('path');
const http= require('http');
const express = require('express');
const socketio = require('socket.io');
const {generateMessages} = require('./utils/messages.js')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users');
const { Socket } = require('dgram');

const app = express();

const publicDirectoryPath=path.join(__dirname,'../public');

app.use(express.static(publicDirectoryPath));

const server = http.createServer(app);
const io = socketio(server);

io.on("connection",(socket)=>{

    console.log('this is esablished connection ')

    socket.on('join',({username , room},callback)=>{
        const{error , user}= addUser({id:socket.id,username , room})
        if(error){
            return callback(error);
        }
        socket.join(user.room)
        socket.emit("message",generateMessages(user.username,'Welcome !'));
        socket.broadcast.to(user.room).emit('message',generateMessages(`Everyone welcome ${user.username}!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback();
    })

    socket.on('sendMessage',(value,callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('message',generateMessages(user.username,value));
        callback();
    })
    socket.on('location',(coords,callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('sendLocation',generateMessages(user.username,`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
        io.to(user.room).emit('message',generateMessages("A user has left!"))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        
    }})
})



const PORT = process.env.PORT;

server.listen(process.env.PORT,()=>{
    console.log('this app is runing on port ' + process.env.PORT);
})