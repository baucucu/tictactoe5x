(function init() {
    const P1 = 'X';
    const P2 = 'O';
    let player;
    let game;
  
    // const socket = io.connect('http://tic-tac-toe-realtime.herokuapp.com'),
    const socket = io.connect('http://localhost:5500');
  
    class Player {
      constructor(name, type) {
        this.name = name;
        this.type = type;
        this.currentTurn = true;
        this.playsArr = 0;
      }
  
  
      // Set the bit of the move played by the player
      // tileValue - Bitmask used to set the recently played move.
      updatePlaysArr(tileValue) {
        this.playsArr += tileValue;
      }
  
      getPlaysArr() {
        return this.playsArr;
      }
  
      // Set the currentTurn for player to turn and update UI to reflect the same.
      setCurrentTurn(turn) {
        this.currentTurn = turn;
        const message = turn ? 'Your turn' : 'Waiting for Opponent';
        $('#turn').text(message);
      }
  
      getPlayerName() {
        return this.name;
      }
  
      getPlayerType() {
        return this.type;
      }
  
      getCurrentTurn() {
        return this.currentTurn;
      }
    }
  
    // roomId Id of the room in which the game is running on the server.
    class Game {
      constructor(roomId) {
        this.roomId = roomId;
        this.board = [];
        this.moves = 0;
      }
  
      // Create the Game board by attaching event listeners to the buttons.
      createGameBoard() {
        function tileClickHandler() {
          const row = parseInt(this.id.split('_')[0], 10);
          const col = parseInt(this.id.split('_')[1], 10);
          if (!player.getCurrentTurn() || !game) {
            alert('Its not your turn!');
            return;
          }
  
          if ($(this).prop('disabled')) {
            alert('This tile has already been played on!');
            return;
          }
  
          // Update board after your turn.
          game.playTurn(this);
          game.updateBoard(player.getPlayerType(), row, col, this.id);
  
          player.setCurrentTurn(false);
          player.updatePlaysArr(1 << ((row * 15) + col));
  
        //   game.checkWinner();
          game.checkWinner(player.getPlayerType(),row, col);
        }
  
        for (let i = 0; i < 15; i++) {
          this.board.push([' ', ' ', ' ',' ', ' ', ' ',' ', ' ', ' ',' ', ' ', ' ',' ', ' ', ' ',]);
          for (let j = 0; j < 15; j++) {
            $(`#${i}_${j}`).on('click', tileClickHandler);
          }
        }
      }
      // Remove the menu from DOM, display the gameboard and greet the player.
      displayBoard(message) {
        $('.menu').css('display', 'none');
        $('.gameBoard').css('display', 'block');
        $('#userHello').html(message);
        this.createGameBoard();
      }
      /**
       * Update game board UI
       *
       * @param {string} type Type of player(X or O)
       * @param {int} row Row in which move was played
       * @param {int} col Col in which move was played
       * @param {string} tile Id of the the that was clicked
       */
      updateBoard(type, row, col, tile) {
        $(`#${tile}`).text(type).prop('disabled', true);
        this.board[row][col] = type;
        this.moves++;
      }

      getRoomId() {
        return this.roomId;
      }
  
      // Send an update to the opponent to update their UI's tile
      playTurn(tile) {
        const clickedTile = $(tile).attr('id');
  
        // Emit an event to update other player that you've played your turn.
        socket.emit('playTurn', {
          tile: clickedTile,
          room: this.getRoomId(),
        });
      }
      
      

      
      checkWinner(type, row, col) {
        
        
        let lines = [[],[],[],[]];
        
        
        let rowMin = row - 4;
        let rowMax = row + 4;
        for ( let c = col - 4; c <= col + 4; c++) {
            if( c>=0 && c <= 14) {
                // console.log("Line1: row: ",row,", col: ", c);
                lines[0].push({tile:this.board[row][c], row: row, col: c});
            }
            if( rowMin >= 0 && c >= 0 && rowMin <= 14 && c <= 14) {
                // console.log("Line3: row: ",rowMin,", col: ", c);
                lines[2].push({tile: this.board[rowMin][c], row: rowMin, col: c});
            }
            if( c >= 0 && rowMax >= 0 && rowMax <= 14 && c <= 14) {
                // console.log("Line4: row: ",rowMax,", col: ", c);
                lines[3].push({tile: this.board[rowMax][c], row: rowMax, col: c});
            }
            rowMin++;
            rowMax--;
        }
        for(let r = row - 4; r <= row + 4; r++){
            if(r>=0 && r <=14 ){ 
                lines[1].push({tile: this.board[r][col], row: r, col: col});
            }
        }

        lines.forEach(line => {
            let result = line.reduce((string, currentPos) => {
                return string += currentPos.tile
            },"")
            
            let winningPosition = type.repeat(5);
            if(result.indexOf(winningPosition) > -1){ game.announceWinner();}
        })

      }
  
      checkTie() {
        return this.moves >= 225;
      }
  
      // Announce the winner if the current client has won. 
      // Broadcast this on the room to let the opponent know.
      announceWinner() {
        const message = `${player.getPlayerName()} wins!`;
        socket.emit('gameEnded', {
          room: this.getRoomId(),
          message,
        });
        alert(message);
        location.reload();
      }
  
      // End the game if the other player won.
      endGame(message) {
        alert(message);
        location.reload();
      }
    }
  
    // Create a new game. Emit newGame event.
    $('#new').on('click', () => {
      const name = $('#nameNew').val();
      if (!name) {
        alert('Please enter your name.');
        return;
      }
      socket.emit('createGame', { name });
      player = new Player(name, P1);
    });
  
    // Join an existing game on the entered roomId. Emit the joinGame event.
    $('#join').on('click', () => {
      const name = $('#nameJoin').val();
      const roomID = $('#room').val();
      if (!name || !roomID) {
        alert('Please enter your name and game ID.');
        return;
      }
      socket.emit('joinGame', { name, room: roomID });
      player = new Player(name, P2);
    });
  
    // New Game created by current client. Update the UI and create new Game var.
    socket.on('newGame', (data) => {
      const message =
        `Hello, ${data.name}. Please ask your friend to enter Game ID: 
        ${data.room}. Waiting for player 2...`;
  
      // Create game for player 1
      game = new Game(data.room);
      game.displayBoard(message);
    });
  
    /**
       * If player creates the game, he'll be P1(X) and has the first turn.
       * This event is received when opponent connects to the room.
       */
    socket.on('player1', (data) => {
      const message = `Hello, ${player.getPlayerName()}`;
      $('#userHello').html(message);
      player.setCurrentTurn(true);
    });
  
    /**
       * Joined the game, so player is P2(O). 
       * This event is received when P2 successfully joins the game room. 
       */
    socket.on('player2', (data) => {
      const message = `Hello, ${data.name}`;
  
      // Create game for player 2
      game = new Game(data.room);
      game.displayBoard(message);
      player.setCurrentTurn(false);
    });
  
    /**
       * Opponent played his turn. Update UI.
       * Allow the current player to play now. 
       */
    socket.on('turnPlayed', (data) => {
      const row = data.tile.split('_')[0];
      const col = data.tile.split('_')[1];
      const opponentType = player.getPlayerType() === P1 ? P2 : P1;
  
      game.updateBoard(opponentType, row, col, data.tile);
      player.setCurrentTurn(true);
    });
  
    // If the other player wins, this event is received. Notify user game has ended.
    socket.on('gameEnd', (data) => {
      game.endGame(data.message);
      socket.leave(data.room);
    });
  
    /**
       * End the game on any err event. 
       */
    socket.on('err', (data) => {
      game.endGame(data.message);
    });
  }());