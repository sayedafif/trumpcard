//imported node libraries
//server.js 
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var Game = require("./game.js");

//holds all the games
var games = [];
//holds all the users
var userList = [];
/*//redirect to test webpage
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/trumpcard.html');
});*/
//redirect to folder: public
app.use(express.static(__dirname + '/public'));
//redirect / to our index.html file
app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/public/index.html');
});
//room counter for rooms
var roomno = 1;
/*//////////////////////////////////////////////////////////////////////////////////////


           this is if a user connects to the app


/////////////////////////////////////////////////////////////////////////////////////////*/
//when a client connects, do this
io.on('connection', function (client) {
    // console.log('Client connected...'); --testing
    //when a user logs in the will sent this messahe and a wait a call back
    //this fuction will not allow a client to be assigned a username already in user on the server
    client.on("connectPlayer", function (clientNickname, callback) {
        //test message
        var message = "User " + clientNickname + " was connected.";
        console.log(message);
        //holds the user info
        var userInfo = {};
        //will be used to see if the user has used the app before
        var foundUser = false;
        var sendusers = true;
        //for loop searching all the users in the system
        for (var i = 0; i < userList.length; i++) {
            //if the user is found
            if (userList[i]["nickname"] == clientNickname) {
                //the user cant be currently playing and this should already be false
                //userInfo["isPlaying"] = false;
                //sets the user to connected -- used to check if friends are online
                if (userList[i]["isConnected"] == true) {
                    //this tells the user this nickname is already in use
                    callback(false);
                    sendusers = false;
                    foundUser = true;
                    break;
                }
                else {
                    userList[i]["isConnected"] = true;
                    //updates the users id to the one assigned by socket io
                    userList[i]["id"] = client.id;
                    //replaces the user in the users array with the new user settings
                    userInfo = userList[i];
                    //sets the user to found
                }
                foundUser = true;
                //end the loop as the user is updated and not a new user
                break;
            }
        } //close for loop
        //if the user is a new user and has never used the system before
        if (!foundUser) {
            //stores the id allocaed by socket io
            userInfo["id"] = client.id;
            //stores the users nickname --
            //the nickname will be the users
            userInfo["nickname"] = clientNickname;
            //the user cant be currently playing
            //userInfo["isPlaying"] = false;
            //the user is set to connected
            userInfo["isConnected"] = true;
            //the new user is added to the user list
            userList.push(userInfo);
        }
        //sends an updated list of users to all users
        if (sendusers) {
            io.emit("userList", userList);
        }
        callback(true);
        //advsies the what has been connected
        // io.emit("userConnectUpdate", userInfo);
    });
    //
    //when a user challenges a player to a game
    //
    client.on('challenge', function (player1, player2) {
        //loops trough all users
        console.log("incoming challenge" + player1 + player2);
        //creates the room
        var room;
        //loops through all the users to find the palyer
        for (var i = 0; i < userList.length; i++) {
            //find the player the challenge is issued to
            if (userList[i]["nickname"] == player2) {
                //checkes if they are connected
                if (userList[i]["isConnected"] == true) {
                    //advises the user of the challenge details
                    room = "challenge--" + roomno;
                    //increaments for the next challenge
                    roomno += 1;
                    client.join(room);
                    console.log(room);
                    client.broadcast.to(userList[i]["id"]).emit('incomingchallenge', player1, room);
                } //if the user is not logged in
                else {
                    //advises challenger the user is offline
                    client.broadcast.to(client.id).emit('notavailable', player2);
                }
                //ends loop
                break;
            }
        } //close for   
    });
    /*//////////////////////////////////////////////////////////////////////////////////////


           this is if a user accepts a challage informs the challenger
           and starts the game


/////////////////////////////////////////////////////////////////////////////////////////*/
    client.on('acceptchallenge', function (player1, player2, room) {
        // var cards = new shufflecards();
        console.log("accepted");
        console.log("accepted p1" + player1);
        console.log("accepted p2" + player2);
        console.log("accepted room " + room);
        //loops through all users
        for (var i = 0; i < userList.length; i++) {
            //finds user 1 and ensures they ase still connected
            if (userList[i]["nickname"] == player1 && userList[i]["isConnected"] === true) {
                //sends the load game msg
                io.to(userList[i]["id"]).emit("loadgame", room);
                //adds the challenger to the room
                //sends protocl msg
                //create a new game from this room adding the player cat, and assigning it the same same as the room, so it is easy to reference both
                var newgame = new Game(room, player1, player2);
                //console.log(userid);
                //puts to the end of the games array
                games.push(newgame);
                //the room is created here if it hasnt already been created
                client.join(room);
                //advise the players game is loading
                io.sockets.in(room).emit('connectToRoom', "game loading" + room);
                //advises the players the room and game name **NB they are the same
                io.sockets.in(room).emit('roomname', room);
                if (newgame.shufflecards()) {
                    console.log("cards got");
                    //advises the users the game details to trigger the game on each client device
                    io.sockets.in(room).emit("gameloaded", newgame.name, newgame.playerTurn, newgame.playerCurrentCard(player1), newgame.playerCurrentCard(player2), newgame.player1);
                }
            }
        }
    });

    ///////////////////////////////////////////
    client.on('closeroom', function (room) {
        client.leave(room);
    });
    /*//////////////////////////////////////////////////////////////////////////////////////


                    this is if a user player makes a move


/////////////////////////////////////////////////////////////////////////////////////////*/
    client.on('playermove', function (move, playerId, roomId) {
        //ensure the move is valid
        if (move != "cat1" && move != "cat2" && move != "cat3" && move != "cat4" && move != "cat5" && move != "cat6") {
            console.log("type" + typeof (move));
            console.log("move2 " + move);
            return;
        }
        console.log(move + playerId + roomId)
            //loops througn all the games
        for (var i = games.length - 1; i >= 0; i--) {
            console.log("loop run");
            //when the game is found
            if (games[i].name === roomId) {
                //if the ame is still in play
                if (games[i].inProgress()) {
                    //compares the cards and returns the winner
                    if (games[i].returnPlayerTurn() === playerId) {
                        //returns a message with the winner
                        io.sockets.in(roomId).emit('handWonBy', games[i].compare(move));
                        //io.sockets.in(roomId).emit(games[i].player1, "parseInt(games[i].player1Cards.length)");
                    }
                    else {
                        return;
                    }
                    //checks is the game over
                    if (games[i] == "undefined") {
                        var id;
                        if (games[i].player1 == playerId) {
                            id = games[i].player1;
                        }
                        else {
                            id = games[i].player2;
                        }
                        io.sockets.in(games[i].name).emit('disco', id);
                        return
                    }
                    var checkStatus = games[i].inProgress();
                    //if the game is over--one user has no cards left
                    if (games[i].inProgress() !== true) {
                        //tell the players who won
                        // io.emit('winnerid', checkStatus);
                        //advises the winner
                        io.sockets.in(roomId).emit('winnerid', checkStatus);
                        console.log('winner id : ' + checkStatus);
                        //deletes the game from the games array as its over
                        games.splice(i, 1);
                        ///////the game object can be destroyed now
                        //endGame(roomId);
                    } //updates the users with their next card and the users turn
                    else {
                        //advises both playes the relsts of the hand, and the cards for each users next hand
                        io.sockets.in(roomId).emit('result', move, parseInt(games[i].player1Cards.length), parseInt(games[i].player2Cards.length), games[i].returnPlayerTurn(), games[i].playerCurrentCard(games[i].player1), games[i].playerCurrentCard(games[i].player2), games[i].handwinner, move);
                    }
                } //close if
                break;
            } //close if
        } //clsoe for
    });
    client.on('disconnect', function () {
        //Useful to know when someone disconnects
        //console.log('\t socket.io:: client disconnected ' + client.id);
        console.log('user disconnected');
        //gets the clients nickname
        var clientNickname;
        //;opps through all the users
        for (var i = 0; i < userList.length; i++) {
            //finds the ser
            if (userList[i]["id"] == client.id) {
                console.log("found" + userList[i]["isConnected"]);
                userList[i]["isConnected"] = false;
                console.log("change" + userList[i]["isConnected"]);
                //loops through all the active games
                for (var x = games.length - 1; x >= 0; x--) {
                    //if the player is in this game and p1
                    if (games[x].player1 == userList[i]["nickname"]) {
                        io.sockets.in(games[x]).emit('winnerid', games[x].player2);
                        //removes and distoryes the game
                        games.splice(x, 1);
                    } //if the player is in this game and p2
                    else if (games[x].player2 == userList[i]["nickname"]) {
                        console.log('user 2');
                        //advises the other player f the disco
                        io.sockets.in(games[x]).emit('winnerid', games[x].player1);
                        //removes and distoryes the game
                        games.splice(x, 1);
                    }
                    //sets the user to not connected
                }
                //ends the loop
                //seds an updated list of users to all users
                io.emit("userList", userList);
                break;
            }
        }
    }); //client.on disconnect
});
/*//////////////////////////////////////////////////////////////////////////////////////


            This is part of the socket io library to listen for connections on port
            3000


/////////////////////////////////////////////////////////////////////////////////////////*/
//start our web server and socket.io server listening
server.listen(3000, function () {
    console.log('listening on *:3000');
});