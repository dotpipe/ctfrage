export class SelfLearningChessEngine {
    constructor() {
        // Initialize chess game and learning components
        this.chessGame = window.chessGame || new EnhancedChess();
        this.learningManager = window.learningEaseManager || new LearningEaseManager(this.chessGame);
        this.counterMovesManager = window.counterMovesManager || new CounterMovesManager();
        
        // Configuration
        this.gamesPlayed = 0;
        this.maxGames = 1000; // Number of games to play
        
        // Learning progression settings
        this.learningPhase = 'tight'; // 'tight', 'balanced', 'exploitative'
        this.phaseSwitchThreshold = 200; // Games before switching phases
        this.difficultyLevel = 8; // Start at maximum difficulty (1-8)
        this.minDifficultyLevel = 1; // Minimum difficulty to explore
        
        // Move database - the core of our learning system
        this.moveDatabase = {
            // Format: positionFEN -> { move: { wins: 0, losses: 0, draws: 0, rating: 1200, difficulty: 5 } }
        };
        
        // Breakthrough patterns - positions where a winning advantage was found
        this.breakthroughPatterns = {
            // Format: pattern -> { moves: [], winRate: 0, difficulty: 5, executionSpeed: 0 }
        };
        
        // Position history to avoid repetition
        this.positionHistory = new Set();
        
        // Statistics tracking
        this.wins = { white: 0, black: 0 };
        this.draws = 0;
        this.moveStats = {
            totalMoves: 0,
            uniquePositions: 0,
            uniqueMoves: 0,
            breakthroughsFound: 0
        };
        
        // Game state
        this.isRunning = false;
        this.gameDelay = 100; // ms between moves
        
        // Current game tracking
        this.currentGameMoves = [];
        this.currentGamePositions = [];
        this.currentGameBreakthroughs = [];
        this.currentGameStartTime = 0;
        
        // Logging
        this.logEnabled = true;
        this.logBuffer = [];
        this.logFlushInterval = null;
    }
    
    // Start the self-learning process
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("Starting self-learning chess engine...");
        
        // Load existing move database if available
        this.loadMoveDatabase();
        
        // Load breakthrough patterns
        this.loadBreakthroughPatterns();
        
        // Initialize logging
        this.initializeLogging();
        
        // Start the learning process
        this.playNextGame();
        
        // Set up periodic saving
        this.saveInterval = setInterval(() => {
            this.saveMoveDatabase();
            this.saveBreakthroughPatterns();
            this.flushLogs();
        }, 60000); // Save every minute
    }
    
    // Initialize logging system
    initializeLogging() {
        if (!this.logEnabled) return;
        
        // Create log file name with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.logFileName = `chess_learning_${timestamp}.log`;
        
        console.log(`Logging to ${this.logFileName}`);
        
        // Set up log buffer flush interval
        this.logFlushInterval = setInterval(() => {
            this.flushLogs();
        }, 10000); // Flush logs every 10 seconds
        
        // Log initial state
        this.log("=== CHESS SELF-LEARNING ENGINE STARTED ===");
        this.log(`Initial learning phase: ${this.learningPhase}`);
        this.log(`Initial difficulty level: ${this.difficultyLevel}`);
        this.log(`Database size: ${Object.keys(this.moveDatabase).length} positions`);
        this.log(`Breakthrough patterns: ${Object.keys(this.breakthroughPatterns).length}`);
    }
    
    // Log a message
    log(message) {
        if (!this.logEnabled) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        
        // Add to buffer
        this.logBuffer.push(logEntry);
        
        // Also log to console
        console.log(message);
        
        // Flush if buffer gets too large
        if (this.logBuffer.length > 1000) {
            this.flushLogs();
        }
    }
    
    // Flush logs to storage
    flushLogs() {
        if (!this.logEnabled || this.logBuffer.length === 0) return;
        
        try {
            // In a browser environment, we can use localStorage for small logs
            // or download as a file for larger logs
            const existingLogs = localStorage.getItem('chess_learning_logs') || '';
            const newLogs = this.logBuffer.join('\n');
            
            // Check if we're exceeding localStorage limits
            if ((existingLogs.length + newLogs.length) > 4000000) { // ~4MB limit
                // Download as file instead
                this.downloadLogs();
            } else {
                localStorage.setItem('chess_learning_logs', existingLogs + '\n' + newLogs);
            }
            
            // Clear buffer
            this.logBuffer = [];
        } catch (error) {
            console.error("Error flushing logs:", error);
        }
    }
    
    // Download logs as a file
    downloadLogs() {
        if (!this.logEnabled || this.logBuffer.length === 0) return;
        
        try {
            // Create blob with logs
            const blob = new Blob([this.logBuffer.join('\n')], { type: 'text/plain' });
            
            // Create download link
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = this.logFileName;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clear buffer
            this.logBuffer = [];
        } catch (error) {
            console.error("Error downloading logs:", error);
        }
    }
    
    // Load move database from storage
    loadMoveDatabase() {
        try {
            const savedDatabase = localStorage.getItem('chess_move_database');
            if (savedDatabase) {
                this.moveDatabase = JSON.parse(savedDatabase);
                this.moveStats.uniquePositions = Object.keys(this.moveDatabase).length;
                
                // Count unique moves
                let uniqueMoves = new Set();
                let totalMoves = 0;
                
                for (const position in this.moveDatabase) {
                    for (const move in this.moveDatabase[position]) {
                        uniqueMoves.add(move);
                        totalMoves++;
                    }
                }
                
                this.moveStats.uniqueMoves = uniqueMoves.size;
                this.moveStats.totalMoves = totalMoves;
                
                this.log(`Loaded move database with ${this.moveStats.uniquePositions} positions and ${this.moveStats.uniqueMoves} unique moves`);
            } else {
                this.log("No existing move database found. Starting fresh.");
            }
        } catch (error) {
            console.error("Error loading move database:", error);
            this.log(`Error loading move database: ${error.message}`);
        }
    }
    
    // Load breakthrough patterns from storage
    loadBreakthroughPatterns() {
        try {
            const savedPatterns = localStorage.getItem('chess_breakthrough_patterns');
            if (savedPatterns) {
                this.breakthroughPatterns = JSON.parse(savedPatterns);
                this.moveStats.breakthroughsFound = Object.keys(this.breakthroughPatterns).length;
                
                this.log(`Loaded ${this.moveStats.breakthroughsFound} breakthrough patterns`);
            } else {
                this.log("No existing breakthrough patterns found. Starting fresh.");
            }
        } catch (error) {
            console.error("Error loading breakthrough patterns:", error);
            this.log(`Error loading breakthrough patterns: ${error.message}`);
        }
    }
    
    // Save move database to storage
    saveMoveDatabase() {
        try {
            // Update stats before saving
            this.moveStats.uniquePositions = Object.keys(this.moveDatabase).length;
            
            // Count unique moves
            let uniqueMoves = new Set();
            let totalMoves = 0;
            
            for (const position in this.moveDatabase) {
                for (const move in this.moveDatabase[position]) {
                    uniqueMoves.add(move);
                    totalMoves++;
                }
            }
            
            this.moveStats.uniqueMoves = uniqueMoves.size;
            this.moveStats.totalMoves = totalMoves;
            
            // Save to localStorage
            localStorage.setItem('chess_move_database', JSON.stringify(this.moveDatabase));
            this.log(`Saved move database with ${this.moveStats.uniquePositions} positions and ${this.moveStats.uniqueMoves} unique moves`);
            
            // If database is getting too large, export to file
            if (this.moveStats.uniquePositions > 10000) {
                this.exportDatabaseToFile();
            }
        } catch (error) {
            console.error("Error saving move database:", error);
            this.log(`Error saving move database: ${error.message}`);
            
            // If localStorage is full, export to file
            if (error.name === 'QuotaExceededError') {
                this.exportDatabaseToFile();
            }
        }
    }
    
    // Save breakthrough patterns to storage
    saveBreakthroughPatterns() {
        try {
            localStorage.setItem('chess_breakthrough_patterns', JSON.stringify(this.breakthroughPatterns));
            this.moveStats.breakthroughsFound = Object.keys(this.breakthroughPatterns).length;
            
            this.log(`Saved ${this.moveStats.breakthroughsFound} breakthrough patterns`);
        } catch (error) {
            console.error("Error saving breakthrough patterns:", error);
            this.log(`Error saving breakthrough patterns: ${error.message}`);
        }
    }
    
    // Export database to downloadable file
    exportDatabaseToFile() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `chess_move_database_${timestamp}.json`;
            
            // Create blob with database
            const blob = new Blob([JSON.stringify(this.moveDatabase)], { type: 'application/json' });
            
            // Create download link
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            this.log(`Exported move database to file: ${filename}`);
        } catch (error) {
            console.error("Error exporting database:", error);
            this.log(`Error exporting database: ${error.message}`);
        }
    }
    
    // Play a single game against itself
    async playNextGame() {
        if (!this.isRunning || this.gamesPlayed >= this.maxGames) {
            this.stop();
            return;
        }
        
        // Update learning phase and difficulty if needed
        this.updateLearningProgression();
        
        // Reset the game
        this.chessGame.setupBoard();
        this.currentGameMoves = [];
        this.currentGamePositions = [];
        this.currentGameBreakthroughs = [];
        this.positionHistory = new Set();
        this.currentGameStartTime = Date.now();
        
        // Set AI difficulty level for this game
        if (this.chessGame.aiLevel !== undefined) {
            this.chessGame.aiLevel = this.difficultyLevel;
        }
        
        // Log game start
        this.log(`Starting game ${this.gamesPlayed + 1}/${this.maxGames}`);
        this.log(`Learning phase: ${this.learningPhase}, Difficulty: ${this.difficultyLevel}`);
        
        // Play until game is over
        let moveCount = 0;
        const maxMoves = 200; // Prevent infinite games
        
        while (!this.chessGame.gameOver && moveCount < maxMoves) {
            await this.makeNextMove();
            await this.delay(this.gameDelay);
            moveCount++;
            
            // Check for threefold repetition
            const currentPosition = this.chessGame.getPositionFEN();
            if (this.isThreefoldRepetition(currentPosition)) {
                this.log("Game drawn by threefold repetition");
                this.draws++;
                break;
            }
        }
        
        // If we hit max moves, declare a draw
        if (moveCount >= maxMoves) {
            this.log("Game ended due to move limit - declaring draw");
            this.draws++;
        } else {
            // Process game results
            this.processGameResult();
        }
        
        // Play next game
        this.gamesPlayed++;
        setTimeout(() => this.playNextGame(), 500);
    }
    
    // Update learning phase and difficulty based on progress
    updateLearningProgression() {
        // Check if we should switch phases
        if (this.gamesPlayed > 0 && this.gamesPlayed % this.phaseSwitchThreshold === 0) {
            // Cycle through phases
            if (this.learningPhase === 'tight') {
                this.learningPhase = 'balanced';
                this.log("Switching to balanced learning phase");
            } else if (this.learningPhase === 'balanced') {
                this.learningPhase = 'exploitative';
                this.log("Switching to exploitative learning phase");
            } else {
                this.learningPhase = 'tight';
                this.log("Switching back to tight learning phase");
            }
        }
        
        // Adjust difficulty based on phase
        if (this.learningPhase === 'tight') {
            // Tight phase: Use high difficulty (7-8)
            this.difficultyLevel = Math.max(7, this.difficultyLevel);
        } else if (this.learningPhase === 'balanced') {
            // Balanced phase: Use medium difficulty (4-6)
            this.difficultyLevel = 4 + Math.floor(Math.random() * 3);
        } else {
            // Exploitative phase: Use varying difficulty (1-8)
            // Occasionally use high difficulty to maintain sharpness
            if (Math.random() < 0.3) {
                this.difficultyLevel = 7 + Math.floor(Math.random() * 2);
            } else {
                this.difficultyLevel = this.minDifficultyLevel + Math.floor(Math.random() * 6);
            }
        }
    }
    
    // Check for threefold repetition
    isThreefoldRepetition(position) {
        // Count occurrences of this position in the current game
        let count = 0;
        for (const pos of this.currentGamePositions) {
            if (pos === position) {
                count++;
                if (count >= 3) return true;
            }
        }
        return false;
    }
    
    // Make the next move in the current game
    async makeNextMove() {
        const currentColor = this.chessGame.currentPlayer;
        
        // Get current position FEN
        const positionFEN = this.chessGame.getPositionFEN();
        
        // Add to position history
        this.currentGamePositions.push(positionFEN);
        
        // Get all possible moves using the game's legal move generator
        const moves = this.chessGame.getAllPossibleMoves(currentColor);
        if (moves.length === 0) return;
        
        // Select move based on learning phase and database
        const selectedMove = this.selectMove(positionFEN, moves, currentColor);
        
        // Check if this is a pawn promotion move
        if (this.isPawnPromotionMove(selectedMove)) {
            await this.handlePawnPromotion(selectedMove, currentColor);
        } else {
            // Execute the move
            this.executeMove(selectedMove);
        }
        
        // Check for breakthrough moments
        this.checkForBreakthrough(positionFEN, selectedMove, currentColor);
        
        // Track the move
        const moveData = {
            move: selectedMove,
            position: positionFEN,
            color: currentColor,
            evaluation: this.evaluateMove(selectedMove, currentColor),
            timestamp: Date.now()
        };
        
        this.currentGameMoves.push(moveData);
        
        // Log the move
        const moveNotation = this.getMoveNotation(selectedMove);
        this.log(`${currentColor} plays ${moveNotation} (eval: ${Math.round(moveData.evaluation)})`);
    }
    
    // Select a move based on learning phase and database
    selectMove(positionFEN, moves, color) {
        // Different selection strategies based on learning phase
        switch (this.learningPhase) {
            case 'tight':
                return this.selectTightMove(positionFEN, moves, color);
            case 'balanced':
                return this.selectBalancedMove(positionFEN, moves, color);
            case 'exploitative':
                return this.selectExploitativeMove(positionFEN, moves, color);
            default:
                return this.selectBalancedMove(positionFEN, moves, color);
        }
    }
    
    // Select a move in tight learning phase (focus on best moves)
    selectTightMove(positionFEN, moves, color) {
        // First, check if we have a breakthrough pattern for this position
        const breakthroughMove = this.getBreakthroughMove(positionFEN, moves);
        if (breakthroughMove) {
            this.log("Using breakthrough pattern move");
            return breakthroughMove;
        }
        
        // Check if we have data for this position in our database
        if (this.moveDatabase[positionFEN] && Object.keys(this.moveDatabase[positionFEN]).length > 0) {
            // In tight phase, almost always use the highest rated move
            if (Math.random() < 0.9) { // 90% chance to use best move
                const movesWithRatings = [];
                
                for (const moveNotation in this.moveDatabase[positionFEN]) {
                    const moveData = this.moveDatabase[positionFEN][moveNotation];
                    const move = this.parseNotation(moveNotation);
                    
                    // Verify the move is valid in current position
                    if (move && this.isValidMove(moves, move)) {
                        movesWithRatings.push({
                            move,
                            rating: moveData.rating
                        });
                    }
                }
                
                if (movesWithRatings.length > 0) {
                    // Sort by rating (descending)
                    movesWithRatings.sort((a, b) => b.rating - a.rating);
                    
                    // Use the best move
                    this.log(`Using best database move with rating ${Math.round(movesWithRatings[0].rating)}`);
                    return movesWithRatings[0].move;
                }
            }
        }
        
        // Evaluate all moves with deep search
        const evaluatedMoves = moves.map(move => {
            // Use deeper evaluation in tight phase
            const score = this.evaluateMove(move, color, 3); // Depth 3
            return { move, score };
        });
        
        // Sort by score (highest first)
        evaluatedMoves.sort((a, b) => b.score - a.score);
        
        // In tight phase, almost always use the best move
        const topIndex = Math.random() < 0.9 ? 0 : Math.floor(Math.random() * Math.min(2, evaluatedMoves.length));
        
        this.log(`Using evaluated move with score ${Math.round(evaluatedMoves[topIndex].score)}`);
        return evaluatedMoves[topIndex].move;
    }
    
    // Select a move in balanced learning phase (mix of best and exploratory moves)
    selectBalancedMove(positionFEN, moves, color) {
        // Check if we have a breakthrough pattern for this position
        if (Math.random() < 0.7) { // 70% chance to use breakthrough
            const breakthroughMove = this.getBreakthroughMove(positionFEN, moves);
            if (breakthroughMove) {
                this.log("Using breakthrough pattern move");
                return breakthroughMove;
            }
        }
        
        // Check if we have data for this position in our database
        if (this.moveDatabase[positionFEN] && Object.keys(this.moveDatabase[positionFEN]).length > 0) {
            // In balanced phase, use a mix of exploitation and exploration
            if (Math.random() < 0.7) { // 70% chance to use known moves
                const movesWithRatings = [];
                
                for (const moveNotation in this.moveDatabase[positionFEN]) {
                    const moveData = this.moveDatabase[positionFEN][moveNotation];
                    const move = this.parseNotation(moveNotation);
                    
                    // Verify the move is valid in current position
                    if (move && this.isValidMove(moves, move)) {
                        movesWithRatings.push({
                            move,
                            rating: moveData.rating
                        });
                    }
                }
                
                if (movesWithRatings.length > 0) {
                    // Sort by rating (descending)
                    movesWithRatings.sort((a, b) => b.rating - a.rating);
                    
                    // Select from top moves with some randomness
                    const topCount = Math.min(3, movesWithRatings.length);
                    const selectedIndex = Math.floor(Math.random() * topCount);
                    
                    this.log(`Using database move with rating ${Math.round(movesWithRatings[selectedIndex].rating)}`);
                    return movesWithRatings[selectedIndex].move;
                }
            }
        }
        
        // Evaluate all moves
        const evaluatedMoves = moves.map(move => {
            const score = this.evaluateMove(move, color, 2); // Depth 2
            return { move, score };
        });
        
        // Sort by score (highest first)
        evaluatedMoves.sort((a, b) => b.score - a.score);
        
        // In balanced phase, select from top moves with some randomness
        const topCount = Math.min(5, Math.max(2, Math.floor(moves.length / 4)));
        const selectedIndex = Math.floor(Math.random() * topCount);
        
        this.log(`Using evaluated move with score ${Math.round(evaluatedMoves[selectedIndex].score)}`);
        return evaluatedMoves[selectedIndex].move;
    }
    
    // Select a move in exploitative learning phase (focus on finding breakthroughs)
    selectExploitativeMove(positionFEN, moves, color) {
        // In exploitative phase, try to find new breakthrough patterns
        
        // First, check if we're in a position where we previously found a breakthrough
        if (Math.random() < 0.5) { // 50% chance to use breakthrough
            const breakthroughMove = this.getBreakthroughMove(positionFEN, moves);
            if (breakthroughMove) {
                this.log("Using breakthrough pattern move");
                return breakthroughMove;
            }
        }
        
        // Check if we have data for this position in our database
        if (this.moveDatabase[positionFEN] && Object.keys(this.moveDatabase[positionFEN]).length > 0) {
            // In exploitative phase, use a mix of known good moves and exploration
            if (Math.random() < 0.5) { // 50% chance to use known moves
                const movesWithRatings = [];
                
                for (const moveNotation in this.moveDatabase[positionFEN]) {
                    const moveData = this.moveDatabase[positionFEN][moveNotation];
                    const move = this.parseNotation(moveNotation);
                    
                    // Verify the move is valid in current position
                    if (move && this.isValidMove(moves, move)) {
                        movesWithRatings.push({
                            move,
                            rating: moveData.rating
                        });
                    }
                }
                
                if (movesWithRatings.length > 0) {
                    // Sort by rating (descending)
                    movesWithRatings.sort((a, b) => b.rating - a.rating);
                    
                    // Select from top moves with significant randomness
                    const topCount = Math.min(5, movesWithRatings.length);
                    const selectedIndex = Math.floor(Math.random() * topCount);
                    
                    this.log(`Using database move with rating ${Math.round(movesWithRatings[selectedIndex].rating)}`);
                    return movesWithRatings[selectedIndex].move;
                }
            }
        }
        
        // Evaluate all moves
        const evaluatedMoves = moves.map(move => {
            const score = this.evaluateMove(move, color);
            return { move, score };
        });
        
        // Sort by score (highest first)
        evaluatedMoves.sort((a, b) => b.score - a.score);
        
        // In exploitative phase, use more randomness to explore
        const topCount = Math.min(8, Math.max(3, Math.floor(moves.length / 3)));
        const selectedIndex = Math.floor(Math.random() * topCount);
        
        this.log(`Using evaluated move with score ${Math.round(evaluatedMoves[selectedIndex].score)}`);
        return evaluatedMoves[selectedIndex].move;
    }
    
    // Get a move from breakthrough patterns
    getBreakthroughMove(positionFEN, validMoves) {
        // Check if we have a direct match in breakthrough patterns
        for (const pattern in this.breakthroughPatterns) {
            if (this.arePositionsSimilar(pattern, positionFEN)) {
                const breakthroughData = this.breakthroughPatterns[pattern];
                
                // Only use patterns with good win rates
                if (breakthroughData.winRate >= 0.6) {
                    // Try each move in the breakthrough sequence
                    for (const moveNotation of breakthroughData.moves) {
                        const move = this.parseNotation(moveNotation);
                        if (move && this.isValidMove(validMoves, move)) {
                            return move;
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    // Check if two positions are similar
    arePositionsSimilar(position1, position2) {
        // Extract piece positions (ignore castling rights, en passant, etc.)
        const pieces1 = position1.split(' ')[0];
        const pieces2 = position2.split(' ')[0];
        
        // Count differences
        let differences = 0;
        const maxDifferences = 3; // Allow up to 3 differences
        
        // Simple character-by-character comparison
        for (let i = 0; i < Math.min(pieces1.length, pieces2.length); i++) {
            if (pieces1[i] !== pieces2[i]) {
                differences++;
                if (differences > maxDifferences) return false;
            }
        }
        
        return true;
    }
    
    // Check if a move is in the list of valid moves
    isValidMove(validMoves, moveToCheck) {
        return validMoves.some(move => 
            move.from.row === moveToCheck.from.row && 
            move.from.col === moveToCheck.from.col && 
            move.to.row === moveToCheck.to.row && 
            move.to.col === moveToCheck.to.col
        );
    }
    
    // Parse move notation into a move object
    parseNotation(notation) {
        if (notation.length !== 4) return null;
        
        const files = 'abcdefgh';
        const fromCol = files.indexOf(notation[0]);
        const fromRow = 8 - parseInt(notation[1]);
        const toCol = files.indexOf(notation[2]);
        const toRow = 8 - parseInt(notation[3]);
        
        if (fromCol < 0 || fromRow < 0 || toCol < 0 || toRow < 0) return null;
        if (fromCol > 7 || fromRow > 7 || toCol > 7 || toRow > 7) return null;
        
        const piece = this.chessGame.board[fromRow][fromCol];
        if (!piece) return null;
        
        return {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece
        };
    }
    
    // Evaluate a move
    evaluateMove(move, color, depth = 2) {
        // Use the game's built-in evaluation if available
        if (this.chessGame.evaluateMoveWithLookahead) {
            return this.chessGame.evaluateMoveWithLookahead(move, depth);
        }
        
        // Simple evaluation if game doesn't provide one
        let score = 0;
        const piece = this.chessGame.board[move.from.row][move.from.col];
        if (!piece) return 0;
        
        // Bonus for captures
        const targetPiece = this.chessGame.board[move.to.row][move.to.col];
        if (targetPiece) {
            score += this.chessGame.pieceValues[targetPiece.type] || 0;
        }
        
        // Bonus for center control
        const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
        score += (4 - centerDistance) * 5;
        
        // Check if move creates a check
        const originalTarget = this.chessGame.board[move.to.row][move.to.col];
        this.chessGame.board[move.to.row][move.to.col] = piece;
        this.chessGame.board[move.from.row][move.from.col] = null;
        
        const opponentColor = color === 'white' ? 'black' : 'white';
        const createsCheck = this.chessGame.isInCheck(opponentColor);
        
        // Restore board
        this.chessGame.board[move.from.row][move.from.col] = piece;
        this.chessGame.board[move.to.row][move.to.col] = originalTarget;
        
        if (createsCheck) {
            score += 50;
        }
        
        return score;
    }
    
    // Check if a move creates a breakthrough moment
    checkForBreakthrough(positionFEN, move, color) {
        // A breakthrough is a move that significantly changes the evaluation
        // or creates a winning advantage
        
        // Get evaluation before the move
        const beforeEval = this.evaluatePosition();
        
        // Make the move
        const piece = this.chessGame.board[move.from.row][move.from.col];
        const targetPiece = this.chessGame.board[move.to.row][move.to.col];
        
        this.chessGame.board[move.to.row][move.to.col] = piece;
        this.chessGame.board[move.from.row][move.from.col] = null;
        
        // Get evaluation after the move
        const afterEval = this.evaluatePosition();
        
        // Restore the board
        this.chessGame.board[move.from.row][move.from.col] = piece;
        this.chessGame.board[move.to.row][move.to.col] = targetPiece;
        
        // Calculate evaluation change
        const evalChange = color === 'white' ? afterEval - beforeEval : beforeEval - afterEval;
        
        // Check if this is a significant improvement
        const isBreakthrough = evalChange >= 200; // Significant advantage gain
        
        if (isBreakthrough) {
            // Record this as a breakthrough
            const moveNotation = this.getMoveNotation(move);
            
            // Create a pattern signature
            const patternSignature = positionFEN;
            
            // Record the breakthrough
            if (!this.breakthroughPatterns[patternSignature]) {
                this.breakthroughPatterns[patternSignature] = {
                    moves: [moveNotation],
                    winRate: 0,
                    difficulty: this.difficultyLevel,
                    executionSpeed: 0,
                    games: 0,
                    wins: 0
                };
            } else {
                // Add this move if not already in the list
                if (!this.breakthroughPatterns[patternSignature].moves.includes(moveNotation)) {
                    this.breakthroughPatterns[patternSignature].moves.push(moveNotation);
                }
            }
            
            // Add to current game breakthroughs
            this.currentGameBreakthroughs.push({
                position: patternSignature,
                move: moveNotation,
                evalBefore: beforeEval,
                evalAfter: afterEval,
                evalChange: evalChange,
                moveNumber: this.currentGameMoves.length + 1,
                timestamp: Date.now()
            });
            
            this.log(`BREAKTHROUGH: ${color} found advantage of ${Math.round(evalChange)} with ${moveNotation}`);
        }
    }
    
    // Evaluate the current position
    evaluatePosition() {
        // Use the game's built-in evaluation if available
        if (this.chessGame.evaluatePosition) {
            return this.chessGame.evaluatePosition();
        }
        
        // Simple material evaluation
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.chessGame.board[row][col];
                if (piece) {
                    const value = this.chessGame.pieceValues[piece.type] || 0;
                    score += piece.color === 'white' ? value : -value;
                }
            }
        }
        
        return score;
    }
    
    // Check if a move is a pawn promotion
    isPawnPromotionMove(move) {
        const piece = this.chessGame.board[move.from.row][move.from.col];
        if (!piece || piece.type !== 'pawn') return false;
        
        return (piece.color === 'white' && move.to.row === 0) || 
               (piece.color === 'black' && move.to.row === 7);
    }
    
    // Handle pawn promotion
    async handlePawnPromotion(move, color) {
        // Choose promotion piece (queen by default)
        const promotionPiece = 'queen';
        
        // Use the game's built-in promotion handler if available
        if (this.chessGame.completePawnPromotion) {
            // Set up the pending promotion
            this.chessGame.pendingPromotion = {
                fromRow: move.from.row,
                fromCol: move.from.col,
                toRow: move.to.row,
                toCol: move.to.col,
                capturedPiece: this.chessGame.board[move.to.row][move.to.col]
            };
            
            // Complete the promotion
            this.chessGame.completePawnPromotion(promotionPiece);
        } else {
            // Manual promotion if game doesn't provide a handler
            const promotedPiece = {
                type: promotionPiece,
                color: color
            };
            
            // Execute the promotion
            const capturedPiece = this.chessGame.board[move.to.row][move.to.col];
            
            // Make the move with promotion
            this.chessGame.board[move.to.row][move.to.col] = promotedPiece;
            this.chessGame.board[move.from.row][move.from.col] = null;
            
            // Update game state
            this.chessGame.currentPlayer = color === 'white' ? 'black' : 'white';
            this.chessGame.updateGameStatus();
        }
        
        this.log(`${color} promotes pawn to ${promotionPiece}`);
    }
    
    // Execute a regular move
    executeMove(move) {
        // Use the game's built-in move execution
        this.chessGame.executeAIMove(move);
        
        // Record the move in our database
        this.recordMoveInDatabase(move);
    }
    
    // Record a move in the database
    recordMoveInDatabase(move) {
        // Get the position before the move
        const positionFEN = this.currentGamePositions[this.currentGamePositions.length - 1];
        
        // Convert move to notation
        const moveNotation = this.getMoveNotation(move);
        
        // Initialize position in database if needed
        if (!this.moveDatabase[positionFEN]) {
            this.moveDatabase[positionFEN] = {};
        }
        
        // Initialize move in database if needed
        if (!this.moveDatabase[positionFEN][moveNotation]) {
            this.moveDatabase[positionFEN][moveNotation] = {
                wins: 0,
                losses: 0,
                draws: 0,
                rating: 1200, // Initial rating
                difficulty: this.difficultyLevel
            };
        }
    }
    
    // Process the result of a completed game
    processGameResult() {
        // Determine winner
        let winner = null;
        if (this.chessGame.checkmateColor === 'white') {
            winner = 'black';
            this.wins.black++;
        } else if (this.chessGame.checkmateColor === 'black') {
            winner = 'white';
            this.wins.white++;
        } else {
            this.draws++;
        }
        
        // Calculate game duration
        const gameDuration = Date.now() - this.currentGameStartTime;
        
        this.log(`Game ${this.gamesPlayed + 1} complete. Winner: ${winner || 'Draw'}, Duration: ${Math.round(gameDuration/1000)}s`);
        
        // Update move ratings based on game result
        this.updateMoveRatings(winner);
        
        // Update breakthrough patterns based on game result
        this.updateBreakthroughPatterns(winner, gameDuration);
        
        // Save database periodically
        if (this.gamesPlayed % 10 === 0) {
            this.saveMoveDatabase();
            this.saveBreakthroughPatterns();
        }
    }
    
    // Update move ratings based on game result
    updateMoveRatings(winner) {
        // Go through all moves in the game
        for (const moveData of this.currentGameMoves) {
            const { move, position, color } = moveData;
            const moveNotation = this.getMoveNotation(move);
            
            // Skip if move isn't in database (shouldn't happen)
            if (!this.moveDatabase[position] || !this.moveDatabase[position][moveNotation]) {
                continue;
            }
            
            const moveEntry = this.moveDatabase[position][moveNotation];
            
            // Update win/loss/draw count
            if (!winner) {
                moveEntry.draws++;
            } else if (color === winner) {
                moveEntry.wins++;
            } else {
                moveEntry.losses++;
            }
            
            // Update rating based on result
            const K = 32; // K-factor for rating adjustments
            const expectedScore = this.getExpectedScore(moveEntry.rating, 1200);
            let actualScore;
            
            if (!winner) {
                actualScore = 0.5; // Draw
            } else if (color === winner) {
                actualScore = 1.0; // Win
            } else {
                actualScore = 0.0; // Loss
            }
            
            // ELO rating adjustment
            moveEntry.rating += K * (actualScore - expectedScore);
            
            // Log significant rating changes
            if (Math.abs(K * (actualScore - expectedScore)) > 16) {
                this.log(`Move ${moveNotation} rating changed to ${Math.round(moveEntry.rating)} (${actualScore > expectedScore ? '+' : ''}${Math.round(K * (actualScore - expectedScore))})`);
            }
        }
    }
    
    // Update breakthrough patterns based on game result
    updateBreakthroughPatterns(winner, gameDuration) {
        // Skip if no breakthroughs in this game
        if (this.currentGameBreakthroughs.length === 0) return;
        
        // Go through all breakthroughs in the game
        for (const breakthrough of this.currentGameBreakthroughs) {
            const { position, move } = breakthrough;
            
            // Skip if pattern isn't in database (shouldn't happen)
            if (!this.breakthroughPatterns[position]) continue;
            
            const pattern = this.breakthroughPatterns[position];
            
            // Update games count
            pattern.games++;
            
            // Update wins count if the breakthrough led to a win
            if (winner) {
                // Get the color that made the breakthrough
                const moveIndex = this.currentGameMoves.findIndex(m => 
                    this.getMoveNotation(m.move) === move
                );
                
                if (moveIndex >= 0) {
                    const breakthroughColor = this.currentGameMoves[moveIndex].color;
                    
                    if (breakthroughColor === winner) {
                        pattern.wins++;
                    }
                }
            }
            
            // Update win rate
            pattern.winRate = pattern.games > 0 ? pattern.wins / pattern.games : 0;
            
            // Update execution speed (time from breakthrough to end of game)
            const breakthroughTime = breakthrough.timestamp;
            const executionTime = this.currentGameStartTime + gameDuration - breakthroughTime;
            
            // Update average execution speed
            if (pattern.executionSpeed === 0) {
                pattern.executionSpeed = executionTime;
            } else {
                pattern.executionSpeed = (pattern.executionSpeed + executionTime) / 2;
            }
            
            // Log breakthrough update
            this.log(`Breakthrough pattern updated: Win rate ${(pattern.winRate * 100).toFixed(1)}%, Execution speed ${Math.round(pattern.executionSpeed/1000)}s`);
        }
    }
    
    // Calculate expected score based on ELO ratings
    getExpectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }
    
    // Stop the self-learning process
    stop() {
        this.isRunning = false;
        this.log("Self-learning chess engine stopped");
        
        // Clear intervals
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        
        if (this.logFlushInterval) {
            clearInterval(this.logFlushInterval);
            this.flushLogs();
        }
        
        // Save final state
        this.saveMoveDatabase();
        this.saveBreakthroughPatterns();
        
        // Final statistics
        this.log("=== Final Statistics ===");
        this.log(`Total games played: ${this.gamesPlayed}`);
        this.log(`White wins: ${this.wins.white} (${(this.wins.white/this.gamesPlayed*100).toFixed(1)}%)`);
        this.log(`Black wins: ${this.wins.black} (${(this.wins.black/this.gamesPlayed*100).toFixed(1)}%)`);
        this.log(`Draws: ${this.draws} (${(this.draws/this.gamesPlayed*100).toFixed(1)}%)`);
        this.log(`Database size: ${this.moveStats.uniquePositions} positions, ${this.moveStats.uniqueMoves} unique moves`);
        this.log(`Breakthrough patterns found: ${Object.keys(this.breakthroughPatterns).length}`);
        
        // Generate reports
        this.generateTopMovesReport();
        this.generateBreakthroughReport();
    }
    
    // Generate a report of top-rated moves
    generateTopMovesReport() {
        this.log("\n=== TOP RATED MOVES ===");
        
        // Find moves with highest ratings
        const allMoves = [];
        
        for (const position in this.moveDatabase) {
            for (const moveNotation in this.moveDatabase[position]) {
                const moveData = this.moveDatabase[position][moveNotation];
                
                // Only include moves with sufficient games
                if (moveData.wins + moveData.losses + moveData.draws >= 5) {
                    allMoves.push({
                        position,
                        move: moveNotation,
                        rating: moveData.rating,
                        games: moveData.wins + moveData.losses + moveData.draws,
                        winRate: moveData.wins / (moveData.wins + moveData.losses + moveData.draws),
                        difficulty: moveData.difficulty
                    });
                }
            }
        }
        
        // Sort by rating (descending)
        allMoves.sort((a, b) => b.rating - a.rating);
        
        // Log top 50 moves
        const topMoves = allMoves.slice(0, 50);
        
        this.log("Position | Move | Rating | Games | Win Rate | Difficulty");
        this.log("---------|------|--------|-------|----------|----------");
        
        for (const move of topMoves) {
            // Truncate position for readability
            const shortPosition = move.position.substring(0, 20) + "...";
            
            this.log(`${shortPosition} | ${move.move} | ${Math.round(move.rating)} | ${move.games} | ${(move.winRate * 100).toFixed(1)}% | ${move.difficulty}`);
        }
    }
    
    // Generate a report of breakthrough patterns
    generateBreakthroughReport() {
        this.log("\n=== TOP BREAKTHROUGH PATTERNS ===");
        
        // Find patterns with highest win rates
        const allPatterns = [];
        
        for (const position in this.breakthroughPatterns) {
            const pattern = this.breakthroughPatterns[position];
            
            // Only include patterns with sufficient games
            if (pattern.games >= 3) {
                allPatterns.push({
                    position,
                    moves: pattern.moves,
                    winRate: pattern.winRate,
                    games: pattern.games,
                    difficulty: pattern.difficulty,
                    executionSpeed: pattern.executionSpeed
                });
            }
        }
        
        // Sort by win rate (descending)
        allPatterns.sort((a, b) => b.winRate - a.winRate);
        
        // Log top 30 patterns
        const topPatterns = allPatterns.slice(0, 30);
        
        this.log("Position | Moves | Win Rate | Games | Difficulty | Execution Speed");
        this.log("---------|-------|----------|-------|------------|----------------");
        
        for (const pattern of topPatterns) {
            // Truncate position for readability
            const shortPosition = pattern.position.substring(0, 15) + "...";
            const movesList = pattern.moves.slice(0, 3).join(', ') + (pattern.moves.length > 3 ? '...' : '');
            
            this.log(`${shortPosition} | ${movesList} | ${(pattern.winRate * 100).toFixed(1)}% | ${pattern.games} | ${pattern.difficulty} | ${Math.round(pattern.executionSpeed/1000)}s`);
        }
    }
    
    // Helper method to convert a move to notation
    getMoveNotation(move) {
        const files = 'abcdefgh';
        const fromFile = files[move.from.col];
        const fromRank = 8 - move.from.row;
        const toFile = files[move.to.col];
        const toRank = 8 - move.to.row;
        
        return `${fromFile}${fromRank}${toFile}${toRank}`;
    }
    
    // Helper method for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Get the best move for a given position and opponent skill level
    getBestMove(positionFEN, opponentSkill = 5) {
        // Check if we have breakthrough patterns for this position
        for (const pattern in this.breakthroughPatterns) {
            if (this.arePositionsSimilar(pattern, positionFEN)) {
                const breakthroughData = this.breakthroughPatterns[pattern];
                
                // Only use patterns with good win rates and appropriate difficulty
                if (breakthroughData.winRate >= 0.6 && breakthroughData.difficulty <= opponentSkill + 1) {
                    // Get the first move in the breakthrough sequence
                    const moveNotation = breakthroughData.moves[0];
                    const move = this.parseNotation(moveNotation);
                    
                    if (move) {
                        this.log(`Using breakthrough pattern against opponent (skill ${opponentSkill})`);
                        return move;
                    }
                }
            }
        }
        
        // Check if we have data for this position in our database
        if (this.moveDatabase[positionFEN]) {
            const movesWithRatings = [];
            
            for (const moveNotation in this.moveDatabase[positionFEN]) {
                const moveData = this.moveDatabase[positionFEN][moveNotation];
                const move = this.parseNotation(moveNotation);
                
                // Only consider moves with sufficient games and appropriate difficulty
                if (move && (moveData.wins + moveData.losses + moveData.draws >= 3) && 
                    moveData.difficulty <= opponentSkill + 1) {
                    movesWithRatings.push({
                        move,
                        rating: moveData.rating,
                        difficulty: moveData.difficulty
                    });
                }
            }
            
            if (movesWithRatings.length > 0) {
                // Sort by rating (descending)
                movesWithRatings.sort((a, b) => b.rating - a.rating);
                
                // Select a move based on opponent skill
                // Against weaker opponents, we can use slightly lower-rated moves
                const skillAdjustment = Math.max(0, 8 - opponentSkill); // 0 for skill 8, 7 for skill 1
                const selectionIndex = Math.min(skillAdjustment, movesWithRatings.length - 1);
                
                this.log(`Using database move with rating ${Math.round(movesWithRatings[selectionIndex].rating)} against opponent (skill ${opponentSkill})`);
                return movesWithRatings[selectionIndex].move;
            }
        }
        
        // If no suitable move found, return null (let the game use its default AI)
        return null;
    }
    
    // Get top N moves for a position with their ratings, filtered by difficulty
    getTopMoves(positionFEN, maxDifficulty = 8, n = 5) {
        // Check if we have data for this position
        if (!this.moveDatabase[positionFEN]) {
            return [];
        }
        
        const moves = [];
        
        // Collect all moves with their ratings
        for (const moveNotation in this.moveDatabase[positionFEN]) {
            const moveData = this.moveDatabase[positionFEN][moveNotation];
            
            // Only include moves with sufficient games and appropriate difficulty
            if (moveData.wins + moveData.losses + moveData.draws >= 3 && 
                moveData.difficulty <= maxDifficulty) {
                moves.push({
                    notation: moveNotation,
                    move: this.parseNotation(moveNotation),
                    rating: moveData.rating,
                    games: moveData.wins + moveData.losses + moveData.draws,
                    winRate: moveData.wins / (moveData.wins + moveData.losses + moveData.draws),
                    difficulty: moveData.difficulty
                });
            }
        }
        
        // Sort by rating (descending)
        moves.sort((a, b) => b.rating - a.rating);
        
        // Return top N moves
        return moves.slice(0, n);
    }
    
    // Set the difficulty level for learning
    setDifficultyLevel(level) {
        if (level >= this.minDifficultyLevel && level <= 8) {
            this.difficultyLevel = level;
            this.log(`Difficulty level set to ${level}`);
            
            // Update game's AI level if available
            if (this.chessGame.aiLevel !== undefined) {
                this.chessGame.aiLevel = level;
            }
            
            return true;
        }
        return false;
    }
    
    // Set the learning phase manually
    setLearningPhase(phase) {
        if (['tight', 'balanced', 'exploitative'].includes(phase)) {
            this.learningPhase = phase;
            this.log(`Learning phase set to ${phase}`);
            return true;
        }
        return false;
    }
}
