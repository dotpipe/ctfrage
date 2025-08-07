/**
 * AI Tutelage System for Enhanced Chess
 * This class extends an existing chess game with learning, analysis,
 * and tutoring capabilities, persisting its knowledge using localStorage.
 */
export class ChessTutelage {
    /**
     * Initializes the tutelage system.
     * @param {EnhancedChess} chessGame - The main chess game instance.
     */
    constructor(chessGame) {
        this.chessGame = chessGame;

        // --- Learning & Data ---
        this.learnedMoves = new Map();
        this.learnedSequences = new Map();
        this.recognizedPatterns = new Map();

        // --- Settings ---
        this.learningEnabled = true;
        this.learningRate = 0.2; // How quickly AI adopts new moves (0-1)
        this.explorationRate = 0.15; // Chance to try learned moves (0-1)
        this.patternRecognitionThreshold = 0.7; // Minimum similarity for pattern recognition

        // --- Statistics ---
        this.learnedMovesCount = 0;
        this.recognizedPatternsCount = 0;
        this.appliedLearnedMovesCount = 0;

        // --- Initialization ---
        // Initialize databases first to ensure methods are available
        this.initializeDatabases();
        // Load persistent data from previous sessions
        this.loadFromLocalStorage();
        // Set up the UI panel
        this.createTutelageUI();
        // Hook into the game's move processing
        this.setupEventHooks();
        // Set up automatic saving to localStorage
        this.setupAutoSave();
    }

    //================================================================================
    // SECTION: Initialization and Data Persistence (localStorage)
    //================================================================================

    /**
     * Initializes all knowledge databases for patterns and tactics.
     */
    initializeDatabases() {
        this.patternDatabase = this.initializePatternDatabase();
        this.tacticalMotifs = this.initializeTacticalMotifs();
    }

    /**
     * Loads the learned moves, patterns, and statistics from the browser's localStorage.
     * This allows the AI's knowledge to persist between game sessions.
     */
    loadFromLocalStorage() {
        try {
            const storedLearnedMoves = localStorage.getItem('chessTutelage_learnedMoves');
            if (storedLearnedMoves) {
                this.learnedMoves = new Map(JSON.parse(storedLearnedMoves));
                this.learnedMovesCount = this.learnedMoves.size;
            }

            const storedRecognizedPatterns = localStorage.getItem('chessTutelage_recognizedPatterns');
            if (storedRecognizedPatterns) {
                this.recognizedPatterns = new Map(JSON.parse(storedRecognizedPatterns));
                this.recognizedPatternsCount = this.recognizedPatterns.size;
            }

            const storedStats = localStorage.getItem('chessTutelage_statistics');
            if (storedStats) {
                const stats = JSON.parse(storedStats);
                this.appliedLearnedMovesCount = stats.appliedLearnedMovesCount || 0;
            }

            console.log("Successfully loaded chess tutelage data from localStorage.");
            this.updateStatisticsDisplay();
        } catch (error) {
            console.error("Error loading data from localStorage:", error);
            this.resetLearningData();
        }
    }

    /**
     * Saves the current state of learned data to localStorage.
     */
    saveToLocalStorage() {
        try {
            // Convert Maps to arrays of [key, value] pairs for JSON serialization
            const learnedMovesArray = Array.from(this.learnedMoves.entries());
            const recognizedPatternsArray = Array.from(this.recognizedPatterns.entries());

            localStorage.setItem('chessTutelage_learnedMoves', JSON.stringify(learnedMovesArray));
            localStorage.setItem('chessTutelage_recognizedPatterns', JSON.stringify(recognizedPatternsArray));

            const statistics = {
                appliedLearnedMovesCount: this.appliedLearnedMovesCount
            };
            localStorage.setItem('chessTutelage_statistics', JSON.stringify(statistics));
        } catch (error) {
            console.error("Error saving data to localStorage:", error);
        }
    }

    /**
     * Sets up automatic saving mechanisms to prevent data loss.
     */
    setupAutoSave() {
        // Save data every 3 minutes
        this.autoSaveInterval = setInterval(() => this.saveToLocalStorage(), 180000);
        // Save data when the user leaves the page
        window.addEventListener('beforeunload', () => this.saveToLocalStorage());
    }

