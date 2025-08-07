import { ChessMatchmaker } from './chessmatchmaker.js';

/**
 * Chess Queue System
 * Manages player matchmaking and waiting queue
 */
class ChessQueueSystem {
    constructor() {
        this.playerId = this.generatePlayerId();
        this.playerName = this.generatePlayerName();
        this.inQueue = false;
        this.currentMatch = null;
        this.pollInterval = null;
        this.queueCheckInterval = null;
        this.lastQueueUpdate = 0;

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
        // Join queue button
        const joinQueueBtn = document.getElementById('join-queue');
        if (joinQueueBtn) {
            joinQueueBtn.addEventListener('click', () => this.joinQueue());
        }

        // Leave queue button
        const leaveQueueBtn = document.getElementById('leave-queue');
        if (leaveQueueBtn) {
            leaveQueueBtn.addEventListener('click', () => this.leaveQueue());
        }

        // Update player name display if needed
        const playerNameElement = document.getElementById('player-name');
        if (playerNameElement) {
            playerNameElement.textContent = this.playerName;
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
     * Join the waiting queue
     */
    joinQueue() {
        if (this.inQueue) return;

        // Update UI
        document.getElementById('queue-status').textContent = 'Joining queue...';
        document.getElementById('join-queue').style.display = 'none';
        document.getElementById('leave-queue').style.display = 'inline-block';

        // Add to queue in localStorage
        const timestamp = Date.now();
        const queueEntry = {
            id: this.playerId,
            name: this.playerName,
            joinTime: timestamp,
            status: 'waiting'
        };

        localStorage.setItem(`chess_queue_${this.playerId}`, JSON.stringify(queueEntry));

        // Update state
        this.inQueue = true;
        this.lastQueueUpdate = timestamp;

        // Start polling for matches
        this.startMatchPolling();

        console.log(`Joined queue as ${this.playerName} (${this.playerId})`);
    }

    /**
     * Leave the waiting queue
     */
    leaveQueue() {
        if (!this.inQueue) return;

        // Remove from queue
        localStorage.removeItem(`chess_queue_${this.playerId}`);

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
        const queueEntries = this.getQueueEntries();
        const waitingCount = queueEntries.filter(entry => entry.status === 'waiting').length;

        // Update waiting count
        document.getElementById('waiting-count').textContent = waitingCount;

        // If we're in the queue, update our position
        if (this.inQueue) {
            const position = this.getQueuePosition();
            document.getElementById('queue-position').textContent = position > 0 ? position : 'Matching...';

            // Keep our queue entry fresh
            this.refreshQueueEntry();
        }

        // Clean up old entries
        this.cleanupOldEntries();
    }

    /**
     * Get all current queue entries
     */
    getQueueEntries() {
        const entries = [];

        // Scan localStorage for queue entries
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('chess_queue_')) {
                try {
                    const entry = JSON.parse(localStorage.getItem(key));
                    entries.push(entry);
                } catch (e) {
                    console.error('Error parsing queue entry:', e);
                }
            }
        }

        // Sort by join time (oldest first)
        return entries.sort((a, b) => a.joinTime - b.joinTime);
    }

    /**
     * Get our position in the queue
     */
    getQueuePosition() {
        const entries = this.getQueueEntries();
        const waitingEntries = entries.filter(entry => entry.status === 'waiting');

        for (let i = 0; i < waitingEntries.length; i++) {
            if (waitingEntries[i].id === this.playerId) {
                return i + 1;
            }
        }

        return -1; // Not found
    }

    /**
     * Refresh our queue entry to prevent timeout
     */
    refreshQueueEntry() {
        if (!this.inQueue) return;

        try {
            const entryKey = `chess_queue_${this.playerId}`;
            const entry = JSON.parse(localStorage.getItem(entryKey));

            if (entry) {
                entry.lastUpdate = Date.now();
                localStorage.setItem(entryKey, JSON.stringify(entry));
                this.lastQueueUpdate = Date.now();
            }
        } catch (e) {
            console.error('Error refreshing queue entry:', e);
        }
    }

