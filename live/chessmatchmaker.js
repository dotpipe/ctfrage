

export class ChessMatchmaker {
    constructor() {
        this.isSearching = false;
        this.matchId = null;
        this.playerId = this.generatePlayerId();
        this.pollInterval = null;
        this.opponentId = null;

        // Create UI elements
        this.createMatchmakingUI();
    }

    generatePlayerId() {
        // Generate a unique ID for this player
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toggleSearch() {
        const button = document.getElementById('find-opponent');
        const status = document.getElementById('matchmaking-status');

        if (this.isSearching) {
            // Cancel search
            this.isSearching = false;
            button.textContent = 'Find Human Opponent';
            status.textContent = 'Search cancelled';
            this.removeFromMatchmaking();
            clearInterval(this.pollInterval);
        } else {
            // Start search
            this.isSearching = true;
            button.textContent = 'Cancel Search';
            status.textContent = 'Searching for opponent...';
            this.addToMatchmaking();
            this.startPolling();
        }
    }

    addToMatchmaking() {
        // Add this player to the available players pool
        localStorage.setItem('chess_available_' + this.playerId, JSON.stringify({
            timestamp: Date.now(),
            id: this.playerId
        }));
    }

    removeFromMatchmaking() {
        // Remove from available players
        localStorage.removeItem('chess_available_' + this.playerId);

        // If in a match, notify opponent of disconnect
        if (this.matchId) {
            localStorage.setItem('chess_match_' + this.matchId + '_disconnect', JSON.stringify({
                playerId: this.playerId,
                timestamp: Date.now()
            }));
        }
    }

    startPolling() {
        // Poll for matches or available players
        this.pollInterval = setInterval(() => {
            if (this.matchId) {
                this.checkForMatchUpdates();
            } else {
                this.findAvailableOpponent();
            }
        }, 2000);
    }

    findAvailableOpponent() {
        // Look through localStorage for available players
        const availablePlayers = [];
        const now = Date.now();

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('chess_available_')) {
                try {
                    const playerData = JSON.parse(localStorage.getItem(key));

                    // Skip if it's ourselves
                    if (playerData.id === this.playerId) continue;

                    // Skip if entry is too old (more than 30 seconds)
                    if (now - playerData.timestamp > 30000) {
                        localStorage.removeItem(key);
                        continue;
                    }

                    availablePlayers.push(playerData);
                } catch (e) {
                    console.error('Error parsing player data:', e);
                }
            }
        }

        // If we found someone, create a match
        if (availablePlayers.length > 0) {
            // Take the first available player
            const opponent = availablePlayers[0];
            this.createMatch(opponent.id);
        }
    }

    createMatch(opponentId) {
        this.opponentId = opponentId;
        this.matchId = 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

        // Determine colors randomly
        const isWhite = Math.random() >= 0.5;

        // Create match record
        const matchData = {
            matchId: this.matchId,
            created: Date.now(),
            players: {
                white: isWhite ? this.playerId : opponentId,
                black: isWhite ? opponentId : this.playerId
            },
            status: 'active'
        };

        // Store match data
        localStorage.setItem('chess_match_' + this.matchId, JSON.stringify(matchData));

        // Remove both players from available pool
        localStorage.removeItem('chess_available_' + this.playerId);
        localStorage.removeItem('chess_available_' + opponentId);

        // Update UI
        this.updateMatchUI(matchData, isWhite);

        // Initialize chat
        this.initializeChat(this.matchId);
    }

    updateMatchUI(matchData, isWhite) {
        const status = document.getElementById('matchmaking-status');
        const button = document.getElementById('find-opponent');

        status.textContent = `Match found! You are playing as ${isWhite ? 'White' : 'Black'}`;
        button.textContent = 'Resign Game';

        // Initialize the chess game with human opponent
        window.chessGame.initializeHumanOpponent(isWhite ? 'white' : 'black', this.matchId);
    }

    checkForMatchUpdates() {
        if (!this.matchId) return;

        // Check for match updates
        const matchKey = 'chess_match_' + this.matchId;
        const matchData = JSON.parse(localStorage.getItem(matchKey) || '{}');

        // Check for opponent moves
        this.checkForOpponentMoves();

        // Check for disconnection
        const disconnectKey = matchKey + '_disconnect';
        const disconnectData = JSON.parse(localStorage.getItem(disconnectKey) || '{}');

        if (disconnectData.playerId && disconnectData.playerId !== this.playerId) {
            this.handleOpponentDisconnect();
        }

        // Check for game end
        if (matchData.status === 'ended') {
            this.handleGameEnd(matchData.result);
        }
    }

    checkForOpponentMoves() {
        if (!this.matchId || !this.opponentId) return;

        const moveKey = 'chess_move_' + this.matchId + '_' + this.opponentId;
        const moveData = JSON.parse(localStorage.getItem(moveKey) || '{}');

        if (moveData.timestamp && moveData.move) {
            // Check if this is a new move we haven't processed
            const lastProcessedMove = parseInt(localStorage.getItem('chess_last_processed_' + moveKey) || '0');

            if (moveData.timestamp > lastProcessedMove) {
                // Process the move
                window.chessGame.processOpponentMove(moveData.move);

                // Mark as processed
                localStorage.setItem('chess_last_processed_' + moveKey, moveData.timestamp);
            }
        }
    }

    recordMove(move) {
        if (!this.matchId) return;

        const moveData = {
            move: move,
            timestamp: Date.now(),
            playerId: this.playerId
        };

        localStorage.setItem('chess_move_' + this.matchId + '_' + this.playerId, JSON.stringify(moveData));
    }

    handleOpponentDisconnect() {
        const status = document.getElementById('matchmaking-status');
        status.textContent = 'Opponent disconnected';

        // Show notification
        window.chessGame.showNotification('Opponent disconnected from the game', 5000);

        // End the match
        this.endMatch('opponent_disconnect');
    }

    handleGameEnd(result) {
        clearInterval(this.pollInterval);

        // Clean up match data after a delay
        setTimeout(() => {
            this.cleanupMatchData();
        }, 10000); // Give time for final messages/state to be seen
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


    cleanupMatchData() {
        if (!this.matchId) return;

        // Remove all match-related data
        const prefix = 'chess_match_' + this.matchId;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        }

        // Remove move data
        localStorage.removeItem('chess_move_' + this.matchId + '_' + this.playerId);

        // Remove chat data
        const chatPrefix = 'chess_chat_' + this.matchId;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(chatPrefix)) {
                localStorage.removeItem(key);
            }
        }

        // Reset state
        this.matchId = null;
        this.opponentId = null;
    }

    playAgainstAI() {
        // Switch to AI mode
        this.removeFromMatchmaking();
        clearInterval(this.pollInterval);
        this.isSearching = false;

        const status = document.getElementById('matchmaking-status');
        const button = document.getElementById('find-opponent');

        status.textContent = 'Playing against AI';
        button.textContent = 'Find Human Opponent';

        // Initialize AI game
        window.chessGame.initializeAIOpponent();
    }

    initializeChat(matchId) {
        // Create or reset chat window
        if (window.chessChat) {
            window.chessChat.resetChat();
        } else {
            window.chessChat = new ChessChat(this.playerId, this.opponentId, matchId);
        }
    }
}