    /**
     * Resets all learning data, both in memory and in localStorage.
     */
    resetLearningData() {
        if (confirm('Are you sure you want to reset all learning data? This cannot be undone.')) {
            this.learnedMoves = new Map();
            this.recognizedPatterns = new Map();
            this.learnedMovesCount = 0;
            this.recognizedPatternsCount = 0;
            this.appliedLearnedMovesCount = 0;

            localStorage.removeItem('chessTutelage_learnedMoves');
            localStorage.removeItem('chessTutelage_recognizedPatterns');
            localStorage.removeItem('chessTutelage_statistics');

            this.updateStatisticsDisplay();
            console.log("All learning data has been reset.");
        }
    }

    //================================================================================
    // SECTION: UI Management
    //================================================================================

    /**
     * Creates the tutelage panel UI and injects necessary CSS.
     */
    createTutelageUI() {
        if (document.getElementById('tutelage-panel')) return;

        const gameInfo = document.querySelector('.game-info');
        if (gameInfo) {
            const tutelagePanel = document.createElement('div');
            tutelagePanel.id = 'tutelage-panel';
            tutelagePanel.className = 'tutelage-panel';
            tutelagePanel.innerHTML = `
                <h4>Chess Tutelage System</h4>
                <div class="tutelage-controls">
                    <label><input type="checkbox" id="enable-learning" checked> Enable Learning</label>
                    <button id="show-learned-moves">Show Learned Data</button>
                    <button id="reset-learning-data" title="Reset all learned moves and patterns">Reset Data</button>
                </div>
                <div class="pattern-recognition">
                    <h5>Recognized Patterns</h5>
                    <div id="recognized-patterns">No patterns detected yet.</div>
                </div>
                <div class="tactical-motifs">
                    <h5>Tactical Motifs</h5>
                    <div id="detected-motifs">No tactics detected yet.</div>
                </div>
                <div class="learning-stats">
                    <div>Learned Moves: <span id="learned-moves-count">0</span></div>
                    <div>Recognized Patterns: <span id="recognized-patterns-count">0</span></div>
                    <div>Applied Learned Moves: <span id="applied-learned-moves-count">0</span></div>
                </div>
            `;
            gameInfo.appendChild(tutelagePanel);

            // Add event listeners
            document.getElementById('enable-learning').addEventListener('change', (e) => this.learningEnabled = e.target.checked);
            document.getElementById('show-learned-moves').addEventListener('click', () => this.showLearnedMovesModal());
            document.getElementById('reset-learning-data').addEventListener('click', () => this.resetLearningData());
        }
    }

    /**
     * Displays a modal with all learned moves and recognized patterns.
     */
    showLearnedMovesModal() {
        // Implementation for showing a modal with learned data
        // (This can be complex, a simple alert is shown for brevity here)
        let learnedDataInfo = "--- Learned Moves ---\n";
        if (this.learnedMoves.size > 0) {
            this.learnedMoves.forEach((data, fen) => {
                learnedDataInfo += `Position: ${fen.split(' ')[0]} -> Move: ${data.notation}\n`;
            });
        } else {
            learnedDataInfo += "None\n";
        }

        learnedDataInfo += "\n--- Recognized Patterns ---\n";
        if (this.recognizedPatterns.size > 0) {
            this.recognizedPatterns.forEach((data, name) => {
                learnedDataInfo += `${data.name}: Recognized ${data.count} times.\n`;
            });
        } else {
            learnedDataInfo += "None\n";
        }

        alert(learnedDataInfo);
    }

    /**
     * Updates the statistics counters in the UI panel.
     */
    updateStatisticsDisplay() {
        const learnedMovesEl = document.getElementById('learned-moves-count');
        const recognizedPatternsEl = document.getElementById('recognized-patterns-count');
        const appliedMovesEl = document.getElementById('applied-learned-moves-count');

        if (learnedMovesEl) learnedMovesEl.textContent = this.learnedMovesCount;
        if (recognizedPatternsEl) recognizedPatternsEl.textContent = this.recognizedPatternsCount;
        if (appliedMovesEl) appliedMovesEl.textContent = this.appliedLearnedMovesCount;
    }

    //================================================================================
    // SECTION: Game Hooks and Learning Logic
    //================================================================================