    /**
     * Clean up old entries (inactive for more than 30 seconds)
     */
    cleanupOldEntries() {
        const now = Date.now();
        const entries = this.getQueueEntries();

        entries.forEach(entry => {
            const lastUpdate = entry.lastUpdate || entry.joinTime;
            if (now - lastUpdate > 30000) { // 30 seconds
                localStorage.removeItem(`chess_queue_${entry.id}`);
                console.log(`Removed inactive entry: ${entry.name}`);
            }
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

            // Check if we're first in queue
            const position = this.getQueuePosition();

            if (position === 1) {
                // We're first! Look for a second player
                this.checkForOpponent();
            } else if (position === 2) {
                // We're second! Check if first player has matched us
                this.checkForMatch();
            }

            // Also check if someone has matched with us directly
            this.checkForDirectMatch();

        }, 1000); // Check every second
    }

    /**
     * Check if we can match with the next player in queue
     */
    checkForOpponent() {
        const entries = this.getQueueEntries();
        const waitingEntries = entries.filter(entry =>
            entry.status === 'waiting' && entry.id !== this.playerId
        );

        if (waitingEntries.length > 0) {
            // Match with the next player in queue
            const opponent = waitingEntries[0];
            this.initiateMatch(opponent);
        }
    }

    /**
     * Check if the first player has matched with us
     */
    checkForMatch() {
        // Look for a match entry with our ID
        const matchKey = `chess_match_for_${this.playerId}`;
        const matchData = localStorage.getItem(matchKey);

        if (matchData) {
            try {
                const match = JSON.parse(matchData);
                this.acceptMatch(match);
            } catch (e) {
                console.error('Error parsing match data:', e);
            }
        }
    }

    /**
     * Check if anyone has directly matched with us
     */
    checkForDirectMatch() {
        // Look for a match entry with our ID
        const matchKey = `chess_match_for_${this.playerId}`;
        const matchData = localStorage.getItem(matchKey);

        if (matchData) {
            try {
                const match = JSON.parse(matchData);
                this.acceptMatch(match);
            } catch (e) {
                console.error('Error parsing match data:', e);
            }
        }
    }

    /**
     * Initiate a match with another player
     */
    initiateMatch(opponent) {
        // Create a match ID
        const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Randomly assign colors
        const isWhite = Math.random() >= 0.5;

        // Create match data
        const matchData = {
            matchId: matchId,
            initiator: {
                id: this.playerId,
                name: this.playerName,
                color: isWhite ? 'white' : 'black'
            },
            opponent: {
                id: opponent.id,
                name: opponent.name,
                color: isWhite ? 'black' : 'white'
            },
            created: Date.now(),
            status: 'pending'
        };

        // Store match data for opponent to find
        localStorage.setItem(`chess_match_for_${opponent.id}`, JSON.stringify(matchData));

        // Update our status in queue
        this.updateQueueStatus('matching');

        // Wait for acceptance
        setTimeout(() => {
            this.checkMatchAcceptance(matchData);
        }, 5000);

        console.log(`Initiated match with ${opponent.name} (${opponent.id})`);
    }

    /**
     * Accept a match initiated by another player
     */
    acceptMatch(matchData) {
        // Update match status
        matchData.status = 'accepted';
        localStorage.setItem(`chess_match_${matchData.matchId}`, JSON.stringify(matchData));

        // Remove the direct match notification
        localStorage.removeItem(`chess_match_for_${this.playerId}`);

        // Leave the queue
        this.leaveQueue();

        // Start the match
        this.startMatch(matchData);

        console.log(`Accepted match with ${matchData.initiator.name} (${matchData.initiator.id})`);
    }

