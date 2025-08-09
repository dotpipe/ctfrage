/**
 * OptimizedChessARN - A more efficient implementation using a move tree structure
 */
export class OptimizedChessARN {
  constructor(options = {}) {
    // Configuration
    this.options = {
      gameDelay: 50,          // Milliseconds between moves
      maxGames: 10000,        // Maximum number of games to play
      saveInterval: 10,       // Save knowledge every X games
      logMoves: true,         // Whether to log each move
      ...options
    };
    
    // State
    this.isRunning = false;
    this.isPaused = false;
    this.gameCount = 0;
    this.moveCount = 0;
    this.gameInterval = null;
    this.startTime = null;
    this.learningDepth = 0;
    
    // Exploration parameters
    this.explorationRate = 0.5;  // 0-1, how often to try new moves vs. best known moves
    this.explorationPhase = 'balanced'; // 'aggressive', 'balanced', 'conservative', 'mastery'
    this.noveltyBonus = 100;     // Bonus for trying new moves
    this.explorationProgress = 0;  // 0-100, how much of the space we've explored
    
    // Statistics
    this.stats = {
      whiteWins: 0,
      blackWins: 0,
      draws: 0,
      discoveries: [],
      uniqueMoves: new Set(),
      uniquePositions: new Set(),
      explorationMilestones: []
    };
    
    // The optimized move tree structure
    this.moveTree = {
      // The root represents the starting position
      root: {
        // Each key is a move, value is move data and responses
        moves: {},
        // Statistics for this position
        stats: {
          timesVisited: 0,
          firstSeen: Date.now()
        }
      }
    };
    
    // Current game state
    this.currentGameMoves = [];
    this.currentPosition = 'start';
    
    // Session management
    this.sessionState = {
      currentPosition: null,
      currentGameNumber: 0,
      currentMoveNumber: 0,
      lastSaveTime: null,
      explorationPath: [],
      learningMilestones: []
    };
    
    // Auto-save settings
    this.autoSaveInterval = options.autoSaveInterval || 60000; // Default: save every minute
    this.autoSaveTimer = null;
    
    // Load existing knowledge if available
    this.loadKnowledge();
    
    // Calculate initial exploration progress
    this.updateExplorationProgress();
    
    console.log("OptimizedChessARN initialized with efficient move tree structure");
  }

  // Add these methods to your OptimizedChessARN class

/**
 * Record a learning entry with mistake context
 */
recordLearningEntry(entry) {
  if (!entry || !entry.position) return;
  
  // Create a node in the tree for this position if it doesn't exist
  let currentNode = this.moveTree.root;
  
  // If we have previous moves, navigate to the correct node
  if (this.currentGameMoves.length > 0) {
    for (const prevMove of this.currentGameMoves) {
      if (!currentNode.moves[prevMove]) {
        // Create the node if it doesn't exist
        currentNode.moves[prevMove] = {
          moves: {},
          stats: {
            timesVisited: 0,
            rating: 1200,
            firstSeen: Date.now()
          }
        };
      }
      
      // Move to the next node
      currentNode = currentNode.moves[prevMove];
    }
  }
  
  // Add learning metadata to the node
  if (!currentNode.learningData) {
    currentNode.learningData = [];
  }
  
  // Add the entry to the learning data
  currentNode.learningData.push({
    timestamp: Date.now(),
    evaluation: entry.evaluation,
    previousEval: entry.previousEval,
    strategy: entry.strategy,
    wasMistake: entry.wasMistake,
    severity: entry.severity
  });
  
  // Update node stats
  currentNode.stats.timesVisited++;
  
  // If this was a mistake, mark it for future reference
  if (entry.wasMistake) {
    currentNode.stats.mistakeCount = (currentNode.stats.mistakeCount || 0) + 1;
    currentNode.stats.lastMistake = Date.now();
    currentNode.stats.mistakeSeverity = entry.severity;
    
    // Store the strategy that led to the mistake
    if (!currentNode.stats.mistakesByStrategy) {
      currentNode.stats.mistakesByStrategy = {};
    }
    currentNode.stats.mistakesByStrategy[entry.strategy] = 
      (currentNode.stats.mistakesByStrategy[entry.strategy] || 0) + 1;
  }
  
  // Save the knowledge periodically
  if (Math.random() < 0.1) { // 10% chance to save on each learning entry
    this.saveToLocalStorage();
  }
}