    /**
     * Wraps the original game methods to hook into game events.
     */
    setupEventHooks() {
        const originalMakeMove = this.chessGame.makeMove;
        this.chessGame.makeMove = (fromRow, fromCol, toRow, toCol) => {
            const positionFEN = this.chessGame.getPositionFEN(); // Get FEN before the move
            originalMakeMove.call(this.chessGame, fromRow, fromCol, toRow, toCol);
            if (this.learningEnabled) {
                this.learnFromMove(positionFEN, fromRow, fromCol, toRow, toCol, 'human');
            }
            this.analyzePosition();
        };

        const originalMakeAIMove = this.chessGame.makeAIMove;
        this.chessGame.makeAIMove = () => {
            if (this.learningEnabled && Math.random() < this.explorationRate) {
                const learnedMove = this.getLearnedMove();
                if (learnedMove) {
                    console.log("AI is using a learned move:", learnedMove);
                    this.appliedLearnedMovesCount++;
                    this.updateStatisticsDisplay();
                    this.chessGame.executeAIMove(learnedMove);
                    return;
                }
            }
            originalMakeAIMove.call(this.chessGame);
        };
    }

    /**
     * Learns from a move made in the game.
     * @param {string} positionFEN - The FEN string of the position *before* the move.
     * @param {number} fromRow - The starting row of the move.
     * @param {number} fromCol - The starting column of the move.
     * @param {number} toRow - The ending row of the move.
     * @param {number} toCol - The ending column of the move.
     * @param {string} source - The source of the move (e.g., 'human', 'engine').
     */
    learnFromMove(positionFEN, fromRow, fromCol, toRow, toCol, source) {
        const move = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
        const notation = this.chessGame.getMoveNotation(fromRow, fromCol, toRow, toCol, this.chessGame.board[toRow][toCol], null); // Simplified notation
        const strength = this.chessGame.evaluatePosition(); // Simplified strength

        if (!this.learnedMoves.has(positionFEN)) {
            this.learnedMoves.set(positionFEN, { move, notation, strength, source, count: 1 });
            this.learnedMovesCount++;
        } else {
            const existing = this.learnedMoves.get(positionFEN);
            existing.strength = existing.strength * (1 - this.learningRate) + strength * this.learningRate;
            existing.count++;
        }
        this.updateStatisticsDisplay();
        this.saveToLocalStorage(); // Save after learning
    }

    /**
     * Retrieves a learned move for the current position if one exists.
     * @returns {object|null} The learned move object or null.
     */
    getLearnedMove() {
        const positionFEN = this.chessGame.getPositionFEN();
        if (this.learnedMoves.has(positionFEN)) {
            const moveData = this.learnedMoves.get(positionFEN);
            // Verify the move is still valid in the current context
            if (this.chessGame.isValidMove(moveData.move.from.row, moveData.move.from.col, moveData.move.to.row, moveData.move.to.col)) {
                return moveData.move;
            }
        }
        return null;
    }

    /**
     * Analyzes the current board position for all known patterns and tactics.
     */
    analyzePosition() {
        if (!this.learningEnabled) return;

        const recognizedPatternsEl = document.getElementById('recognized-patterns');
        const detectedMotifsEl = document.getElementById('detected-motifs');
        if (recognizedPatternsEl) recognizedPatternsEl.innerHTML = '';
        if (detectedMotifsEl) detectedMotifsEl.innerHTML = '';

        let patternsFound = false;
        this.patternDatabase.forEach((pattern, key) => {
            if (pattern.detection()) {
                patternsFound = true;
                if (recognizedPatternsEl) {
                    const tag = document.createElement('div');
                    tag.className = 'pattern-tag';
                    tag.textContent = pattern.name;
                    tag.title = pattern.description;
                    recognizedPatternsEl.appendChild(tag);
                }
                // Update stats and save
                if (!this.recognizedPatterns.has(key)) {
                    this.recognizedPatterns.set(key, { name: pattern.name, description: pattern.description, count: 1 });
                    this.recognizedPatternsCount++;
                } else {
                    this.recognizedPatterns.get(key).count++;
                }
                this.updateStatisticsDisplay();
                this.saveToLocalStorage();
            }
        });

        let motifsFound = false;
        this.tacticalMotifs.forEach((motif) => {
            if (motif.detection()) {
                motifsFound = true;
                if (detectedMotifsEl) {
                    const tag = document.createElement('div');
                    tag.className = 'motif-tag';
                    tag.textContent = motif.name;
                    tag.title = motif.description;
                    detectedMotifsEl.appendChild(tag);
                }
            }
        });

        if (!patternsFound && recognizedPatternsEl) recognizedPatternsEl.textContent = 'No patterns detected.';
        if (!motifsFound && detectedMotifsEl) detectedMotifsEl.textContent = 'No tactics detected.';
    }

