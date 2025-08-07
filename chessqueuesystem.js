// import { ChessChat } from './chesschat.js';
/**
 * Chess Queue System
 * Manages player matchmaking and online play
 */
class ChessQueueSystem {
    constructor() {
        this.playerId = this.generatePlayerId();
        this.playerName = this.generatePlayerName();
        this.inQueue = false;
        this.currentMatch = null;
        this.pollInterval = null;
        this.queueCheckInterval = null;
        this.moveCheckInterval = null;
        this.lastQueueUpdate = 0;
        this.lastMoveCheck = 0;
        this.processedMoves = new Set(); // Track processed moves to avoid duplicates

        console.log("Chess Queue System initialized with player ID:", this.playerId);

        // Initialize UI elements
        this.initializeUI();

        // Start queue monitoring
        this.startQueueMonitoring();
    }

    /**
     * Generate a unique player ID
     */
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Generate a random player name
     */
    generatePlayerName() {
        const adjectives = ['Quick', 'Clever', 'Brave', 'Silent', 'Mighty', 'Wise', 'Swift', 'Noble'];
        const nouns = ['Knight', 'Bishop', 'Rook', 'Pawn', 'King', 'Queen', 'Player', 'Tactician'];

        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];

        return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
    }

    /**
     * Initialize UI elements and event listeners
     */
    initializeUI() {
        console.log("Initializing queue UI elements");

        // Join queue button
        const joinQueueBtn = document.getElementById('join-queue');
        if (joinQueueBtn) {
            console.log("Found join-queue button, adding event listener");
            joinQueueBtn.addEventListener('click', () => {
                console.log("Join queue button clicked");
                this.joinQueue();
            });
        } else {
            console.error("join-queue button not found in the DOM");
        }

        // Leave queue button
        const leaveQueueBtn = document.getElementById('leave-queue');
        if (leaveQueueBtn) {
            console.log("Found leave-queue button, adding event listener");
            leaveQueueBtn.addEventListener('click', () => {
                console.log("Leave queue button clicked");
                this.leaveQueue();
            });
        } else {
            console.error("leave-queue button not found in the DOM");
        }

        // Add this to the initializeUI method in ChessQueueSystem
        const checkAIBtn = document.createElement('button');
        checkAIBtn.id = 'check-ai-status';
        checkAIBtn.className = 'btn secondary';
        checkAIBtn.textContent = 'Check AI Status';
        checkAIBtn.style.marginTop = '10px';
        checkAIBtn.addEventListener('click', () => this.checkAIStatus());

        // Add button to the matchmaking panel
        const matchmakingPanel1 = document.querySelector('.matchmaking-panel');
        if (matchmakingPanel1) {
            matchmakingPanel1.appendChild(checkAIBtn);
        }

        // Add to the initializeUI method in ChessQueueSystem
        const toggleChatBtn = document.createElement('button');
        toggleChatBtn.id = 'toggle-chat';
        toggleChatBtn.className = 'btn secondary';
        toggleChatBtn.textContent = 'Toggle Chat';
        toggleChatBtn.style.marginTop = '10px';
        toggleChatBtn.addEventListener('click', () => {
            if (window.chessChat) {
                window.chessChat.toggleChatWindow();
            } else if (this.currentMatch) {
                this.initializeChat();
            } else {
                this.showNotification("No active match for chat", 2000);
            }
        });

        // Add button to the matchmaking panel
        const matchmakingPanel = document.querySelector('.matchmaking-panel');
        if (matchmakingPanel) {
            matchmakingPanel.appendChild(toggleChatBtn);
        }

        // Test connection button
        const testConnectionBtn = document.createElement('button');
        testConnectionBtn.id = 'test-connection';
        testConnectionBtn.className = 'btn secondary';
        testConnectionBtn.textContent = 'Test Connection';
        testConnectionBtn.style.marginTop = '10px';
        testConnectionBtn.addEventListener('click', () => this.testConnection());

        // Debug button
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debug-queue';
        debugBtn.className = 'btn secondary';
        debugBtn.textContent = 'Debug Queue';
        debugBtn.style.marginTop = '10px';
        debugBtn.addEventListener('click', () => this.debugQueueState());

        // Add buttons to the matchmaking panel
        const matchmakingPanel2 = document.querySelector('.matchmaking-panel');
        if (matchmakingPanel2) {
            matchmakingPanel2.appendChild(testConnectionBtn);
            matchmakingPanel2.appendChild(debugBtn);
        }

        // Handle page unload to clean up
        window.addEventListener('beforeunload', () => {
            this.leaveQueue();
            if (this.currentMatch) {
                this.abandonMatch();
            }
        });
    }

    /**
     * End the current match
     */
    endMatch(reason) {
        // Stop polling
        if (this.moveCheckInterval) {
            clearInterval(this.moveCheckInterval);
            this.moveCheckInterval = null;
        }

        // Update UI
        document.getElementById('queue-status').textContent = `Game ended: ${reason}`;
        document.getElementById('join-queue').style.display = 'inline-block';
        document.getElementById('leave-queue').style.display = 'none';
        document.getElementById('match-info').style.display = 'none';

        // Clean up chat
        if (window.chessChat) {
            window.chessChat.handleGameEnd(reason);

            // Remove chat window after a delay
            setTimeout(() => {
                const chatWindow = document.getElementById('chess-chat-window');
                if (chatWindow) {
                    chatWindow.remove();
                }
                window.chessChat = null;
            }, 5000);
        }

        // Reset state
        this.currentMatch = null;
        this.processedMoves.clear();

        // Switch back to AI mode if the chess game exists
        if (window.chessGame && typeof window.chessGame.switchToAIMode === 'function') {
            window.chessGame.switchToAIMode();
        }

        this.showNotification(`Game ended: ${reason}`, 3000);
    }


    /**
     * Join the waiting queue
     */
    joinQueue() {
        if (this.inQueue) {
            console.log("Already in queue, ignoring join request");
            return;
        }

        console.log("Joining queue...");

        // Update UI
        document.getElementById('queue-status').textContent = 'Joining queue...';
        document.getElementById('join-queue').style.display = 'none';
        document.getElementById('leave-queue').style.display = 'inline-block';

        // Add to queue via AJAX
        const formData = new FormData();
        formData.append('player_id', this.playerId);

        fetch('php/join_queue.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update state
                    this.inQueue = true;
                    this.lastQueueUpdate = Date.now();

                    // Start polling for matches
                    this.startMatchPolling();

                    console.log(`Joined queue as ${this.playerName} (${this.playerId})`);
                    this.showNotification(`Joined queue as ${this.playerName}`, 3000);
                } else {
                    console.error('Failed to join queue:', data.message);
                    document.getElementById('queue-status').textContent = 'Failed to join queue';
                    document.getElementById('join-queue').style.display = 'inline-block';
                    document.getElementById('leave-queue').style.display = 'none';
                    this.showNotification("Failed to join queue: " + data.message, 3000);
                }
            })
            .catch(error => {
                console.error('Error joining queue:', error);
                document.getElementById('queue-status').textContent = 'Error joining queue';
                document.getElementById('join-queue').style.display = 'inline-block';
                document.getElementById('leave-queue').style.display = 'none';
                this.showNotification("Error joining queue. Check console for details.", 3000);
            });
    }

    /**
     * Leave the waiting queue
     */
    leaveQueue() {
        if (!this.inQueue) {
            console.log("Not in queue, ignoring leave request");
            return;
        }

        console.log("Leaving queue...");

        // Update UI
        document.getElementById('queue-status').textContent = 'Leaving queue...';

        // Remove from queue via AJAX
        const formData = new FormData();
        formData.append('player_id', this.playerId);

        fetch('php/leave_queue.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                // Update UI
                document.getElementById('queue-status').textContent = 'Not in queue';
                document.getElementById('join-queue').style.display = 'inline-block';
                document.getElementById('leave-queue').style.display = 'none';
                document.getElementById('queue-position').textContent = '-';

                // Update state
                this.inQueue = false;

                // Stop polling
                if (this.pollInterval) {
                    clearInterval(this.pollInterval);
                    this.pollInterval = null;
                }

                console.log(`Left queue (${this.playerId})`);
            })
            .catch(error => {
                console.error('Error leaving queue:', error);
                document.getElementById('queue-status').textContent = 'Error leaving queue';
            });
    }

    /**
     * Start monitoring the queue for stats
     */
    startQueueMonitoring() {
        // Check queue size every 3 seconds
        this.queueCheckInterval = setInterval(() => {
            this.updateQueueStats();
        }, 3000);
    }

    /**
     * Update queue statistics
     */
    updateQueueStats() {
        fetch('php/queue_stats.php')
            .then(response => response.json())
            .then(data => {
                document.getElementById('waiting-count').textContent = data.count;
            })
            .catch(error => {
                console.error('Error fetching queue stats:', error);
            });
    }

    /**
     * Start polling for match opportunities
     */
    startMatchPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        this.pollInterval = setInterval(() => {
            if (!this.inQueue) return;

            // Check for a match
            fetch(`php/check_match.php?player_id=${this.playerId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.matched) {
                        // Match found!
                        clearInterval(this.pollInterval);
                        this.inQueue = false;

                        // Store match details
                        this.currentMatch = {
                            gameId: data.game_id,
                            opponentId: data.opponent_id,
                            color: data.color
                        };

                        console.log("Match found:", this.currentMatch);

                        // Start the match
                        this.startMatch();
                    }
                })
                .catch(error => {
                    console.error('Error checking for match:', error);
                });
        }, 2000); // Check every 2 seconds
    }

    /**
     * Start a chess match with another player
     */
    startMatch() {
        if (!this.currentMatch) return;

        console.log("Starting match with details:", this.currentMatch);

        // Update UI
        document.getElementById('queue-status').textContent = 'Match found!';
        document.getElementById('match-info').style.display = 'block';
        document.getElementById('opponent-name').textContent = 'Online Opponent';
        document.getElementById('player-color').textContent = this.currentMatch.color;
        document.getElementById('join-queue').style.display = 'none';
        document.getElementById('leave-queue').style.display = 'none';

        // Initialize the chess game for human vs human
        if (window.chessGame && typeof window.chessGame.initializeHumanOpponent === 'function') {
            window.chessGame.initializeHumanOpponent(this.currentMatch.color);
        } else {
            console.error("Chess game not properly initialized or missing initializeHumanOpponent method");
            this.showNotification("Error: Chess game not properly initialized", 5000);
        }

        // Initialize chat
        this.initializeChat();

        // Start move polling
        this.startMovePolling();

        console.log(`Started match, playing as ${this.currentMatch.color}`);
        this.showNotification(`Match started! You are playing as ${this.currentMatch.color}`, 3000);
    }


    /**
     * Start polling for opponent moves
     */
    startMovePolling() {
        if (this.moveCheckInterval) {
            clearInterval(this.moveCheckInterval);
        }

        this.moveCheckInterval = setInterval(() => {
            if (!this.currentMatch) return;

            // Check for opponent moves
            fetch(`php/get_moves.php?game_id=${this.currentMatch.gameId}&player_id=${this.playerId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.moves && data.moves.length > 0) {
                        console.log("Received opponent moves:", data.moves);

                        // Process new moves
                        for (const moveData of data.moves) {
                            const moveObj = JSON.parse(moveData.move);

                            // Skip if we've already processed this move
                            if (moveObj.moveId && this.processedMoves.has(moveObj.moveId)) {
                                console.log("Skipping already processed move:", moveObj.moveId);
                                continue;
                            }

                            // Process the move
                            console.log("Processing move:", moveObj);
                            if (window.chessGame && typeof window.chessGame.processOpponentMove === 'function') {
                                window.chessGame.processOpponentMove(moveObj);

                                // Mark as processed
                                if (moveObj.moveId) {
                                    this.processedMoves.add(moveObj.moveId);
                                }
                            } else {
                                console.error("chessGame.processOpponentMove is not available");
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error('Error checking for opponent moves:', error);
                });
        }, 1000); // Check every second
    }

    /**
     * Record a move for the opponent to see
     */
    recordMove(move) {
        if (!this.currentMatch) return;

        console.log("Recording move:", move);

        // Create a unique move ID to track this move
        const moveId = Date.now() + '_' + Math.random().toString(36).substring(2, 9);

        const moveData = {
            from: move.from,
            to: move.to,
            moveId: moveId
        };

        const formData = new FormData();
        formData.append('game_id', this.currentMatch.gameId);
        formData.append('player_id', this.playerId);
        formData.append('move', JSON.stringify(moveData));

        fetch('php/make_move.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error recording move:', data.message);
                    // Revert the move if it failed to record
                    this.showNotification("Failed to send move to opponent. Please try again.", 3000);
                } else {
                    console.log("Move successfully recorded with ID:", moveId);
                }
            })
            .catch(error => {
                console.error('Error recording move:', error);
                this.showNotification("Network error when sending move.", 3000);
            });
    }

    /**
     * Resign the current game
     */
    resignGame() {
        if (!this.currentMatch) return;

        if (confirm('Are you sure you want to resign?')) {
            const formData = new FormData();
            formData.append('game_id', this.currentMatch.gameId);
            formData.append('player_id', this.playerId);

            fetch('php/resign_game.php', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.endMatch('resigned');
                    }
                })
                .catch(error => {
                    console.error('Error resigning game:', error);
                });
        }
    }

    // Add this to the ChessQueueSystem class
    checkAIStatus() {
        if (!window.chessGame) {
            console.log("Chess game not found");
            return;
        }

        console.log("=== AI STATUS ===");
        console.log("Game Mode:", window.chessGame.gameMode);
        console.log("AI Enabled:", window.chessGame.aiEnabled);
        console.log("Use AI:", window.chessGame.useAI);
        console.log("Current Player:", window.chessGame.currentPlayer);
        console.log("Human Color:", window.chessGame.humanColor);
        console.log("Player Can Move:", window.chessGame.playerCanMove);

        if (window.chessGame.aiMoveTimer) {
            console.log("AI Move Timer is active!");
        } else {
            console.log("No active AI Move Timer");
        }

        alert("AI status logged to console. Press F12 to view.");
    }

    /**
     * End the current match
     */
    endMatch(reason) {
        // Stop polling
        if (this.moveCheckInterval) {
            clearInterval(this.moveCheckInterval);
            this.moveCheckInterval = null;
        }

        // Update UI
        document.getElementById('queue-status').textContent = `Game ended: ${reason}`;
        document.getElementById('join-queue').style.display = 'inline-block';
        document.getElementById('leave-queue').style.display = 'none';
        document.getElementById('match-info').style.display = 'none';

        // Reset state
        this.currentMatch = null;
        this.processedMoves.clear();

        // Switch back to AI mode if the chess game exists
        if (window.chessGame && typeof window.chessGame.switchToAIMode === 'function') {
            window.chessGame.switchToAIMode();
        }

        this.showNotification(`Game ended: ${reason}`, 3000);
    }


    /**
     * Abandon the current match (on page unload)
     */
    abandonMatch() {
        if (!this.currentMatch) return;

        // Try to notify the server that we're leaving
        const formData = new FormData();
        formData.append('game_id', this.currentMatch.gameId);
        formData.append('player_id', this.playerId);

        // Use synchronous request since we're in beforeunload
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'php/resign_game.php', false);
        xhr.send(formData);
    }

    /**
     * Test the server connection
     */
    testConnection() {
        console.log("Testing server connection...");

        fetch('php/ping_test.php')
            .then(response => response.json())
            .then(data => {
                console.log("Server response:", data);
                this.showNotification("Server connection successful!", 2000);
            })
            .catch(error => {
                console.error("Server connection failed:", error);
                this.showNotification("Server connection failed. Check console for details.", 3000);
            });
    }

    /**
     * Debug the queue state
     */
    debugQueueState() {
        console.log("=== QUEUE DEBUG INFO ===");
        console.log("Player ID:", this.playerId);
        console.log("In Queue:", this.inQueue);
        console.log("Current Match:", this.currentMatch);

        if (window.chessGame) {
            console.log("Game Mode:", window.chessGame.gameMode);
            console.log("Human Color:", window.chessGame.humanColor);
            console.log("Current Player:", window.chessGame.currentPlayer);
            console.log("Player Can Move:", window.chessGame.playerCanMove);
            console.log("Board State:", window.chessGame.board);
        }

        // Check server state
        fetch(`php/queue_stats.php`)
            .then(response => response.json())
            .then(data => {
                console.log("Queue Stats:", data);
            });

        if (this.currentMatch) {
            fetch(`php/get_moves.php?game_id=${this.currentMatch.gameId}&player_id=${this.playerId}`)
                .then(response => response.json())
                .then(data => {
                    console.log("All Game Moves:", data);
                });
        }

        alert("Debug info logged to console. Press F12 to view.");
    }

    /**
     * Show a notification message
     */
    showNotification(message, duration = 3000) {
        if (window.chessGame && typeof window.chessGame.showNotification === 'function') {
            window.chessGame.showNotification(message, duration);
        } else {
            alert(message);
        }
    }