  /**
   * Start the self-learning process
   */
  start() {
    if (this.isRunning && !this.isPaused) return;
    
    // If paused, resume
    if (this.isPaused) {
      this.isPaused = false;
      this.log('Learning resumed');
      this.gameInterval = setInterval(() => this.playNextMove(), this.options.gameDelay);
      document.getElementById('thinking-indicator')?.classList.remove('hidden');
      return;
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Reset the game if it's over
    if (window.chessGame.gameOver) {
      window.chessGame.setupBoard();
      this.currentGameMoves = [];
      this.currentPosition = 'start';
    }
    
    this.log('Starting comprehensive learning process with optimized structure...');
    
    // Show thinking indicator
    document.getElementById('thinking-indicator')?.classList.remove('hidden');
    
    // Start the game interval
    this.gameInterval = setInterval(() => this.playNextMove(), this.options.gameDelay);
    
    // Update UI
    this.updateUI();
    
    // Start auto-save
    this.startAutoSave();
  }
  
  /**
   * Play the next move in the self-learning process
   */
  playNextMove() {
    try {
      // Check if game is over
      if (window.chessGame.gameOver) {
        this.handleGameOver();
        return;
      }
      
      // Get current player and position
      const currentPlayer = window.chessGame.currentPlayer;
      const fenPosition = window.chessGame.getPositionFEN();
      
      // Track position visit
      this.trackPositionVisit(fenPosition);
      
      // Get best move based on exploration strategy
      const move = this.getExploratoryMove(this.currentGameMoves, currentPlayer);
      
      if (move) {
        // Record the move in our tree structure
        this.recordMoveInTree(this.currentGameMoves, move, currentPlayer);
        
        // Add to current game moves
        const moveNotation = this.getMoveNotation(move);
        this.currentGameMoves.push(moveNotation);
        
        // Execute the move
        const success = window.chessGame.executeAIMove(move);
        
        if (!success) {
          this.log(`Error: Failed to execute move ${moveNotation}`);
          return;
        }
        
        // Check for discoveries
        this.checkForDiscovery(fenPosition, move, currentPlayer);
        
        // Track unique moves
        this.stats.uniqueMoves.add(moveNotation);
        
        // Track unique positions
        this.stats.uniquePositions.add(fenPosition);
        
        this.moveCount++;
        
        // Log move if enabled
        if (this.options.logMoves) {
          this.log(`Move ${this.moveCount}: ${currentPlayer} plays ${moveNotation}`, true);
        }
      } else {
        // No valid move found, this shouldn't happen but handle it anyway
        this.log(`Error: No valid move found for ${currentPlayer}`);
        window.chessGame.gameOver = true;
      }
    } catch (error) {
      console.error("Error in playNextMove:", error);
      this.log(`Error during move: ${error.message}`);
    }
  }
  
  /**
   * Record a move in the tree structure
   */
  recordMoveInTree(previousMoves, move, player) {
    try {
      const moveNotation = this.getMoveNotation(move);
      
      // Navigate to the current position in the tree
      let currentNode = this.moveTree.root;
      
      // Follow the path of previous moves
      for (const prevMove of previousMoves) {
        if (!currentNode.moves[prevMove]) {
          // Create the node if it doesn't exist
          currentNode.moves[prevMove] = {
            moves: {},
            stats: {
              timesPlayed: 0,
              rating: 1200,
              wins: 0,
              losses: 0,
              draws: 0,
              player: player === 'white' ? 'black' : 'white', // Player who made the previous move
              lastPlayed: Date.now()
            }
          };
        }
        
        // Update stats for this move
        currentNode.moves[prevMove].stats.timesPlayed++;
        currentNode.moves[prevMove].stats.lastPlayed = Date.now();
        
        // Move to the next node
        currentNode = currentNode.moves[prevMove];
      }
      
      // Ensure the current node has a moves object
      if (!currentNode.moves) {
        currentNode.moves = {};
      }
      
      // Create or update the move in the current position
      if (!currentNode.moves[moveNotation]) {
        currentNode.moves[moveNotation] = {
          moves: {},
          stats: {
            timesPlayed: 0,
            rating: 1200,
            wins: 0,
            losses: 0,
            draws: 0,
            player: player,
            lastPlayed: Date.now()
          }
        };
      }
      
      // Update stats for this move
      currentNode.moves[moveNotation].stats.timesPlayed++;
      currentNode.moves[moveNotation].stats.lastPlayed = Date.now();
      
      // Update position stats
      currentNode.stats.timesVisited = (currentNode.stats.timesVisited || 0) + 1;
      
      return true;
    } catch (error) {
      console.error("Error recording move in tree:", error);
      return false;
    }
  }
  
  /**
   * Get a move based on exploration strategy
   */
  getExploratoryMove(previousMoves, player) {
    try {
      // Get all legal moves
      const legalMoves = window.chessGame.getAllPossibleMoves(player);
      if (!legalMoves || legalMoves.length === 0) {
        console.error("No legal moves found for", player);
        return null;
      }
      
      console.log(`Found ${legalMoves.length} legal moves for ${player}`);
      
      // If only one move is available, just return it
      if (legalMoves.length === 1) {
        return legalMoves[0];
      }
      
      // Decide whether to explore or exploit based on exploration rate
      const shouldExplore = Math.random() < this.explorationRate;
      
      if (shouldExplore) {
        // EXPLORE: Try moves we haven't tried much before
        return this.getNovelMove(previousMoves, legalMoves, player);
      } else {
        // EXPLOIT: Use the best move we know
        return this.getBestKnownMove(previousMoves, legalMoves, player);
      }
    } catch (error) {
      console.error("Error in getExploratoryMove:", error);
      // Return a random move as fallback
      const legalMoves = window.chessGame.getAllPossibleMoves(player);
      if (legalMoves && legalMoves.length > 0) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }
      return null;
    }
  }
  