    //================================================================================
    // SECTION: Pattern and Tactic Detection Logic
    //================================================================================

    // --- Database Initializers ---

    initializePatternDatabase() {
        const patterns = new Map();
        patterns.set("isolated-pawn", { name: "Isolated Pawn", description: "A pawn with no friendly pawns on adjacent files.", detection: this.detectIsolatedPawn.bind(this) });
        patterns.set("doubled-pawns", { name: "Doubled Pawns", description: "Two pawns of the same color on the same file.", detection: this.detectDoubledPawns.bind(this) });
        patterns.set("passed-pawn", { name: "Passed Pawn", description: "A pawn with no enemy pawns blocking its path to promotion.", detection: this.detectPassedPawn.bind(this) });
        patterns.set("fianchetto", { name: "Fianchetto", description: "A bishop developed to g2/b2 (White) or g7/b7 (Black).", detection: this.detectFianchetto.bind(this) });
        patterns.set("open-file-rook", { name: "Rook on Open File", description: "A rook on a file with no pawns.", detection: this.detectOpenFileRook.bind(this) });
        return patterns;
    }

    initializeTacticalMotifs() {
        const motifs = new Map();
        motifs.set("pin", { name: "Pin", description: "A piece is attacked and cannot move without exposing a more valuable piece.", detection: this.detectPin.bind(this) });
        motifs.set("fork", { name: "Fork", description: "A single piece attacks two or more enemy pieces at once.", detection: this.detectFork.bind(this) });
        motifs.set("skewer", { name: "Skewer", description: "An attack on two pieces in a line, where the more valuable piece is in front.", detection: this.detectSkewer.bind(this) });
        motifs.set("discovered-attack", { name: "Discovered Attack", description: "Moving one piece uncovers an attack from another piece.", detection: this.detectDiscoveredAttack.bind(this) });
        return motifs;
    }

    // --- Detection Implementations ---