    /**
     * Check if a match was accepted
     */
    checkMatchAcceptance(matchData) {
        // Check if match was accepted
        const matchKey = `chess_match_${matchData.matchId}`;
        const updatedMatchData = localStorage.getItem(matchKey);

        if (updatedMatchData) {
            try {
                const match = JSON.parse(updatedMatchData);
                if (match.status === 'accepted') {
                    // Match was accepted, start the game
                    this.leaveQueue();
                    this.startMatch(match);
                    return;
                }
            } catch (e) {
                console.error('Error parsing match acceptance:', e);
            }
        }

        // Match wasn't accepted, clean up and continue in queue
        localStorage.removeItem(`chess_match_for_${matchData.opponent.id}`);
        this.updateQueueStatus('waiting');

        console.log(`Match with ${matchData.opponent.name} was not accepted`);
    }

    /**
     * Update our status in the queue
     */
    updateQueueStatus(status) {
        if (!this.inQueue) return;

        try {
            const entryKey = `chess_queue_${this.playerId}`;
            const entry = JSON.parse(localStorage.getItem(entryKey));

            if (entry) {
                entry.status = status;
                entry.lastUpdate = Date.now();
                localStorage.setItem(entryKey, JSON.stringify(entry));
            }
        } catch (e) {
            console.error('Error updating queue status:', e);
        }
    }

    /**
     * Start a chess match with another player
     */
    startMatch(matchData) {
        // Store current match
        this.currentMatch = matchData;

        // Determine our color
        const isInitiator = matchData.initiator.id === this.playerId;
        const myColor = isInitiator ? matchData.initiator.color : matchData.opponent.color;
        const opponentName = isInitiator ? matchData.opponent.name : matchData.initiator.name;

        // Update UI
        document.getElementById('queue-status').textContent = 'Match found!';
        document.getElementById('match-info').style.display = 'block';
        document.getElementById('opponent-name').textContent = opponentName;
        document.getElementById('player-color').textContent = myColor;

        // Initialize the chess game for human vs human
        window.chessGame.initializeHumanOpponent(myColor, matchData.matchId);

        // Initialize chat
        this.initializeChat(matchData);

        // Start move polling
        this.startMovePolling(matchData);

        console.log(`Started match with ${opponentName}, playing as ${myColor}`);
    }

    /**
     * Initialize chat for the match
     */
    initializeChat(matchData) {
        // Create chat window if it doesn't exist
        if (!document.getElementById('chess-chat-window')) {
            this.createChatWindow();
        }

        // Reset chat
        this.resetChat();

        // Store chat info
        this.chatInfo = {
            matchId: matchData.matchId,
            myId: this.playerId,
            opponentId: matchData.initiator.id === this.playerId ?
                matchData.opponent.id : matchData.initiator.id,
            opponentName: matchData.initiator.id === this.playerId ?
                matchData.opponent.name : matchData.initiator.name
        };

        // Start chat polling
        this.startChatPolling();

        // Add welcome message
        this.addSystemMessage(`Chat connected. Say hello to ${this.chatInfo.opponentName}!`);
    }