  /**
   * Get a novel move (one we haven't tried much)
   */
  getNovelMove(previousMoves, legalMoves, player) {
    try {
      // Navigate to the current position in the tree
      let currentNode = this.moveTree.root;
      
      // Follow the path of previous moves
      for (const prevMove of previousMoves) {
        if (!currentNode.moves[prevMove]) {
          // If we haven't seen this position before, any move is novel
          return legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }
        currentNode = currentNode.moves[prevMove];
      }
      
      // Calculate novelty scores for each move
      const movesWithNovelty = legalMoves.map(move => {
        const moveNotation = this.getMoveNotation(move);
        const moveData = currentNode.moves[moveNotation];
        const timesPlayed = moveData?.stats?.timesPlayed || 0;
        
        // Higher score for less played moves
        const noveltyScore = this.noveltyBonus / (1 + timesPlayed);
        
        return {
          move,
          noveltyScore,
          timesPlayed
        };
      });
      
      // Sort by novelty (highest first)
      movesWithNovelty.sort((a, b) => b.noveltyScore - a.noveltyScore);
      
      // Prefer completely new moves
      const untriedMoves = movesWithNovelty.filter(m => m.timesPlayed === 0);
      if (untriedMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * untriedMoves.length);
        return untriedMoves[randomIndex].move;
      }
      
      // Otherwise pick the least played move
      return movesWithNovelty[0].move;
    } catch (error) {
      console.error("Error in getNovelMove:", error);
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
  }
  
  /**
   * Get the best known move (pure exploitation)
   */
  getBestKnownMove(previousMoves, legalMoves, player) {
    try {
      // Navigate to the current position in the tree
      let currentNode = this.moveTree.root;
      
      // Follow the path of previous moves
      for (const prevMove of previousMoves) {
        if (!currentNode.moves[prevMove]) {
          // If we haven't seen this position before, use evaluation
          return this.getBestEvaluatedMove(legalMoves, player);
        }
        currentNode = currentNode.moves[prevMove];
      }
      
      // Calculate strength scores for each move
      const movesWithScores = legalMoves.map(move => {
        const moveNotation = this.getMoveNotation(move);
        const moveData = currentNode.moves[moveNotation]?.stats;
        
        // If we have data on this move, use its rating
        let score = moveData?.rating || 1200;
        
        // Add evaluation component
        score += this.evaluateMove(move, player);
        
        return {
          move,
          score
        };
      });
      
      // Sort by score (highest first)
      movesWithScores.sort((a, b) => b.score - a.score);
      
      // Pick the best move with a small chance of picking 2nd best
      const randomFactor = Math.random();
      if (randomFactor < 0.05 && movesWithScores.length > 1) {
        // 5% chance to pick 2nd best
        return movesWithScores[1].move;
      } else {
        // 95% chance to pick the best
        return movesWithScores[0].move;
      }
    } catch (error) {
      console.error("Error in getBestKnownMove:", error);
      return this.getBestEvaluatedMove(legalMoves, player);
    }
  }
  