    detectIsolatedPawn() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.chessGame.board[r][c];
                if (piece && piece.type === 'pawn') {
                    let hasFriendlyNeighbor = false;
                    // Check left file
                    if (c > 0) {
                        for (let i = 0; i < 8; i++) {
                            const neighbor = this.chessGame.board[i][c - 1];
                            if (neighbor && neighbor.type === 'pawn' && neighbor.color === piece.color) {
                                hasFriendlyNeighbor = true;
                                break;
                            }
                        }
                    }
                    if (hasFriendlyNeighbor) continue;
                    // Check right file
                    if (c < 7) {
                        for (let i = 0; i < 8; i++) {
                            const neighbor = this.chessGame.board[i][c + 1];
                            if (neighbor && neighbor.type === 'pawn' && neighbor.color === piece.color) {
                                hasFriendlyNeighbor = true;
                                break;
                            }
                        }
                    }
                    if (!hasFriendlyNeighbor) return true; // Found an isolated pawn
                }
            }
        }
        return false;
    }

    detectDoubledPawns() {
        for (let c = 0; c < 8; c++) {
            let whitePawnCount = 0;
            let blackPawnCount = 0;
            for (let r = 0; r < 8; r++) {
                const piece = this.chessGame.board[r][c];
                if (piece && piece.type === 'pawn') {
                    if (piece.color === 'white') whitePawnCount++;
                    else blackPawnCount++;
                }
            }
            if (whitePawnCount > 1 || blackPawnCount > 1) return true;
        }
        return false;
    }

    detectPassedPawn() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.chessGame.board[r][c];
                if (piece && piece.type === 'pawn') {
                    let isPassed = true;
                    const direction = piece.color === 'white' ? -1 : 1;
                    const enemyColor = piece.color === 'white' ? 'black' : 'white';

                    // Check files in front
                    for (let checkCol = Math.max(0, c - 1); checkCol <= Math.min(7, c + 1); checkCol++) {
                        for (let checkRow = r + direction; checkRow >= 0 && checkRow < 8; checkRow += direction) {
                            const blockingPiece = this.chessGame.board[checkRow][checkCol];
                            if (blockingPiece && blockingPiece.type === 'pawn' && blockingPiece.color === enemyColor) {
                                isPassed = false;
                                break;
                            }
                        }
                        if (!isPassed) break;
                    }
                    if (isPassed) return true;
                }
            }
        }
        return false;
    }

    detectFianchetto() {
        // White fianchetto
        const b2 = this.chessGame.board[6][1];
        const g2 = this.chessGame.board[6][6];
        if ((b2 && b2.type === 'bishop' && b2.color === 'white') || (g2 && g2.type === 'bishop' && g2.color === 'white')) {
            return true;
        }
        // Black fianchetto
        const b7 = this.chessGame.board[1][1];
        const g7 = this.chessGame.board[1][6];
        if ((b7 && b7.type === 'bishop' && b7.color === 'black') || (g7 && g7.type === 'bishop' && g7.color === 'black')) {
            return true;
        }
        return false;
    }

    detectOpenFileRook() {
        for (let c = 0; c < 8; c++) {
            let hasPawn = false;
            for (let r = 0; r < 8; r++) {
                const piece = this.chessGame.board[r][c];
                if (piece && piece.type === 'pawn') {
                    hasPawn = true;
                    break;
                }
            }
            if (!hasPawn) {
                for (let r = 0; r < 8; r++) {
                    const piece = this.chessGame.board[r][c];
                    if (piece && piece.type === 'rook') return true;
                }
            }
        }
        return false;
    }

    /**
     * Detects pins on the board.
     * A pin is when a piece cannot move because it would expose a more valuable piece behind it.
     * @returns {boolean} True if a pin is detected.
     */
    detectPin() {
        // Check for pins by sliding pieces (queen, rook, bishop)
        const board = this.chessGame.board;

        // Directions for sliding pieces: horizontal, vertical, diagonal
        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],  // Rook/Queen directions
            [1, 1], [1, -1], [-1, 1], [-1, -1]  // Bishop/Queen directions
        ];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (!piece) continue;

                // Check if this piece can pin (queen, rook, bishop)
                if (piece.type !== 'queen' && piece.type !== 'rook' && piece.type !== 'bishop') continue;

                // Determine which directions this piece can move
                const validDirs = [];
                if (piece.type === 'queen' || piece.type === 'rook') {
                    validDirs.push(0, 1, 2, 3); // Horizontal and vertical
                }
                if (piece.type === 'queen' || piece.type === 'bishop') {
                    validDirs.push(4, 5, 6, 7); // Diagonal
                }

                // Check each valid direction for a pin
                for (const dirIndex of validDirs) {
                    const [dr, dc] = directions[dirIndex];
                    let firstPiece = null;
                    let firstPiecePos = null;
                    let secondPiece = null;
                    let secondPiecePos = null;

                    // Look along the direction
                    for (let i = 1; i < 8; i++) {
                        const nr = r + dr * i;
                        const nc = c + dc * i;

                        // Check if we're still on the board
                        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

                        const targetPiece = board[nr][nc];
                        if (!targetPiece) continue;

                        // Found first piece
                        if (!firstPiece) {
                            firstPiece = targetPiece;
                            firstPiecePos = [nr, nc];
                        }
                        // Found second piece
                        else if (!secondPiece) {
                            secondPiece = targetPiece;
                            secondPiecePos = [nr, nc];
                            break; // No need to look further
                        }
                    }

                    // Check if we have a pin
                    if (firstPiece && secondPiece &&
                        firstPiece.color !== piece.color &&
                        secondPiece.color === firstPiece.color) {

                        // Check if the second piece is more valuable than the first
                        const pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
                        if (pieceValues[secondPiece.type] > pieceValues[firstPiece.type] || secondPiece.type === 'king') {
                            return true; // Found a pin!
                        }
                    }
                }
            }
        }

        return false;
    }

    /**
     * Detects skewers on the board.
     * A skewer is similar to a pin, but the more valuable piece is in front.
     * @returns {boolean} True if a skewer is detected.
     */
    detectSkewer() {
        const board = this.chessGame.board;

        // Directions for sliding pieces: horizontal, vertical, diagonal
        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],  // Rook/Queen directions
            [1, 1], [1, -1], [-1, 1], [-1, -1]  // Bishop/Queen directions
        ];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (!piece) continue;

                // Check if this piece can skewer (queen, rook, bishop)
                if (piece.type !== 'queen' && piece.type !== 'rook' && piece.type !== 'bishop') continue;

                // Determine which directions this piece can move
                const validDirs = [];
                if (piece.type === 'queen' || piece.type === 'rook') {
                    validDirs.push(0, 1, 2, 3); // Horizontal and vertical
                }
                if (piece.type === 'queen' || piece.type === 'bishop') {
                    validDirs.push(4, 5, 6, 7); // Diagonal
                }

                // Check each valid direction for a skewer
                for (const dirIndex of validDirs) {
                    const [dr, dc] = directions[dirIndex];
                    let firstPiece = null;
                    let firstPiecePos = null;
                    let secondPiece = null;
                    let secondPiecePos = null;

                    // Look along the direction
                    for (let i = 1; i < 8; i++) {
                        const nr = r + dr * i;
                        const nc = c + dc * i;

                        // Check if we're still on the board
                        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

                        const targetPiece = board[nr][nc];
                        if (!targetPiece) continue;

                        // Found first piece
                        if (!firstPiece) {
                            firstPiece = targetPiece;
                            firstPiecePos = [nr, nc];
                        }
                        // Found second piece
                        else if (!secondPiece) {
                            secondPiece = targetPiece;
                            secondPiecePos = [nr, nc];
                            break; // No need to look further
                        }
                    }

                    // Check if we have a skewer
                    if (firstPiece && secondPiece &&
                        firstPiece.color !== piece.color &&
                        secondPiece.color === firstPiece.color) {

                        // Check if the first piece is more valuable than the second
                        const pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
                        if (pieceValues[firstPiece.type] > pieceValues[secondPiece.type] || firstPiece.type === 'king') {
                            return true; // Found a skewer!
                        }
                    }
                }
            }
        }

        return false;
    }

    /**
     * Detects discovered attacks on the board.
     * A discovered attack occurs when moving one piece reveals an attack from another piece.
     * @returns {boolean} True if a potential discovered attack is detected.
     */
    detectDiscoveredAttack() {
        const board = this.chessGame.board;

        // Directions for sliding pieces: horizontal, vertical, diagonal
        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],  // Rook/Queen directions
            [1, 1], [1, -1], [-1, 1], [-1, -1]  // Bishop/Queen directions
        ];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (!piece) continue;

                // Check if this piece can deliver a discovered attack (any piece can potentially move out of the way)

                // For each direction, check if there's a friendly sliding piece behind this piece
                for (const [dr, dc] of directions) {
                    let foundFriendlyPiece = false;

                    // Look behind the current piece
                    for (let i = 1; i < 8; i++) {
                        const nr = r - dr * i;  // Note the negative direction
                        const nc = c - dc * i;

                        // Check if we're still on the board
                        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

                        const behindPiece = board[nr][nc];
                        if (!behindPiece) continue;

                        // If we find a friendly sliding piece that could attack through this piece
                        if (behindPiece.color === piece.color) {
                            if ((behindPiece.type === 'queen') ||
                                (behindPiece.type === 'rook' && (dr === 0 || dc === 0)) ||
                                (behindPiece.type === 'bishop' && dr !== 0 && dc !== 0)) {
                                foundFriendlyPiece = true;
                                break;
                            } else {
                                break; // Found a non-sliding piece, can't see further
                            }
                        } else {
                            break; // Found an enemy piece, can't see further
                        }
                    }

                    // If we found a friendly sliding piece, check if there's an enemy piece in front
                    if (foundFriendlyPiece) {
                        for (let i = 1; i < 8; i++) {
                            const nr = r + dr * i;
                            const nc = c + dc * i;

                            // Check if we're still on the board
                            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

                            const frontPiece = board[nr][nc];
                            if (!frontPiece) continue;

                            // If we find an enemy piece, we have a potential discovered attack
                            if (frontPiece.color !== piece.color) {
                                return true;
                            } else {
                                break; // Found another friendly piece, can't see further
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    detectFork() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.chessGame.board[r][c];
                if (!piece || (piece.type !== 'knight' && piece.type !== 'pawn' && piece.type !== 'queen')) continue;

                let targets = 0;
                for (let tr = 0; tr < 8; tr++) {
                    for (let tc = 0; tc < 8; tc++) {
                        if (this.chessGame.isValidMoveIgnoreCheck(r, c, tr, tc)) {
                            const targetPiece = this.chessGame.board[tr][tc];
                            if (targetPiece && targetPiece.color !== piece.color && targetPiece.type !== 'pawn') {
                                targets++;
                            }
                        }
                    }
                }
                if (targets >= 2) return true;
            }
        }
        return false;
    }

}
