/**
 * Chess ARN Integration Module
 * 
 * This module integrates the Adaptive Recursive Network (ARN) with your existing chess game.
 * It creates a self-play learning system where the ARN plays against itself to continuously improve.
 */
class ChessARNIntegration {
    constructor(options = {}) {
        // Configuration
        this.options = {
            gameDelay: 50,          // Milliseconds between moves
            maxGames: 1000,         // Maximum number of games to play
            saveInterval: 10,       // Save knowledge every X games
            logMoves: true,         // Whether to log each move
            ...options
        };
        
        // State
        this.isRunning = false;
        this.gameCount = 0;
        this.moveCount = 0;
        this.gameInterval = null;
        this.startTime = null;
        
        // Statistics
        this.stats = {
            whiteWins: 0,
            blackWins: 0,
            draws: 0,
            breakthroughs: [],
            failures: []
        };
        
        // Knowledge base
        this.moveDatabase = {};
        this.breakthroughPatterns = {};
        
        // Load existing knowledge if available
        this.loadMoveDatabase();
        this.loadBreakthroughPatterns();
        
        // Bind methods
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.playNextMove = this.playNextMove.bind(this);
        this.handleGameOver = this.handleGameOver.bind(this);
        
        // Initialize UI
        this.initializeUI();
    }
    