  /**
   * Get the best move based on simple evaluation
   */
  getBestEvaluatedMove(legalMoves, player) {
    try {
      // Evaluate each move
      const evaluatedMoves = legalMoves.map(move => ({
        move,
        score: this.evaluateMove(move, player)
      }));
      
      // Sort by evaluation (highest first)
      evaluatedMoves.sort((a, b) => b.score - a.score);
      
      // Return the best move
      return evaluatedMoves[0].move;
    } catch (error) {
      console.error("Error in getBestEvaluatedMove:", error);
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
  }
  
  /**
   * Evaluate a move
   */
  evaluateMove(move, player) {
    try {
      // Simple evaluation
      let score = 0;
      const piece = window.chessGame.board[move.from.row][move.from.col];
      if (!piece) return 0;
      
      // Bonus for captures
      const targetPiece = window.chessGame.board[move.to.row][move.to.col];
      if (targetPiece) {
        score += window.chessGame.pieceValues[targetPiece.type] || 0;
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
    } catch (error) {
      console.error("Error evaluating move:", error);
      return 0;
    }
  }
  
  /**
   * Handle game over
   */
  handleGameOver() {
    try {
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
      this.updateMoveRatings(this.currentGameMoves, winner);
      
      // Log result
      this.log(`Game ${this.gameCount} complete. Winner: ${winner || 'Draw'}`);
      
      // Save knowledge periodically
      if (this.gameCount % this.options.saveInterval === 0) {
        this.saveKnowledge();
        this.log(`Knowledge saved after ${this.gameCount} games`);
      }
      
      // Update learning depth based on game complexity
      this.updateLearningDepth();
      
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
      this.currentGameMoves = [];
      this.currentPosition = 'start';
      window.chessGame.setupBoard();
    } catch (error) {
      console.error("Error handling game over:", error);
      // Try to recover
      this.moveCount = 0;
      this.currentGameMoves = [];
      this.currentPosition = 'start';
      window.chessGame.setupBoard();
    }
  }
  
  /**
   * Update move ratings based on game result
   */
  updateMoveRatings(moves, winner) {
    try {
      const K = 32; // K-factor for rating adjustments
      
      // Navigate through the move tree
      let currentNode = this.moveTree.root;
      
      for (let i = 0; i < moves.length; i++) {
        const moveNotation = moves[i];
        const player = i % 2 === 0 ? 'white' : 'black';
        
        if (!currentNode.moves[moveNotation]) continue;
        
        const moveData = currentNode.moves[moveNotation].stats;
        
        // Update win/loss/draw count
        if (!winner) {
          moveData.draws = (moveData.draws || 0) + 1;
        } else if (player === winner) {
          moveData.wins = (moveData.wins || 0) + 1;
        } else {
          moveData.losses = (moveData.losses || 0) + 1;
        }
        
        // Update rating based on result
        const expectedScore = this.getExpectedScore(moveData.rating || 1200, 1200);
        let actualScore;
        
        if (!winner) {
          actualScore = 0.5; // Draw
        } else if (player === winner) {
          actualScore = 1.0; // Win
        } else {
          actualScore = 0.0; // Loss
        }
        
        // ELO rating adjustment
        moveData.rating = (moveData.rating || 1200) + K * (actualScore - expectedScore);
        
        // Move to next node
        currentNode = currentNode.moves[moveNotation];
      }
    } catch (error) {
      console.error("Error updating move ratings:", error);
    }
  }
  
  /**
   * Calculate expected score based on ELO ratings
   */
  getExpectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }
  
  /**
   * Convert a move to notation
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
    
    return {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol }
    };
  }
  
  /**
   * Track how many times we've visited a position
   */
  trackPositionVisit(position) {
    // In the optimized structure, we don't need to track positions separately
    // as they're implicitly tracked by the move sequence
    // But we'll keep track of unique positions for statistics
    this.stats.uniquePositions.add(position);
  }
  
  /**
   * Check for discoveries (interesting moves)
   */
  checkForDiscovery(position, move, player) {
    try {
      // Get evaluation before the move
      const beforeEval = window.chessGame.evaluatePosition();
      
      // Make temporary move
      const piece = window.chessGame.board[move.from.row][move.from.col];
      const targetPiece = window.chessGame.board[move.to.row][move.to.col];
      
      window.chessGame.board[move.to.row][move.to.col] = piece;
      window.chessGame.board[move.from.row][move.from.col] = null;
      
      // Get evaluation after the move
      const afterEval = window.chessGame.evaluatePosition();
      
      // Restore board
      window.chessGame.board[move.from.row][move.from.col] = piece;
      window.chessGame.board[move.to.row][move.to.col] = targetPiece;
      
      // Calculate evaluation change
      const evalChange = player === 'white' ? afterEval - beforeEval : beforeEval - afterEval;
      
      // Check if this is a significant discovery
      if (evalChange >= 200 || (targetPiece && targetPiece.type === 'q')) {
        // Record discovery
        const moveNotation = this.getMoveNotation(move);
        const discovery = {
          position,
          move: moveNotation,
          player,
          evalChange,
          gameNumber: this.gameCount,
          timestamp: Date.now(),
          type: targetPiece ? 'capture' : 'positional'
        };
        
        // Add to discoveries list
        this.stats.discoveries.push(discovery);
        
        // Log discovery
        this.log(`DISCOVERY: ${player} found a ${discovery.type} move with ${Math.round(evalChange)} evaluation change`);
        
        // Add to UI
        this.addDiscoveryToUI(player, evalChange, moveNotation, discovery.type);
      }
    } catch (error) {
      console.error("Error checking for discovery:", error);
    }
  }
  
  /**
   * Add a discovery to the UI
   */
  addDiscoveryToUI(player, evalChange, moveNotation, type) {
    try {
      const container = document.getElementById('breakthrough-list');
      if (!container) return;
      
      const item = document.createElement('div');
      item.className = 'breakthrough-item';
      
      item.innerHTML = `
        <h4>${player.toUpperCase()} ${type} <span class="breakthrough-level">Game ${this.gameCount}</span></h4>
        <p>Evaluation change: ${Math.round(evalChange)}</p>
        <p>Move: ${moveNotation}</p>
      `;
      
      // Add to container (at the beginning)
      if (container.firstChild) {
        container.insertBefore(item, container.firstChild);
      } else {
        container.appendChild(item);
      }
      
      // Limit list to 10 items
      while (container.children.length > 10) {
        container.removeChild(container.lastChild);
      }
    } catch (error) {
      console.error("Error adding discovery to UI:", error);
    }
  }
  
  /**
   * Update learning depth based on game complexity
   */
  updateLearningDepth() {
    try {
      // Calculate depth based on tree structure
      let maxDepth = 0;
      
      const calculateDepth = (node, currentDepth) => {
        if (currentDepth > maxDepth) {
          maxDepth = currentDepth;
        }
        
        for (const move in node.moves) {
          calculateDepth(node.moves[move], currentDepth + 1);
        }
      };
      
      calculateDepth(this.moveTree.root, 0);
      
      // Cap at 10
      this.learningDepth = Math.min(10, maxDepth);
    } catch (error) {
      console.error("Error updating learning depth:", error);
      this.learningDepth = 1;
    }
  }
  
  /**
   * Update exploration progress based on knowledge
   */
  updateExplorationProgress() {
    try {
      // Count total nodes in the tree
      let totalNodes = 0;
      let totalMoves = 0;
      
      const countNodes = (node) => {
        totalNodes++;
        
        for (const move in node.moves) {
          totalMoves++;
          countNodes(node.moves[move]);
        }
      };
      
      countNodes(this.moveTree.root);
      
      // Estimate progress based on nodes and moves
      // This is a rough estimate - adjust as needed
      const estimatedTotalNodes = 100000;
      const rawProgress = (totalNodes / estimatedTotalNodes) * 100;
      this.explorationProgress = Math.min(100, rawProgress);
      
      // Update exploration phase based on progress
      if (this.explorationProgress < 25) {
        this.explorationPhase = 'aggressive'; // Early exploration
      } else if (this.explorationProgress < 50) {
        this.explorationPhase = 'balanced';   // Mid exploration
      } else if (this.explorationProgress < 75) {
        this.explorationPhase = 'conservative'; // Late exploration
      } else {
        this.explorationPhase = 'mastery';    // Mastery phase
      }
      
      // Record milestone if we've crossed a threshold
      const milestones = [1, 5, 10, 25, 50, 75, 90, 95, 99, 100];
      for (const milestone of milestones) {
        if (this.explorationProgress >= milestone && 
            !this.stats.explorationMilestones.includes(milestone)) {
          this.stats.explorationMilestones.push(milestone);
          this.log(`MILESTONE: Reached ${milestone}% exploration of the chess space!`);
        }
      }
    } catch (error) {
      console.error("Error updating exploration progress:", error);
    }
  }
  
  /**
   * Save knowledge to a JSON file
   */
  saveKnowledge() {
    try {
      // Prepare the data to save
      const dataToSave = {
        version: '2.0', // New version for the optimized format
        timestamp: Date.now(),
        moveTree: this.moveTree,
        stats: {
          ...this.stats,
          uniqueMoves: Array.from(this.stats.uniqueMoves),
          uniquePositions: Array.from(this.stats.uniquePositions)
        },
        gameCount: this.gameCount,
        moveCount: this.moveCount,
        explorationRate: this.explorationRate,
        explorationPhase: this.explorationPhase,
        learningDepth: this.learningDepth,
        sessionState: this.sessionState
      };
      
      // Convert to JSON
      const jsonData = JSON.stringify(dataToSave);
      
      // Create a blob and download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chess_arn_knowledge_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.log(`Knowledge saved to JSON file with ${this.countMoves()} moves in tree`);
      return true;
    } catch (error) {
      this.log(`Error saving knowledge: ${error.message}`);
      console.error(error);
      return false;
    }
  }
  
  /**
   * Count total moves in the tree
   */
  countMoves() {
    let count = 0;
    
    const countMovesInNode = (node) => {
      for (const move in node.moves) {
        count++;
        countMovesInNode(node.moves[move]);
      }
    };
    
    countMovesInNode(this.moveTree.root);
    return count;
  }
  
    /**
   * Load knowledge from a JSON file (continued)
   */
  loadKnowledgeFromFile(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            
            // Check if this is the new optimized format
            if (data.version === '2.0' && data.moveTree) {
              // Load the move tree
              this.moveTree = data.moveTree;
              
              // Load statistics
              if (data.stats) {
                this.stats = {
                  ...data.stats,
                  uniqueMoves: new Set(data.stats.uniqueMoves || []),
                  uniquePositions: new Set(data.stats.uniquePositions || [])
                };
              }
              
              // Load game count
              if (data.gameCount !== undefined) {
                this.gameCount = data.gameCount;
              }
              
              // Load move count
              if (data.moveCount !== undefined) {
                this.moveCount = data.moveCount;
              }
              
              // Load exploration rate
              if (data.explorationRate !== undefined) {
                this.explorationRate = data.explorationRate;
              }
              
              // Load exploration phase
              if (data.explorationPhase) {
                this.explorationPhase = data.explorationPhase;
              }
              
              // Load learning depth
              if (data.learningDepth !== undefined) {
                this.learningDepth = data.learningDepth;
              }
              
              // Load session state
              if (data.sessionState) {
                this.sessionState = data.sessionState;
              }
              
              this.log(`Loaded optimized knowledge from file: ${this.countMoves()} moves in tree`);
              
              // Update UI
              this.updateUI();
              
              resolve(true);
            } 
            // Check if this is the old format that needs conversion
            else if (data.moveDatabase || data.positionDatabase) {
              this.log("Converting old format to optimized structure...");
              
              // Convert old format to new format
              this.convertOldFormat(data);
              
              this.log(`Converted and loaded knowledge: ${this.countMoves()} moves in tree`);
              
              // Update UI
              this.updateUI();
              
              resolve(true);
            }
            else {
              this.log('Error: Invalid knowledge file format');
              resolve(false);
            }
          } catch (error) {
            this.log(`Error parsing knowledge file: ${error.message}`);
            console.error(error);
            resolve(false);
          }
        };
        
