//library to read the json file of cards
var fs = require("fs");
//read and save the cards
var content = fs.readFileSync("cards.JSON");
var cards;
/* set up the game beteen two players*/
function Game(name, p1, p2) {
    // the index var is increased if cards are equal on a hand
    this.index = 0;
    //the prams are used to set the following
    this.name = name;
    //playes
    this.player1 = p1;
    this.player2 = p2;
    //turn
    this.playerTurn = p1;
    console.log("New game created");
    this.handwinner = 0;
}
/*
   returns the value of the playre whos turn it currently is   
*/
Game.prototype.returnPlayerTurn = function () {
        return this.playerTurn;
    }
    //returns how many cards player 1 has left   
Game.prototype.p1remaining = function () {
        return this.player1Cards.length;
    }
    //returns how many cards player 2 has left 
Game.prototype.p2remaining = function () {
        return this.player2Cards.length;
    }
    /*
        This function is used to return a users current card 
    */
Game.prototype.playerCurrentCard = function (userId) {
        //returns player 1 current card
        console.log(this.player1Cards[0]);
        if (this.player1 === userId) {
            return this.player1Cards[this.index]["cardId"];
        } //returns player 1 current card
        else if (this.player2 === userId) {
            return this.player2Cards[this.index]["cardId"];
        }
        //returns error if the player is not player 1 or player 2
        else {
            return "invalid ";
        }
    } //close playerCurrentCard
    /*
        shuffle the cards and assign the cards to each player
    */
Game.prototype.shufflecards = function () {
        cards = JSON.parse(content);
        //reperesents the total amount of a users cards
        var amount = cards.length;
        var randomCard;
        var tempCard;
        //loops through all the users cards
        while (amount) {
            //gets a random card based on the amount of cards remaining and decreates amount val
            randomCard = Math.random() * amount-- | 0;
            //hold a card using a tempary index
            tempCard = cards[amount];
            //places a new card in the location the temp card we just stored is 
            cards[amount] = cards[randomCard];
            //buts the temp card in the postion of the car we jsut rearranged
            cards[randomCard] = tempCard;
        }
        console.log(cards);
        //this.p1cards = cards.splice(0,15);
        console.log(cards.length);
        // this.p2cards = cards;
        this.player1Cards = cards.splice(0, 15);
        this.player2Cards = cards;
        console.log(this.player2Cards[0]);
        console.log(this.player1Cards[0]);
        console.log(this.player1Cards.length);
        console.log(this.player2Cards.length);
        return true;
    }
    /*
        this is a function used to compare two users cards durig a hand
        if 2 cards draw the hand is repeated 
        a selected pram is passed into this method to see who 
    */
Game.prototype.compare = function (selected) {
        //gets both users current card
        var card1 = this.player1Cards[this.index];
        var card2 = this.player2Cards[this.index];
        if (card1[selected] < card2[selected]) {
            var times = this.index + 1;
            this.player1Cards.splice(0, times);
            for (var i = 0; i < times; i++) {
                this.player2Cards.push(this.player2Cards.shift());
            }
            if (this.playerTurn == this.player2) {
                this.playerTurn = this.player1;
            }
            else {
                this.playerTurn = this.player2;
            }
            this.index = 0;
            this.handwinner = this.player2;
            //returns player 2 the winner of the hand
            return this.player2;
        }
        //if the selected value on card1 is greater than that of card 2
        //in this hand player 1 wins
        else if (card1[selected] > card2[selected]) {
            //counter for the amount of cards currently in play
            var times = this.index + 1;
            //remove the card from this users deck (and all previously drawn cards
            this.player2Cards.splice(0, times);
            //console.log(this.player1Cards.toString());
            console.log("player1");
            /*if the last hands where drawn the amount of drawn cards will be moved to the end of the player deck here otherwise 1 card
            will be moved to the end of the deck*/
            for (var i = 0; i < times; i++) {
                //moves the card at index 0 to the end of array
                this.player1Cards.push(this.player1Cards.shift());
            }
            //console.log(this.player2Cards.toString());
            console.log(this.player2Cards.length);
            ///sets the player turn to the winner p2
            if (this.playerTurn == this.player2) {
                this.playerTurn = this.player1;
                console.log("here")
            }
            else {
                this.playerTurn = this.player2;
                console.log("here1")
            }
            console.log(this.player1Cards.length);
            //resets index to 0(index only increases on drawn hands)
            this.index = 0;
            this.handwinner = this.player1;
            //returns player 1 the winner of the hand
            return this.player1;
        }
        //if the secelted value on both cards are equal
        else {
            if (this.playerTurn == this.player2) {
                this.playerTurn = this.player1;
                console.log("here")
            }
            else {
                this.playerTurn = this.player2;
                console.log("here1")
            }
            //console.log("equal");
            //if this is both players last card
            if (this.player1Cards.length == 1 && this.player1Cards.length == 1) {
                //remove the card from both player resulting in a drawn game
                this.player1Cards.splice(0, 1);
                this.player2Cards.splice(0, 1);
            } //if this is p1s last card
            else if (this.player1Cards.length == 1) {
                //remove the card making p1 the loser of the game
                this.player1Cards.splice(0, 1);
            } //if this is p2s last card
            else if (this.player2Cards.length == 1) {
                //remove the card making p2 the loser of the game
                this.player2Cards.splice(0, 1);
            }
            else {
                //increase the index so next hand this card along with the 
                //users next card is in play
                this.index += 1;
            }
            this.handwinner = 0;
            //returns hand is a draw
            return "draw";
        }
    } //end of compare
    /*
        this is called to check if a game is still in progress, 
        if both users have no cards the game is a draw, if one user has no cards the other player is the winner and the winners id is returned otherwise true is returned to let the users know the game is still in
        progress.
    */
Game.prototype.inProgress = function () {
        //both players have no cards left
        if (typeof this.player1Cards[0] === 'undefined' && typeof this.player2Cards[0] === 'undefined') {
            //draw is returned
            return "draw";
        }
        //player 1 has no cards left
        else if (typeof this.player1Cards[0] === 'undefined') {
            //player 2 id returned
            return this.player2;
        }
        //player 2 has no cards left
        else if (typeof this.player2Cards[0] === 'undefined') {
            //player 1 id returned
            return this.player1;
        }
        //the game is still in progress
        else {
            return true;
        }
    } //end of inProgress
    //exports the Game objects for other classes to use
module.exports = Game;