    /**
     * Initialize the UI elements
     */
    initializeUI() {
        // Create container if it doesn't exist
        let container = document.getElementById('chess-arn-controls');
        if (!container) {
            container = document.createElement('div');
            container.id = 'chess-arn-controls';
            container.style.margin = '20px 0';
            container.style.padding = '15px';
            container.style.backgroundColor = '#f8f9fa';
            container.style.borderRadius = '8px';
            container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            
            // Find a good place to insert it
            const chessBoard = document.querySelector('.chess-board') || document.getElementById('chessBoard');
            if (chessBoard && chessBoard.parentNode) {
                chessBoard.parentNode.insertBefore(container, chessBoard.nextSibling);
            } else {
                document.body.appendChild(container);
            }
        }
        
        // Create UI elements
        container.innerHTML = `
            <h3 style="margin-top:0;color:#2c3e50;border-bottom:1px solid #ddd;padding-bottom:10px;">
                Chess ARN Self-Learning System
            </h3>
            
            <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
                <div>
                    <button id="arn-start" style="background:#2ecc71;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;margin-right:10px;">
                        Start Learning
                    </button>
                    <button id="arn-stop" style="background:#e74c3c;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;">
                        Stop
                    </button>
                </div>
                
                <div style="display:flex;align-items:center;">
                    <label for="arn-speed" style="margin-right:10px;">Speed:</label>
                    <select id="arn-speed" style="padding:5px;border:1px solid #ddd;border-radius:4px;">
                        <option value="1000">Slow</option>
                        <option value="300">Normal</option>
                        <option value="50" selected>Fast</option>
                        <option value="10">Ultra Fast</option>
                        <option value="0">Instant</option>
                    </select>
                </div>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
                <div style="background:white;padding:10px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size:12px;color:#7f8c8d;text-transform:uppercase;">Games Played</div>
                    <div id="arn-games-played" style="font-size:18px;font-weight:bold;color:#2c3e50;">0</div>
                </div>
                
                <div style="background:white;padding:10px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size:12px;color:#7f8c8d;text-transform:uppercase;">Positions Learned</div>
                    <div id="arn-positions" style="font-size:18px;font-weight:bold;color:#2c3e50;">0</div>
                </div>
                
                <div style="background:white;padding:10px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size:12px;color:#7f8c8d;text-transform:uppercase;">White / Black / Draw</div>
                    <div id="arn-results" style="font-size:18px;font-weight:bold;color:#2c3e50;">0 / 0 / 0</div>
                </div>
                
                <div style="background:white;padding:10px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size:12px;color:#7f8c8d;text-transform:uppercase;">Breakthroughs</div>
                    <div id="arn-breakthroughs" style="font-size:18px;font-weight:bold;color:#2c3e50;">0</div>
                </div>
            </div>
            
            <div id="arn-status" style="background:#2c3e50;color:#ecf0f1;padding:10px;border-radius:4px;font-family:monospace;height:100px;overflow-y:auto;">
                <div>Chess ARN initialized. Click "Start Learning" to begin.</div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('arn-start').addEventListener('click', this.start);
        document.getElementById('arn-stop').addEventListener('click', this.stop);
        document.getElementById('arn-speed').addEventListener('change', (e) => {
            this.options.gameDelay = parseInt(e.target.value);
            if (this.isRunning) {
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(this.playNextMove, this.options.gameDelay);
                this.log(`Speed changed to ${this.options.gameDelay}ms`);
            }
        });
    }
    
    /**
     * Start the self-learning process
     */
    start() {
        if (this.isRunning) return;
        
        // Check if chess game is available
        if (!window.chessGame) {
            this.log('Error: Chess game not found. Make sure your chess game is initialized first.');
            return;
        }
        
        this.isRunning = true;
        this.startTime = Date.now();
        
        // Reset the game if it's over
        if (window.chessGame.gameOver) {
            window.chessGame.setupBoard();
        }
        
        this.log('Starting self-learning process...');
        
        // Start the game interval
        this.gameInterval = setInterval(this.playNextMove, this.options.gameDelay);
        
        // Update UI
        document.getElementById('arn-start').disabled = true;
        document.getElementById('arn-stop').disabled = false;
    }
    
    /**
     * Stop the self-learning process
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        // Clear the interval
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        // Calculate duration
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        
        this.log(`Self-learning stopped after ${duration} seconds`);
        this.log(`Learned ${Object.keys(this.moveDatabase).length} positions from ${this.gameCount} games`);
        
        // Save knowledge
        this.saveMoveDatabase();
        this.saveBreakthroughPatterns();
        
        // Update UI
        document.getElementById('arn-start').disabled = false;
        document.getElementById('arn-stop').disabled = true;
    }
    
    /**
     * Play the next move in the self-learning process
     */
    playNextMove() {
        // Check if game is over
        if (window.chessGame.gameOver) {
            this.handleGameOver();
            return;
        }
        
        // Get current player and position
        const currentPlayer = window.chessGame.currentPlayer;
        const position = window.chessGame.getPositionFEN();
        
        // Get best move from database or calculate new move
        const move = this.getBestMove(position, currentPlayer);
        
        if (move) {
            // Record the position and move
            this.recordMove(position, move, currentPlayer);
            
            // Execute the move
            window.chessGame.executeAIMove(move);
            
            // Check for breakthroughs
            this.checkForBreakthrough(position, move, currentPlayer);
            
            this.moveCount++;
            
            // Log move if enabled
            if (this.options.logMoves) {
                const moveNotation = this.getMoveNotation(move);
                this.log(`Move ${this.moveCount}: ${currentPlayer} plays ${moveNotation}`, true);
            }
        } else {
            // No valid move found, this shouldn't happen but handle it anyway
            this.log(`Error: No valid move found for ${currentPlayer}`);
            window.chessGame.gameOver = true;
        }
    }
    
    /**
     * Handle game over
     */
    handleGameOver() {
        this.gameCount++;
        
        // Determine winner
        let winner = null;
        if (window.chessGame.checkmateColor === 'white') {
            winner = 'black';
            this.stats.blackWins++;
        } else if (window.chessGame.checkmateColor === 'black') {
            winner = 'white';
            this.stats.whiteWins++;
        } else {
            this.stats.draws++;
        }
        
        // Update move ratings based on game result
        this.updateMoveRatings(winner);
        
        // Log result
        this.log(`Game ${this.gameCount} complete. Winner: ${winner || 'Draw'}`);
        
        // Save knowledge periodically
        if (this.gameCount % this.options.saveInterval === 0) {
            this.saveMoveDatabase();
            this.saveBreakthroughPatterns();
            this.log(`Knowledge saved after ${this.gameCount} games`);
        }
        
        // Update UI
        this.updateUI();
        
        // Check if we've reached the maximum number of games
        if (this.gameCount >= this.options.maxGames) {
            this.log(`Reached maximum of ${this.options.maxGames} games. Self-learning stopped.`);
            this.stop();
            return;
        }
        
        // Reset for next game
        this.moveCount = 0;
        window.chessGame.setupBoard();
    }
    
    /**
     * Get the best move for a position
     * @param {string} position - The position in FEN notation
     * @param {string} player - The current player ('white' or 'black')
     * @returns {Object|null} The best move or null if no move found
     */
    getBestMove(position, player) {
        // Check if we have this position in our database
        if (this.moveDatabase[position]) {
            const moves = this.moveDatabase[position];
            
            // Get all moves with their ratings
            const movesWithRatings = [];
            for (const moveNotation in moves) {
                const moveData = moves[moveNotation];
                const move = this.parseNotation(moveNotation);
                
                if (move) {
                    movesWithRatings.push({
                        move,
                        rating: moveData.rating
                    });
                }
            }
            
            if (movesWithRatings.length > 0) {
                // Sort by rating (highest first)
                movesWithRatings.sort((a, b) => b.rating - a.rating);
                
                // Sometimes choose a random move from the top 3 to encourage exploration
                const randomFactor = Math.random();
                if (randomFactor < 0.2 && movesWithRatings.length > 1) {
                    // 20% chance to pick randomly from top 3 moves
                    const topN = Math.min(3, movesWithRatings.length);
                    const randomIndex = Math.floor(Math.random() * topN);
                    return movesWithRatings[randomIndex].move;
                } else {
                    // 80% chance to pick the best move
                    return movesWithRatings[0].move;
                }
            }
        }
        
        // If position not in database, use regular move generation
        const legalMoves = window.chessGame.getAllPossibleMoves(player);
        if (!legalMoves || legalMoves.length === 0) return null;
        
        // Evaluate each move
        const evaluatedMoves = legalMoves.map(move => ({
            move,
            score: this.evaluateMove(move, player)
        }));
        
        // Sort by score
        evaluatedMoves.sort((a, b) => b.score - a.score);
        
        // Return the best move
        return evaluatedMoves[0].move;
    }
    
    /**
     * Record a move in the database
     * @param {string} position - The position in FEN notation
     * @param {Object} move - The move object
     * @param {string} player - The current player ('white' or 'black')
     */
    recordMove(position, move, player) {
        // Initialize position in database if needed
        if (!this.moveDatabase[position]) {
            this.moveDatabase[position] = {};
        }
        
        // Convert move to notation
        const moveNotation = this.getMoveNotation(move);
        
        // Initialize move in database if needed
        if (!this.moveDatabase[position][moveNotation]) {
            this.moveDatabase[position][moveNotation] = {
                rating: 1200,
                wins: 0,
                losses: 0,
                draws: 0,
                player: player
            };
        }
    }
    
    /**
     * Check for breakthrough moments
     * @param {string} position - The position in FEN notation
     * @param {Object} move - The move object
     * @param {string} player - The current player ('white' or 'black')
     */
    checkForBreakthrough(position, move, player) {
        // Get evaluation before the move
        const beforeEval = this.evaluatePosition();
        
        // Make temporary move
        const piece = window.chessGame.board[move.from.row][move.from.col];
        const targetPiece = window.chessGame.board[move.to.row][move.to.col];
        
        window.chessGame.board[move.to.row][move.to.col] = piece;
        window.chessGame.board[move.from.row][move.from.col] = null;
        
        // Get evaluation after the move
        const afterEval = this.evaluatePosition();
        
        // Restore board
        window.chessGame.board[move.from.row][move.from.col] = piece;
        window.chessGame.board[move.to.row][move.to.col] = targetPiece;
        
        // Calculate evaluation change
        const evalChange = player === 'white' ? afterEval - beforeEval : beforeEval - afterEval;
        
        // Check if this is a significant improvement
        if (evalChange >= 200) {
            // Record breakthrough
            const moveNotation = this.getMoveNotation(move);
            const breakthrough = {
                position,
                move: moveNotation,
                player,
                evalChange,
                gameNumber: this.gameCount,
                timestamp: Date.now()
            };
            
            // Add to breakthroughs list
            this.stats.breakthroughs.push(breakthrough);
            
            // Add to breakthrough patterns
            if (!this.breakthroughPatterns[position]) {
                this.breakthroughPatterns[position] = [];
            }
            this.breakthroughPatterns[position].push(moveNotation);
            
            // Log breakthrough
            this.log(`BREAKTHROUGH: ${player} found a move with +${Math.round(evalChange)} evaluation change`);
            
            // Update UI
            document.getElementById('arn-breakthroughs').textContent = this.stats.breakthroughs.length;
        }
    }
    
    /**
     * Update move ratings based on game result
     * @param {string|null} winner - The winner ('white', 'black', or null for draw)
     */
    updateMoveRatings(winner) {
        const K = 32; // K-factor for rating adjustments
        
        // Go through all positions and moves in the database
        for (const position in this.moveDatabase) {
            for (const moveNotation in this.moveDatabase[position]) {
                const moveData = this.moveDatabase[position][moveNotation];
                const player = moveData.player;
                
                // Skip if player is not set
                if (!player) continue;
                
                // Update win/loss/draw count
                if (!winner) {
                    moveData.draws++;
                } else if (player === winner) {
                    moveData.wins++;
                } else {
                    moveData.losses++;
                }
                
                // Update rating based on result
                const expectedScore = this.getExpectedScore(moveData.rating, 1200);
                let actualScore;
                
                if (!winner) {
                    actualScore = 0.5; // Draw
                } else if (player === winner) {
                    actualScore = 1.0; // Win
                } else {
                    actualScore = 0.0; // Loss
                }
                
                // ELO rating adjustment
                moveData.rating += K * (actualScore - expectedScore);
            }
        }
    }
    
    /**
     * Calculate expected score based on ELO ratings
     * @param {number} ratingA - The first rating
     * @param {number} ratingB - The second rating
     * @returns {number} The expected score (between 0 and 1)
     */
    getExpectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }
    
    /**
     * Evaluate a move
     * @param {Object} move - The move to evaluate
     * @param {string} player - The current player ('white' or 'black')
     * @returns {number} The evaluation score
     */
    evaluateMove(move, player) {
        // Use the game's built-in evaluation if available
        if (window.chessGame.evaluateMoveWithLookahead) {
            return window.chessGame.evaluateMoveWithLookahead(move, 2);
        }
        
        // Simple evaluation if game doesn't provide one
        let score = 0;
        const piece = window.chessGame.board[move.from.row][move.from.col];
        if (!piece) return 0;
        
        // Bonus for captures
        const targetPiece = window.chessGame.board[move.to.row][move.to.col];
        if (targetPiece) {
            score += this.getPieceValue(targetPiece.type);
        }
        
        // Bonus for center control
        const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
        score += (4 - centerDistance) * 5;
        
        // Check if move creates a check
        const originalTarget = window.chessGame.board[move.to.row][move.to.col];
        window.chessGame.board[move.to.row][move.to.col] = piece;
        window.chessGame.board[move.from.row][move.from.col] = null;
        
        const opponentColor = player === 'white' ? 'black' : 'white';
        const createsCheck = window.chessGame.isInCheck(opponentColor);
        
        // Restore board
        window.chessGame.board[move.from.row][move.from.col] = piece;
        window.chessGame.board[move.to.row][move.to.col] = originalTarget;
        
        if (createsCheck) {
            score += 50;
        }
        
        return score;
    }
    
    /**
     * Evaluate the current position
     * @returns {number} The evaluation score
     */
    evaluatePosition() {
        // Use the game's built-in evaluation if available
        if (window.chessGame.evaluatePosition) {
            return window.chessGame.evaluatePosition();
        }
        
        // Simple material evaluation
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = window.chessGame.board[row][col];
                if (piece) {
                    const value = this.getPieceValue(piece.type);
                    score += piece.color === 'white' ? value : -value;
                }
            }
        }
        
        return score;
    }
    
    /**
     * Get the value of a piece
     * @param {string} pieceType - The type of piece
     * @returns {number} The piece value
     */
    getPieceValue(pieceType) {
        // Use the game's piece values if available
        if (window.chessGame.pieceValues && window.chessGame.pieceValues[pieceType]) {
            return window.chessGame.pieceValues[pieceType];
        }
        
        // Default piece values
        const values = {
            'pawn': 100,
            'knight': 320,
            'bishop': 330,
            'rook': 500,
            'queen': 900,
            'king': 20000
        };
        
        return values[pieceType] || 0;
    }
    
    /**
     * Convert a move to notation
     * @param {Object} move - The move object
     * @returns {string} The move notation
     */
    getMoveNotation(move) {
        const files = 'abcdefgh';
        const fromFile = files[move.from.col];
        const fromRank = 8 - move.from.row;
        const toFile = files[move.to.col];
        const toRank = 8 - move.to.row;
        
        return `${fromFile}${fromRank}${toFile}${toRank}`;
    }
    
    /**
     * Parse move notation into a move object
     * @param {string} notation - The move notation
     * @returns {Object|null} The move object or null if invalid
     */
    parseNotation(notation) {
        if (notation.length !== 4) return null;
        
        const files = 'abcdefgh';
        const fromCol = files.indexOf(notation[0]);
        const fromRow = 8 - parseInt(notation[1]);
        const toCol = files.indexOf(notation[2]);
        const toRow = 8 - parseInt(notation[3]);
        
        if (fromCol < 0 || fromRow < 0 || toCol < 0 || toRow < 0) return null;
        if (fromCol > 7 || fromRow > 7 || toCol > 7 || toRow > 7) return null;
        
        const piece = window.chessGame.board[fromRow][fromCol];
        if (!piece) return null;
        
        return {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece
        };
    }
    
    /**
     * Load the move database from localStorage
     */
    loadMoveDatabase() {
        try {
            const savedDatabase = localStorage.getItem('chess_arn_move_database');
            if (savedDatabase) {
                this.moveDatabase = JSON.parse(savedDatabase);
                this.log(`Loaded ${Object.keys(this.moveDatabase).length} positions from database`);
            }
        } catch (error) {
            this.log(`Error loading move database: ${error.message}`);
        }
    }
    
    /**
     * Save the move database to localStorage
     */
    saveMoveDatabase() {
        try {
            localStorage.setItem('chess_arn_move_database', JSON.stringify(this.moveDatabase));
            this.log(`Saved ${Object.keys(this.moveDatabase).length} positions to database`);
        } catch (error) {
            this.log(`Error saving move database: ${error.message}`);
            
            // If storage is full, try to export to file
            if (error.name === 'QuotaExceededError') {
                this.exportToFile('move_database', this.moveDatabase);
            }
        }
    }
    
    /**
     * Load breakthrough patterns from localStorage
     */
    loadBreakthroughPatterns() {
        try {
            const savedPatterns = localStorage.getItem('chess_arn_breakthrough_patterns');
            if (savedPatterns) {
                this.breakthroughPatterns = JSON.parse(savedPatterns);
                this.log(`Loaded ${Object.keys(this.breakthroughPatterns).length} breakthrough patterns`);
            }
        } catch (error) {
            this.log(`Error loading breakthrough patterns: ${error.message}`);
        }
    }
    
    /**
     * Save breakthrough patterns to localStorage
     */
    saveBreakthroughPatterns() {
        try {
            localStorage.setItem('chess_arn_breakthrough_patterns', JSON.stringify(this.breakthroughPatterns));
            this.log(`Saved ${Object.keys(this.breakthroughPatterns).length} breakthrough patterns`);
        } catch (error) {
            this.log(`Error saving breakthrough patterns: ${error.message}`);
        }
    }
    
    /**
     * Export data to a downloadable file
     * @param {string} name - The name of the data
     * @param {Object} data - The data to export
     */
    exportToFile(name, data) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `chess_arn_${name}_${timestamp}.json`;
            
            // Create blob with data
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            
            // Create download link
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            this.log(`Exported ${name} to file: ${filename}`);
        } catch (error) {
            this.log(`Error exporting ${name}: ${error.message}`);
        }
    }
    
    /**
     * Update the UI with current state
     */
    updateUI() {
        document.getElementById('arn-games-played').textContent = this.gameCount;
        document.getElementById('arn-positions').textContent = Object.keys(this.moveDatabase).length;
        document.getElementById('arn-results').textContent = 
            `${this.stats.whiteWins} / ${this.stats.blackWins} / ${this.stats.draws}`;
        document.getElementById('arn-breakthroughs').textContent = this.stats.breakthroughs.length;
    }
    
    /**
     * Add a log entry
     * @param {string} message - The message to log
     * @param {boolean} debug - Whether this is a debug message (not shown in UI)
     */
    log(message, debug = false) {
        console.log(`[Chess ARN] ${message}`);
        
        // Don't add debug messages to UI
        if (debug) return;
        
        const logContainer = document.getElementById('arn-status');
        if (!logContainer) return;
        
        const now = new Date();
        const timestamp = now.toTimeString().substring(0, 8);
        
        const entry = document.createElement('div');
        entry.innerHTML = `<span style="color:#95a5a6;">[${timestamp}]</span> ${message}`;
        
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Limit log entries
        while (logContainer.children.length > 100) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }
    
    /**
     * Get the top moves for a position
     * @param {string} position - The position in FEN notation
     * @param {number} count - The number of moves to return
     * @returns {Array} The top moves
     */
    getTopMoves(position, count = 5) {
        const moves = [];
        
        // Check if we have this position in our database
        if (this.moveDatabase[position]) {
            const positionMoves = this.moveDatabase[position];
            
            // Get all moves with their ratings
            for (const moveNotation in positionMoves) {
                const moveData = positionMoves[moveNotation];
                const move = this.parseNotation(moveNotation);
                
                if (move) {
                    moves.push({
                        move,
                        notation: moveNotation,
                        rating: moveData.rating,
                        wins: moveData.wins,
                        losses: moveData.losses,
                        draws: moveData.draws
                    });
                }
            }
            
            // Sort by rating
            moves.sort((a, b) => b.rating - a.rating);
            
            // Return the top N moves
            return moves.slice(0, count);
        }
        
        return moves;
    }
}

// Create global instance
window.chessARN = new ChessARNIntegration();

// Export the class
export { ChessARNIntegration };