        reader.onerror = () => {
          this.log('Error reading knowledge file');
          resolve(false);
        };
        
        reader.readAsText(file);
      } catch (error) {
        this.log(`Error loading knowledge: ${error.message}`);
        console.error(error);
        resolve(false);
      }
    });
  }
  
  /**
   * Convert old format data to the new optimized structure
   */
  convertOldFormat(data) {
    try {
      // Initialize the move tree
      this.moveTree = {
        root: {
          moves: {},
          stats: {
            timesVisited: 0,
            firstSeen: Date.now()
          }
        }
      };
      
      // Load statistics
      if (data.stats) {
        this.stats = {
          whiteWins: data.stats.whiteWins || 0,
          blackWins: data.stats.blackWins || 0,
          draws: data.stats.draws || 0,
          discoveries: data.stats.discoveries || [],
          uniqueMoves: new Set(data.stats.uniqueMoves || []),
          uniquePositions: new Set(data.stats.uniquePositions || []),
          explorationMilestones: data.stats.explorationMilestones || []
        };
      }
      
      // Load game count
      if (data.gameCount !== undefined) {
        this.gameCount = data.gameCount;
      }
      
      // Convert move database to move tree
      if (data.moveDatabase) {
        // Group moves by position
        const positionMoves = {};
        
        for (const moveKey in data.moveDatabase) {
          const [position, moveNotation] = moveKey.split('|');
          
          if (!positionMoves[position]) {
            positionMoves[position] = [];
          }
          
          positionMoves[position].push({
            moveNotation,
            data: data.moveDatabase[moveKey]
          });
        }
        
        // Build the move tree
        for (const position in positionMoves) {
          // Try to reconstruct the move sequence that led to this position
          const moveSequence = this.reconstructMoveSequence(position, data);
          
          // Add each move to the tree
          for (const moveData of positionMoves[position]) {
            this.addMoveToTree(moveSequence, moveData.moveNotation, moveData.data);
          }
        }
      }
      
      // Update exploration progress
      this.updateExplorationProgress();
      
      return true;
    } catch (error) {
      console.error("Error converting old format:", error);
      return false;
    }
  }
  
  /**
   * Reconstruct the move sequence that led to a position
   * This is a simplified approach - in a real implementation, you'd need
   * a more sophisticated algorithm to reconstruct the exact move sequence
   */
  reconstructMoveSequence(position, data) {
    // For simplicity, we'll just return an empty array
    // In a real implementation, you'd use the position database and move history
    // to reconstruct the sequence of moves that led to this position
    return [];
  }
  
  /**
   * Add a move to the tree structure
   */
  addMoveToTree(moveSequence, moveNotation, moveData) {
    try {
      // Navigate to the current position in the tree
      let currentNode = this.moveTree.root;
      
      // Follow the path of previous moves
      for (const prevMove of moveSequence) {
        if (!currentNode.moves[prevMove]) {
          // Create the node if it doesn't exist
          currentNode.moves[prevMove] = {
            moves: {},
            stats: {
              timesPlayed: 0,
              rating: 1200,
              wins: 0,
              losses: 0,
              draws: 0,
              player: 'unknown', // We don't know the player in this case
              lastPlayed: Date.now()
            }
          };
        }
        
        // Move to the next node
        currentNode = currentNode.moves[prevMove];
      }
      
      // Ensure the current node has a moves object
      if (!currentNode.moves) {
        currentNode.moves = {};
      }
      
      // Create or update the move in the current position
      if (!currentNode.moves[moveNotation]) {
        currentNode.moves[moveNotation] = {
          moves: {},
          stats: {
            timesPlayed: moveData.timesPlayed || 0,
            rating: moveData.rating || 1200,
            wins: moveData.wins || 0,
            losses: moveData.losses || 0,
            draws: moveData.draws || 0,
            player: moveData.player || 'unknown',
            lastPlayed: moveData.lastPlayed || Date.now()
          }
        };
      } else {
        // Update existing move stats
        const stats = currentNode.moves[moveNotation].stats;
        stats.timesPlayed = (stats.timesPlayed || 0) + (moveData.timesPlayed || 0);
        stats.rating = moveData.rating || stats.rating || 1200;
        stats.wins = (stats.wins || 0) + (moveData.wins || 0);
        stats.losses = (stats.losses || 0) + (moveData.losses || 0);
        stats.draws = (stats.draws || 0) + (moveData.draws || 0);
        stats.player = moveData.player || stats.player || 'unknown';
        stats.lastPlayed = Math.max(stats.lastPlayed || 0, moveData.lastPlayed || 0);
      }
      
      return true;
    } catch (error) {
      console.error("Error adding move to tree:", error);
      return false;
    }
  }
  
  /**
   * Show file picker to load knowledge
   */
  showLoadKnowledgeDialog() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Handle file selection
    fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        // Stop any current learning
        if (this.isRunning) {
          this.stop();
        }
        
        // Load the file
        const success = await this.loadKnowledgeFromFile(file);
        
        if (success) {
          // Ask if the user wants to resume
          if (confirm('Knowledge loaded successfully. Do you want to resume learning?')) {
            this.resumeSession();
          }
        }
      }
      document.body.removeChild(fileInput);
    });
    
    // Trigger file selection dialog
    fileInput.click();
  }
  
  /**
   * Save the current session state
   */
  saveSession() {
    try {
      // Update the session state with current information
      this.sessionState = this.sessionState || {};
      this.sessionState.currentPosition = window.chessGame.getPositionFEN();
      this.sessionState.currentGameNumber = this.gameCount || 0;
      this.sessionState.currentMoveNumber = this.moveCount || 0;
      this.sessionState.lastSaveTime = Date.now();
      this.sessionState.currentGameMoves = this.currentGameMoves;
      
      // Save the entire knowledge base including the session
      this.saveKnowledge();
      
      this.log(`Session saved at game ${this.gameCount}, move ${this.moveCount}`);
      
      return true;
    } catch (error) {
      this.log(`Error saving session: ${error.message}`);
      console.error(error);
      return false;
    }
  }
  
  /**
   * Resume learning from the last saved session
   */
  resumeSession() {
    if (!this.sessionState || !this.sessionState.currentPosition) {
      this.log('No session to resume');
      return false;
    }
    
    // Stop any current learning
    if (this.isRunning) {
      this.stop();
    }
    
    // Set up the game state from the saved session
    this.gameCount = this.sessionState.currentGameNumber || 0;
    this.moveCount = this.sessionState.currentMoveNumber || 0;
    this.currentGameMoves = this.sessionState.currentGameMoves || [];
    
    // Try to restore the board position
    try {
      this.restoreBoardPosition();
      this.log(`Resumed from game ${this.gameCount}, move ${this.moveCount}`);
      
      // Start learning from this position
      this.start();
      
      return true;
    } catch (error) {
      this.log(`Error resuming session: ${error.message}`);
      console.error(error);
      
      // If we can't restore the exact position, start a new game
      window.chessGame.setupBoard();
      this.currentGameMoves = [];
      this.log('Could not restore exact position. Starting a new game.');
      this.start();
      
      return false;
    }
  }
  
  /**
   * Restore the chess board to the saved position
   */
  restoreBoardPosition() {
    // Set up a new board
    window.chessGame.setupBoard();
    
    // If we have current game moves, replay them
    if (this.currentGameMoves && this.currentGameMoves.length > 0) {
      this.log(`Attempting to restore position by replaying ${this.currentGameMoves.length} moves`);
      
      // Replay the moves to get to the saved position
      for (const moveNotation of this.currentGameMoves) {
        const move = this.parseNotation(moveNotation);
        if (move) {
          window.chessGame.executeMove(move);
        } else {
          this.log(`Failed to parse move: ${moveNotation}`);
          break;
        }
      }
    }
    
    // Verify we reached the correct position
    const currentFen = window.chessGame.getPositionFEN();
    if (currentFen !== this.sessionState.currentPosition) {
      this.log('Warning: Could not exactly restore the saved position');
      console.warn('Target FEN:', this.sessionState.currentPosition);
      console.warn('Current FEN:', currentFen);
    }
    
    return currentFen === this.sessionState.currentPosition;
  }
  
  /**
   * Start auto-save
   */
  startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      // Only save if we've made progress
      if (this.moveCount > 0) {
        this.saveSession();
      }
    }, this.autoSaveInterval || 300000); // Default: save every 5 minutes
    
    this.log(`Auto-save enabled (every ${(this.autoSaveInterval || 300000) / 60000} minutes)`);
  }
  
  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      this.log('Auto-save disabled');
    }
  }
  
  /**
   * Stop the self-learning process
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.isPaused = false;
    
    // Clear the interval
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    
    // Hide thinking indicator
    document.getElementById('thinking-indicator')?.classList.add('hidden');
    
    // Calculate duration
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    this.log(`Self-learning stopped after ${duration} seconds`);
    this.log(`Learned ${this.countMoves()} moves in tree, explored ${this.stats.uniquePositions.size} positions`);
    
    // Save knowledge
    this.saveSession();
    
    // Stop auto-save
    this.stopAutoSave();
    
    // Update UI
    this.updateUI();
  }
  
  /**
   * Pause the self-learning process
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;
    
    this.isPaused = true;
    
    // Clear the interval
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    
    // Hide thinking indicator
    document.getElementById('thinking-indicator')?.classList.add('hidden');
    
    this.log('Learning paused');
  }
  
  /**
   * Make a single move (for debugging)
   */
  makeSingleMove() {
    this.playNextMove();
  }
  
  /**
   * Set the exploration rate
   */
  setExplorationRate(rate) {
    this.explorationRate = Math.max(0, Math.min(1, rate));
    
    // Update UI with meaningful description
    let description;
    if (rate === 0) {
      description = "Shoot to Kill (No Exploration)";
    } else if (rate < 0.2) {
      description = "Tournament Mode (Minimal Exploration)";
    } else if (rate < 0.4) {
      description = "Competitive (Low Exploration)";
    } else if (rate < 0.6) {
      description = "Balanced Learning";
    } else if (rate < 0.8) {
      description = "Curious Explorer";
    } else if (rate < 1) {
      description = "Wild Experimenter";
    } else {
      description = "Total Exploration (Will Eventually Quit)";
    }
    
    const explorationValueElement = document.getElementById('exploration-value');
    if (explorationValueElement) {
      explorationValueElement.textContent = `${Math.round(this.explorationRate * 100)}% - ${description}`;
    }
    
    this.updateUI();
  }
  
  /**
   * Calculate position coverage percentage
   */
  calculatePositionCoverage() {
    // Estimate total possible positions in early/mid game
    const estimatedTotalPositions = 10000; // This is just a rough estimate
    const exploredPositions = this.stats.uniquePositions ? this.stats.uniquePositions.size : 0;
    
    return Math.min(100, Math.round((exploredPositions / estimatedTotalPositions) * 100));
  }
  
  /**
   * Format time since last save in a human-readable format
   */
  formatTimeSince(timestamp) {
    if (!timestamp) return 'N/A';
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    if (seconds < 2) return `now`;
    if (seconds < 60) return `${seconds} seconds`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 2) return `1 minute`;
    if (minutes < 60) return `${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 2) return `1 hour`;
    if (hours < 24) return `${hours} hours`;
    
    const days = Math.floor(hours / 24);
    if (days < 2) return `1 day`;
    return `${days} days`;
  }
  
  /**
   * Update the UI with current state
   */
  updateUI() {
    try {
      // Helper to safely update element text
      const updateText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };

      // Update main stats
      updateText('arn-games-played', this.gameCount || 0);
      updateText('arn-positions-learned', this.stats.uniquePositions ? this.stats.uniquePositions.size : 0);
      updateText('arn-moves-in-tree', this.countMoves());

      // Update Learning Depth progress bar
      const depthPercent = (this.learningDepth || 0) * 10;
      const depthBar = document.getElementById('arn-learning-depth-bar');
      if (depthBar) depthBar.style.width = `${depthPercent}%`;
      updateText('arn-learning-depth-value', `${this.learningDepth || 0}/10`);

      // Update Exploration Rate progress bar
      const explorationPercent = (this.explorationRate || 0) * 100;
      const explorationBar = document.getElementById('arn-exploration-bar');
      if (explorationBar) explorationBar.style.width = `${explorationPercent}%`;
      updateText('arn-exploration-value', `${Math.round(explorationPercent)}% (${this.explorationPhase})`);

      // Update session info
      if (this.sessionState && this.sessionState.lastSaveTime) {
        updateText('arn-last-save', `${this.formatTimeSince(this.sessionState.lastSaveTime)} ago`);
      } else {
        updateText('arn-last-save', 'Never');
      }

    } catch (error) {
      console.error("Error updating ARN UI:", error);
    }
  }
  /**
   * Helper method to safely update an element's text content
   */
  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }
  
  /**
   * Add a log entry
   */
  log(message, debug = false) {
    const fullMessage = `[OptimizedChessARN] ${message}`;
    console.log(fullMessage);
    
    // Don't add debug messages to the UI log
    if (debug) return;
    
    const logContainer = document.getElementById('arn-log-container');
    if (!logContainer) return;
    
    const now = new Date();
    const timestamp = now.toTimeString().substring(0, 8);
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
    
    // Add to the top of the log
    logContainer.insertBefore(entry, logContainer.firstChild);
    
    // Limit log entries to prevent performance issues
    while (logContainer.children.length > 100) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }
  
  /**
   * Load knowledge from localStorage (for backward compatibility)
   */
  loadKnowledge() {
    try {
      // Check if we have a saved file path
      const savedFilePath = localStorage.getItem('chess_arn_knowledge_path');
      if (savedFilePath) {
        this.log(`Found saved knowledge path: ${savedFilePath}`);
        // In a real implementation, you would try to load this file
        // But in a browser context, we can't directly access the file system
      }
      
      // For backward compatibility, check if there's data in localStorage
      const savedMoveTree = localStorage.getItem('chess_arn_move_tree');
      if (savedMoveTree) {
        this.log("Found old format data in localStorage, converting...");
        
        // Parse the old data
        const oldData = {
          moveTree: JSON.parse(savedMoveTree)
        };
        
        // Load stats
        const savedStats = localStorage.getItem('chess_arn_stats');
        if (savedStats) {
          oldData.stats = JSON.parse(savedStats);
        }
        
        // Convert to new format
        this.convertOldFormat(oldData);
        
        this.log(`Converted localStorage data to optimized structure with ${this.countMoves()} moves`);
      }
    } catch (error) {
      this.log(`Error loading knowledge: ${error.message}`);
      console.error(error);
    }
  }
  
  /**
   * Export the move tree as a visualization
   */
  exportTreeVisualization() {
    try {
      // Create a simplified tree for visualization
      const visualTree = this.createVisualTree(this.moveTree.root, 3); // Limit depth to 3 for visualization
      
      // Convert to JSON
      const jsonData = JSON.stringify(visualTree, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chess_tree_visualization_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.log(`Tree visualization exported`);
      return true;
    } catch (error) {
      this.log(`Error exporting tree visualization: ${error.message}`);
      console.error(error);
      return false;
    }
  }
  
  /**
   * Create a simplified tree for visualization
   */
  createVisualTree(node, maxDepth, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      return { name: "...", children: [] };
    }
    
    const result = {
      name: currentDepth === 0 ? "Start" : "Position",
      stats: {
        timesVisited: node.stats?.timesVisited || 0
      },
      children: []
    };
    
    for (const move in node.moves) {
      const childNode = node.moves[move];
      const childStats = childNode.stats || {};
      
      result.children.push({
        name: move,
        stats: {
          rating: Math.round(childStats.rating || 1200),
          timesPlayed: childStats.timesPlayed || 0,
          wins: childStats.wins || 0,
          losses: childStats.losses || 0,
          draws: childStats.draws || 0
        },
        children: Object.keys(childNode.moves || {}).length > 0 ? 
          [this.createVisualTree(childNode, maxDepth, currentDepth + 1)] : []
      });
    }
    
    return result;
  }
}