initializeChat() {
    if (!this.currentMatch) return;
    
    console.log("Initializing chat for match:", this.currentMatch.gameId);
    
    // Check if ChessChat class is available
    if (typeof ChessChat === 'function') {
        // Create a new chat instance
        window.chessChat = new ChessChat(
            this.playerId,
            this.currentMatch.opponentId,
            this.currentMatch.gameId
        );
        console.log("Chat initialized with ChessChat class");
    } else {
        console.error("ChessChat class not found, chat functionality will not be available");
        this.showNotification("Chat functionality not available", 3000);
    }
}


}

/**
 * Enhance the chess game with multiplayer support
 */
function enhanceChessGameForMultiplayer() {
    console.log("Enhancing chess game for multiplayer");

    if (!window.chessGame) {
        console.error("Chess game not found! Will try again in 1 second.");
        setTimeout(enhanceChessGameForMultiplayer, 1000);
        return;
    }

    // Add this to enhanceChessGameForMultiplayer function
    // Identify and override any function that might trigger AI moves
    const potentialAIFunctions = [
        'makeAIMove',
        'checkForAIMove',
        'scheduleAIMove',
        'calculateAIMove',
        'startAIThinking',
        'aiMakeMove',
        'computerMove',
        'triggerAIMove'
    ];

    potentialAIFunctions.forEach(funcName => {
        if (typeof window.chessGame[funcName] === 'function') {
            console.log(`Overriding potential AI function: ${funcName}`);
            const originalFunc = window.chessGame[funcName];
            window.chessGame[funcName] = function (...args) {
                if (this.gameMode === 'human') {
                    console.log(`Prevented AI function ${funcName} in human vs human mode`);
                    return;
                }
                return originalFunc.apply(this, args);
            };
        }
    });

    // Add this to enhanceChessGameForMultiplayer function
    // Override any methods that might check for turns and trigger AI
    if (window.chessGame.checkTurn) {
        const originalCheckTurn = window.chessGame.checkTurn;
        window.chessGame.checkTurn = function () {
            if (this.gameMode === 'human') {
                // In human vs human mode, don't trigger AI
                return;
            }
            return originalCheckTurn.call(this);
        };
    }

    if (window.chessGame.switchTurn) {
        const originalSwitchTurn = window.chessGame.switchTurn;
        window.chessGame.switchTurn = function () {
            const result = originalSwitchTurn.call(this);

            // If in human vs human mode, make sure AI doesn't get triggered
            if (this.gameMode === 'human' && this.aiMoveTimer) {
                clearTimeout(this.aiMoveTimer);
                this.aiMoveTimer = null;
            }

            return result;
        };
    }


    // Add human opponent initialization
    window.chessGame.initializeHumanOpponent = function (myColor) {
        console.log("Initializing human opponent mode with color:", myColor);

        // Switch from AI to human opponent
        this.gameMode = 'human';
        this.humanColor = myColor;
        this.opponentColor = myColor === 'white' ? 'black' : 'white';
        this.currentPlayer = 'white'; // White always starts

        // Reset the board
        this.setupBoard();

        // Set which player can move
        this.playerCanMove = (myColor === 'white'); // Only white can move at the start

        // Update turn indicator
        document.getElementById('turn-indicator').textContent =
            myColor === 'white' ? 'Your turn (white)' : 'Waiting for opponent (white)';

        // Render the board
        this.renderBoard();

        // Show notification
        this.showNotification(`Playing against human opponent. You are ${myColor}.`, 3000);
    };

    // Add method to process opponent moves
    window.chessGame.processOpponentMove = function (moveObj) {
        console.log("Processing opponent move:", moveObj);

        // Make the move on the board
        if (moveObj && moveObj.from && moveObj.to) {
            // Get the piece at the from position
            const fromRow = parseInt(moveObj.from.row);
            const fromCol = parseInt(moveObj.from.col);
            const toRow = parseInt(moveObj.to.row);
            const toCol = parseInt(moveObj.to.col);

            console.log(`Moving piece from [${fromRow},${fromCol}] to [${toRow},${toCol}]`);

            // Make the move without checking whose turn it is
            const piece = this.board[fromRow][fromCol];
            if (!piece) {
                console.error("No piece found at source position:", fromRow, fromCol);
                return;
            }

            // Move the piece
            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;

            // Now it's the player's turn
            this.playerCanMove = true;
            this.currentPlayer = this.humanColor;

            // Update turn indicator
            document.getElementById('turn-indicator').textContent = `Your turn (${this.humanColor})`;

            // Render the board
            this.renderBoard();

            // Update game status
            this.updateGameStatus();

            // Check for game over
            if (typeof this.checkGameOver === 'function') {
                this.checkGameOver();
            }
        }
    };

    // Override the handleSquareClick method to check if player can move
    const originalHandleSquareClick = window.chessGame.handleSquareClick;
    window.chessGame.handleSquareClick = function (row, col) {
        // In human vs human mode, check if it's this player's turn
        if (this.gameMode === 'human') {
            // Only allow moves if it's the player's turn
            if (!this.playerCanMove) {
                this.showNotification("It's not your turn", 2000);
                return;
            }

            // Check if the selected piece is the player's color
            if (this.selectedSquare === null) {
                const square = this.board[row][col];
                if (square !== null) {
                    const pieceIsWhite = square.isWhite || square.color === 'white';
                    const playerIsWhite = this.humanColor === 'white';

                    if (pieceIsWhite !== playerIsWhite) {
                        this.showNotification("You can only move your own pieces", 2000);
                        return;
                    }
                }
            }
        }

        // Store the original selected square
        const originalSelectedSquare = this.selectedSquare;

        // Call the original method
        originalHandleSquareClick.call(this, row, col);

        // Check if a move was made (selected square was reset)
        if (this.gameMode === 'human' && originalSelectedSquare && !this.selectedSquare) {
            console.log("Move detected from handleSquareClick");

            // A move was made, record it for the opponent
            if (window.chessQueue) {
                window.chessQueue.recordMove({
                    from: { row: originalSelectedSquare.row, col: originalSelectedSquare.col },
                    to: { row, col }
                });

                // After making a move, it's the opponent's turn
                this.playerCanMove = false;

                // Update turn indicator
                document.getElementById('turn-indicator').textContent =
                    `Waiting for opponent (${this.opponentColor})`;
            }
        }
    };

    // Add resign button functionality
    const resignButton = document.getElementById('resign-button');
    if (resignButton) {
        resignButton.addEventListener('click', () => {
            if (window.chessQueue && window.chessQueue.currentMatch) {
                window.chessQueue.resignGame();
            }
        });
    }
}

// Initialize the queue system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing chess queue system");

    // Create the queue system immediately
    window.chessQueue = new ChessQueueSystem();

    // Enhance the chess game for multiplayer
    enhanceChessGameForMultiplayer();

    // Add direct button hooks as a fallback
    const joinQueueBtn = document.getElementById('join-queue');
    if (joinQueueBtn) {
        joinQueueBtn.addEventListener('click', function () {
            console.log("Join queue button clicked (direct hook)");
            if (window.chessQueue) {
                window.chessQueue.joinQueue();
            } else {
                alert("Queue system not initialized yet!");
            }
        });
    }

    const leaveQueueBtn = document.getElementById('leave-queue');
    if (leaveQueueBtn) {
        leaveQueueBtn.addEventListener('click', function () {
            console.log("Leave queue button clicked (direct hook)");
            if (window.chessQueue) {
                window.chessQueue.leaveQueue();
            } else {
                alert("Queue system not initialized yet!");
            }
        });
    }
});

export default ChessQueueSystem;