    /**
     * Create chat window
     */
    createChatWindow() {
        const chatWindow = document.createElement('div');
        chatWindow.id = 'chess-chat-window';
        chatWindow.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            height: 400px;
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            z-index: 9999;
        `;

        chatWindow.innerHTML = `
            <div class="chat-header" style="padding: 10px; background: #f0f0f0; border-bottom: 1px solid #ccc; border-radius: 8px 8px 0 0;">
                <span>Chess Chat</span>
                <button id="minimize-chat" style="float: right; border: none; background: none; cursor: pointer;">−</button>
            </div>
            <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 10px;"></div>
            <div style="padding: 10px; border-top: 1px solid #ccc;">
                <input id="chat-input" type="text" placeholder="Type a message..." style="width: 80%; padding: 5px;">
                <button id="send-chat" style="width: 18%; padding: 5px;">Send</button>
            </div>
        `;

        document.body.appendChild(chatWindow);

        // Add event listeners
        document.getElementById('minimize-chat').addEventListener('click', () => this.toggleChatWindow());
        document.getElementById('send-chat').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chat-input').addEventListener('keypress', e => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    }

    /**
     * Toggle chat window visibility
     */
    toggleChatWindow() {
        const chatWindow = document.getElementById('chess-chat-window');
        const messagesContainer = document.getElementById('chat-messages');
        const inputContainer = document.querySelector('#chess-chat-window > div:last-child');

        if (messagesContainer.style.display === 'none') {
            messagesContainer.style.display = 'block';
            inputContainer.style.display = 'block';
            chatWindow.style.height = '400px';
            document.getElementById('minimize-chat').textContent = '−';
        } else {
            messagesContainer.style.display = 'none';
            inputContainer.style.display = 'none';
            chatWindow.style.height = '40px';
            document.getElementById('minimize-chat').textContent = '+';
        }
    }

    /**
     * Reset chat
     */
    resetChat() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }

        // Clear chat polling
        if (this.chatPollInterval) {
            clearInterval(this.chatPollInterval);
            this.chatPollInterval = null;
        }
    }

    /**
     * Start polling for chat messages
     */
    startChatPolling() {
        this.lastChatCheck = Date.now();

        this.chatPollInterval = setInterval(() => {
            if (!this.chatInfo) return;

            // Check for new messages
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                // Check if it's a chat message for our match
                if (key.startsWith(`chess_chat_${this.chatInfo.matchId}_`)) {
                    try {
                        const chatMessage = JSON.parse(localStorage.getItem(key));

                        // If it's from the opponent and we haven't seen it yet
                        if (chatMessage.sender !== this.playerId &&
                            chatMessage.timestamp > this.lastChatCheck) {
                            this.addMessageToChat(chatMessage, false);
                        }
                    } catch (e) {
                        console.error('Error parsing chat message:', e);
                    }
                }
            }

            this.lastChatCheck = Date.now();
        }, 1000);
    }

    /**
     * Send a chat message
     */
    sendChatMessage() {
        if (!this.chatInfo) return;

        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message) return;

        const timestamp = Date.now();
        const chatMessage = {
            sender: this.playerId,
            senderName: this.playerName,
            message: message,
            timestamp: timestamp
        };

        // Add to my chat window
        this.addMessageToChat(chatMessage, true);

        // Store in localStorage for the other player to see
        const chatKey = `chess_chat_${this.chatInfo.matchId}_${timestamp}`;
        localStorage.setItem(chatKey, JSON.stringify(chatMessage));

        // Clear input
        input.value = '';
    }

    /**
     * Add a message to the chat window
     */
    addMessageToChat(chatMessage, isFromMe) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = isFromMe ? 'my-message' : 'opponent-message';
        messageDiv.style.cssText = `
            margin: 5px 0;
            padding: 8px 12px;
            border-radius: 15px;
            max-width: 80%;
            word-wrap: break-word;
            ${isFromMe ?
                'background-color: #DCF8C6; align-self: flex-end; margin-left: auto;' :
                'background-color: #F2F2F2; align-self: flex-start;'}
        `;

        // Add sender name for opponent messages
        if (!isFromMe && chatMessage.senderName) {
            const nameSpan = document.createElement('div');
            nameSpan.style.cssText = `
                font-size: 0.8em;
                color: #666;
                margin-bottom: 2px;
            `;
            nameSpan.textContent = chatMessage.senderName;
            messageDiv.appendChild(nameSpan);
        }

        const messageContent = document.createElement('div');
        messageContent.textContent = chatMessage.message;
        messageDiv.appendChild(messageContent);

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Add a system message to the chat
     */
    addSystemMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.style.cssText = `
            margin: 5px 0;
            padding: 5px 10px;
            border-radius: 10px;
            background-color: #f0f0f0;
            color: #666;
            font-style: italic;
            text-align: center;
            font-size: 0.9em;
        `;

        messageDiv.textContent = message;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Start polling for opponent moves
     */
    startMovePolling(matchData) {
        if (this.movePollInterval) {
            clearInterval(this.movePollInterval);
        }

        this.lastMoveCheck = Date.now();

        this.movePollInterval = setInterval(() => {
            if (!this.currentMatch) return;

            // Determine opponent ID
            const opponentId = matchData.initiator.id === this.playerId ?
                matchData.opponent.id : matchData.initiator.id;

            // Check for opponent moves
            const moveKey = `chess_move_${matchData.matchId}_${opponentId}`;
            const moveData = localStorage.getItem(moveKey);

            if (moveData) {
                try {
                    const move = JSON.parse(moveData);

                    // Check if this is a new move
                    if (move.timestamp > this.lastMoveCheck) {
                        // Process the move
                        window.chessGame.processOpponentMove(move);
                        this.lastMoveCheck = move.timestamp;
                    }
                } catch (e) {
                    console.error('Error parsing opponent move:', e);
                }
            }

            // Check for game end
            const gameEndKey = `chess_game_end_${matchData.matchId}`;
            const gameEndData = localStorage.getItem(gameEndKey);

            if (gameEndData) {
                try {
                    const gameEnd = JSON.parse(gameEndData);

                    // Check if this is a new game end event
                    if (gameEnd.timestamp > this.lastMoveCheck) {
                        this.handleGameEnd(gameEnd);
                        this.lastMoveCheck = gameEnd.timestamp;
                    }
                } catch (e) {
                    console.error('Error parsing game end data:', e);
                }
            }

        }, 500); // Check every half second
    }

    /**
     * Record a move for the opponent to see
     */
    recordMove(move) {
        if (!this.currentMatch) return;

        const moveData = {
            move: move,
            timestamp: Date.now(),
            playerId: this.playerId
        };

        localStorage.setItem(`chess_move_${this.currentMatch.matchId}_${this.playerId}`,
            JSON.stringify(moveData));
    }

    /**
     * Handle game end
     */
    handleGameEnd(gameEndData) {
        // Add system message to chat
        this.addSystemMessage(`Game over: ${gameEndData.result}`);

        // Stop polling
        if (this.movePollInterval) {
            clearInterval(this.movePollInterval);
            this.movePollInterval = null;
        }

        // Clean up match data after a delay
        setTimeout(() => {
            this.cleanupMatchData();
        }, 10000); // Give time for final messages/state to be seen
    }

    /**
     * Record game end for the opponent to see
     */
    recordGameEnd(result) {
        if (!this.currentMatch) return;

        const gameEndData = {
            result: result,
            timestamp: Date.now(),
            playerId: this.playerId
        };

        localStorage.setItem(`chess_game_end_${this.currentMatch.matchId}`,
            JSON.stringify(gameEndData));
    }

    /**
     * Abandon the current match
     */
    abandonMatch() {
        if (!this.currentMatch) return;

        // Record game end
        this.recordGameEnd('Opponent disconnected');

        // Clean up
        this.cleanupMatchData();
    }

    /**
     * Clean up match data
     */
    cleanupMatchData() {
        if (!this.currentMatch) return;

        // Clean up localStorage
        const matchId = this.currentMatch.matchId;

        // Remove move data
        localStorage.removeItem(`chess_move_${matchId}_${this.playerId}`);

        // Remove game end data
        localStorage.removeItem(`chess_game_end_${matchId}`);

        // Remove chat data after a delay (to allow reading final messages)
        setTimeout(() => {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(`chess_chat_${matchId}`)) {
                    localStorage.removeItem(key);
                }
            }
        }, 30000); // 30 seconds

        // Reset state
        this.currentMatch = null;

        // Reset UI
        document.getElementById('queue-status').textContent = 'Not in queue';
        document.getElementById('match-info').style.display = 'none';
        document.getElementById('join-queue').style.display = 'inline-block';
        document.getElementById('leave-queue').style.display = 'none';

        // Stop polling
        if (this.movePollInterval) {
            clearInterval(this.movePollInterval);
            this.movePollInterval = null;
        }

        if (this.chatPollInterval) {
            clearInterval(this.chatPollInterval);
            this.chatPollInterval = null;
        }
    }
}

// Initialize the queue system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the chess game to initialize
    setTimeout(() => {
        if (window.chessGame) {
            window.chessQueue = new ChessQueueSystem();

            // Add methods to the chess game to support human vs human play
            enhanceChessGameForMultiplayer();
        }
    }, 1000);
});

/**
 * Enhance the chess game with multiplayer support
 */
export function enhanceChessGameForMultiplayer() {
    console.log("Enhancing chess game for multiplayer");
    
    if (!window.chessGame) {
        console.error("Chess game not found! Will try again in 1 second.");
        setTimeout(enhanceChessGameForMultiplayer, 1000);
        return;
    }
    
    // Add human opponent initialization
    window.chessGame.initializeHumanOpponent = function(myColor) {
        console.log("Initializing human opponent mode with color:", myColor);
        
        // Switch from AI to human opponent
        this.gameMode = 'human';
        this.humanColor = myColor;
        this.opponentColor = myColor === 'white' ? 'black' : 'white';
        this.currentPlayer = 'white'; // White always starts
        
        // IMPORTANT: Disable AI completely
        this.aiEnabled = false;
        this.useAI = false;
        
        // If there's an AI move timer, clear it
        if (this.aiMoveTimer) {
            clearTimeout(this.aiMoveTimer);
            this.aiMoveTimer = null;
        }
        
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
    
    // Override the AI move function to do nothing in human vs human mode
    const originalMakeAIMove = window.chessGame.makeAIMove;
    window.chessGame.makeAIMove = function() {
        if (this.gameMode === 'human') {
            console.log("AI move attempted in human vs human mode - prevented");
            return false;
        }
        
        // Call original AI move function only if not in human vs human mode
        return originalMakeAIMove.call(this);
    };
    
    // Override any function that might trigger AI moves
    if (window.chessGame.checkForAIMove) {
        const originalCheckForAIMove = window.chessGame.checkForAIMove;
        window.chessGame.checkForAIMove = function() {
            if (this.gameMode === 'human') {
                console.log("AI move check prevented in human vs human mode");
                return;
            }
            
            return originalCheckForAIMove.call(this);
        };
    }
    
    // Override the updateGameStatus function to prevent AI moves
    if (window.chessGame.updateGameStatus) {
        const originalUpdateGameStatus = window.chessGame.updateGameStatus;
        window.chessGame.updateGameStatus = function() {
            // Call original function
            originalUpdateGameStatus.call(this);
            
            // If in human vs human mode, prevent any AI move scheduling
            if (this.gameMode === 'human' && this.aiMoveTimer) {
                console.log("Clearing scheduled AI move in human vs human mode");
                clearTimeout(this.aiMoveTimer);
                this.aiMoveTimer = null;
            }
        };
    }
    
    // Add method to process opponent moves
    window.chessGame.processOpponentMove = function(moveObj) {
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
            
            // Update game status WITHOUT triggering AI
            const originalAiEnabled = this.aiEnabled;
            const originalUseAI = this.useAI;
            
            this.aiEnabled = false;
            this.useAI = false;
            
            this.updateGameStatus();
            
            // Restore original AI settings (though they should remain disabled in human mode)
            this.aiEnabled = originalAiEnabled;
            this.useAI = originalUseAI;
            
            // Check for game over
            if (typeof this.checkGameOver === 'function') {
                this.checkGameOver();
            }
        }
    };
    
    // Override the handleSquareClick method to check if player can move
    const originalHandleSquareClick = window.chessGame.handleSquareClick;
    window.chessGame.handleSquareClick = function(row, col) {
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
    
    // Add a method to switch back to AI mode
    window.chessGame.switchToAIMode = function() {
        this.gameMode = 'ai';
        this.aiEnabled = true;
        this.useAI = true;
        this.humanColor = 'white'; // Default when playing against AI
        this.currentPlayer = 'white';
        this.playerCanMove = true;
        
        // Reset the board
        this.setupBoard();
        this.renderBoard();
        this.updateGameStatus();
        
        document.getElementById('turn-indicator').textContent = 'Your turn (white)';
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
    
    console.log("Chess game successfully enhanced for multiplayer");
}

export default ChessMatchmaker;