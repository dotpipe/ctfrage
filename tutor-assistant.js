/**
 * Chess Advice Box with Automatic Dialog Flow
 * A chess tutor that responds to your moves and guides you through the game
 */
class ChessAdviceBox {
  constructor(chessGame) {
    this.chessGame = chessGame;
    this.isOpen = false;
    this.dialogState = 'initial'; // Track the current dialog state
    this.moveCount = 0; // Track number of moves made
    this.lastAnalyzedPosition = null; // Track last analyzed position
    this.playerSkillLevel = 'intermediate'; // Default skill level assumption
    this.commonMistakes = []; // Track player's common mistakes
    this.tutorPersonality = this.selectTutorPersonality();

    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.container = document.getElementById('chess-advice-box');
    this.tutorButton = document.getElementById('chess-tutor-btn');
    this.closeButton = this.container.querySelector('.close-btn');
    this.messageElement = document.getElementById('advice-message');
    this.optionsContainer = document.getElementById('advice-options');
    this.newAdviceButton = document.getElementById('new-advice-btn');
  }

  integrateWithChessEngine() {
    // Check if a chess engine is available
    if (window.chessEngine) {
      // Override the findTopMoves method to use the engine
      this.findTopMoves = (count) => {
        return new Promise((resolve) => {
          // Get the current position in FEN notation
          const fen = this.chessGame.getCurrentFEN ? this.chessGame.getCurrentFEN() : null;

          if (!fen) {
            resolve(this.generateAlternativeMoves(count));
            return;
          }

          // Ask the engine for the top moves
          window.chessEngine.analyze(fen, {
            depth: 15,
            multipv: count,
            onComplete: (result) => {
              if (result && result.moves && result.moves.length > 0) {
                // Format the moves
                const formattedMoves = result.moves.map(engineMove => ({
                  move: this.convertEngineMove(engineMove.move),
                  evaluation: engineMove.score / 100, // Convert centipawns to pawns
                  explanation: this.generateExplanationFromEngine(engineMove)
                }));

                resolve(formattedMoves);
              } else {
                resolve(this.generateAlternativeMoves(count));
              }
            }
          });
        });
      };
    }
  }

  convertEngineMove(engineMove) {
    // Convert engine move format to our internal format
    // This would depend on the specific engine's output format

    // Example for UCI format (e.g., "e2e4")
    return {
      notation: engineMove
    };
  }

  generateExplanationFromEngine(engineMove) {
    // Generate a human-readable explanation from engine data

    let explanation = "";

    // Add evaluation
    if (engineMove.score > 100) {
      explanation = "An excellent move giving a significant advantage.";
    } else if (engineMove.score > 50) {
      explanation = "A strong move giving a clear advantage.";
    } else if (engineMove.score > 20) {
      explanation = "A good move giving a slight advantage.";
    } else if (engineMove.score > -20) {
      explanation = "A solid move maintaining the balance.";
    } else {
      explanation = "The best move in a difficult position.";
    }

    return explanation;
  }

  setupEventListeners() {
    // Tutor button
    this.tutorButton.addEventListener('click', () => this.openAdviceBox());

    // Close button
    this.closeButton.addEventListener('click', () => this.closeAdviceBox());

    // New advice button
    this.newAdviceButton.addEventListener('click', () => this.generateOptions());

    // Listen for number key presses (1-9)
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        this.selectOption(num - 1);
      }

      // Escape key to close
      if (e.key === 'Escape') {
        this.closeAdviceBox();
      }
    });

    // Listen for game events
    document.addEventListener('chess-move-made', (e) => {
      this.onMoveMade(e.detail);
    });

    document.addEventListener('checkmate', () => this.onCheckmate());
    document.addEventListener('stalemate', () => this.onStalemate());
    document.addEventListener('check', () => this.onCheck());
    document.addEventListener('game-start', () => this.onGameStart());

    // Alt+T to toggle advice box
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 't') {
        if (this.isOpen) {
          this.closeAdviceBox();
        } else {
          this.openAdviceBox();
        }
      }
    });
  }

  selectTutorPersonality() {
    // Different tutor personalities for variety
    const personalities = [
      {
        name: 'Coach',
        style: 'encouraging',
        phrases: [
          "Good move! Let's build on that.",
          "I see what you're doing there. Nice strategy!",
          "That's a solid approach. Keep it up!",
          "You're making progress. Let's think about the next step."
        ]
      },
      {
        name: 'Analyst',
        style: 'technical',
        phrases: [
          "That move gives you a +0.3 advantage according to my evaluation.",
          "Interesting choice. The position is now more complex.",
          "This creates an imbalance in the pawn structure.",
          "Your piece coordination has improved with this move."
        ]
      },
      {
        name: 'Grandmaster',
        style: 'strategic',
        phrases: [
          "This move aligns with your long-term strategic goals.",
          "Now you should focus on exploiting the weakness on e5.",
          "Consider your pawn structure before proceeding.",
          "Your position has clear attacking prospects now."
        ]
      }
    ];

    // Randomly select a personality
    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  openAdviceBox() {
    this.container.classList.remove('hidden');
    this.tutorButton.classList.add('hidden');
    this.isOpen = true;

    // Show appropriate dialog based on current state
    this.continueDialog();
  }

  closeAdviceBox() {
    this.container.classList.add('hidden');
    this.tutorButton.classList.remove('hidden');
    this.isOpen = false;
  }

  continueDialog() {
    // Continue the dialog based on the current state
    switch (this.dialogState) {
      case 'initial':
        this.showWelcomeMessage();
        break;
      case 'opening':
        this.showOpeningAdvice();
        break;
      case 'middlegame':
        this.showMiddlegameAdvice();
        break;
      case 'endgame':
        this.showEndgameAdvice();
        break;
      case 'after_mistake':
        this.showMistakeAdvice();
        break;
      case 'after_good_move':
        this.showPositiveReinforcement();
        break;
      case 'tactical_opportunity':
        this.showTacticalOpportunity();
        break;
      case 'game_over':
        this.showGameSummary();
        break;
      default:
        this.generateOptions();
    }
  }

  onMoveMade(moveDetails) {
    this.moveCount++;

    // Determine the current phase of the game
    const gamePhase = this.determineGamePhase();

    // Update dialog state based on game phase
    this.dialogState = gamePhase;

    // Check if the move was good or a mistake
    const moveQuality = this.evaluateMoveQuality(moveDetails);

    if (moveQuality === 'mistake') {
      this.dialogState = 'after_mistake';
      this.commonMistakes.push(moveDetails);

      // If the advice box is open, suggest better moves
      if (this.isOpen) {
        this.suggestBetterMoves();
        return;
      }
    } else if (moveQuality === 'good') {
      this.dialogState = 'after_good_move';
    }

    // Check for tactical opportunities
    if (this.detectTacticalOpportunity()) {
      this.dialogState = 'tactical_opportunity';
    }

    // If the advice box is open, update the dialog
    if (this.isOpen) {
      this.continueDialog();
    } else {
      // If it's closed, maybe notify the user about important events
      if (this.dialogState === 'tactical_opportunity' || this.dialogState === 'after_mistake') {
        this.notifyUser(this.getNotificationMessage());
      }
    }
  }

  suggestBetterMoves() {
    this.messageElement.textContent = "That move might not be optimal. Here are better alternatives:";

    setTimeout(() => {
      // Get the top 5 moves
      const topMoves = this.findTopMoves(5);

      if (topMoves && topMoves.length > 0) {
        // Show options for each move
        this.showResultWithOptions("Better moves in this position:", topMoves.map((moveData, index) => ({
          name: `${index + 1}. ${this.formatMoveForDisplay(moveData.move)}`,
          action: () => this.makeMove(this.formatMoveToString(moveData.move)),
          description: moveData.explanation
        })));
      } else {
        this.showResult("I couldn't calculate specific better moves in this position. Try looking for pieces that are under attack, opportunities to develop your pieces, or ways to improve your pawn structure.");
      }
    }, 1000);
  }


  onCheckmate() {
    this.dialogState = 'game_over';
    if (this.isOpen) {
      this.showGameSummary();
    } else {
      this.notifyUser("Checkmate! The game is over. Click for analysis.");
    }
  }

  onStalemate() {
    this.dialogState = 'game_over';
    if (this.isOpen) {
      this.showGameSummary();
    } else {
      this.notifyUser("Stalemate! The game is a draw. Click for analysis.");
    }
  }

  onCheck() {
    if (this.isOpen) {
      this.messageElement.textContent = "Check! Your king is under attack. You need to address this threat.";
      this.showDefenseOptions();
    } else {
      this.notifyUser("Check! Your king is under attack.");
    }
  }

  onGameStart() {
    this.moveCount = 0;
    this.dialogState = 'initial';
    this.commonMistakes = [];
    this.lastAnalyzedPosition = null;

    if (this.isOpen) {
      this.showWelcomeMessage();
    } else {
      this.notifyUser("A new game has started! Need opening advice?");
    }
  }

  determineGamePhase() {
    // Simple heuristic to determine game phase
    let pieceCount = 0;
    let majorPieces = 0;

    if (this.chessGame.board) {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.chessGame.board[row][col];
          if (piece) {
            pieceCount++;
            if (piece.type === 'queen' || piece.type === 'rook') {
              majorPieces++;
            }
          }
        }
      }
    }

    // Check move count and piece count
    if (this.moveCount < 10) {
      return 'opening';
    } else if (pieceCount < 12 || majorPieces <= 2) {
      return 'endgame';
    } else {
      return 'middlegame';
    }
  }

  evaluateMoveQuality(moveDetails) {
    // In a real implementation, you would analyze the move quality
    // Here we're using a simplified approach

    // Get evaluation before and after the move
    let currentEvaluation = 0;
    try {
      if (this.chessGame.evaluatePosition) {
        currentEvaluation = this.chessGame.evaluatePosition();
      }
    } catch (e) {
      console.error("Error evaluating position:", e);
    }

    // If we have a previous evaluation, compare
    if (this.lastAnalyzedPosition !== null) {
      const evaluationDifference = currentEvaluation - this.lastAnalyzedPosition;

      // Store current evaluation for next comparison
      this.lastAnalyzedPosition = currentEvaluation;

      // Determine if the move was good or a mistake
      // Negative difference means the position got worse for the current player
      if (evaluationDifference < -50) {
        return 'mistake';
      } else if (evaluationDifference > 30) {
        return 'good';
      }
    } else {
      // First move, just store the evaluation
      this.lastAnalyzedPosition = currentEvaluation;
    }

    // Default: neutral move
    return 'neutral';
  }

  detectTacticalOpportunity() {
    // In a real implementation, you would analyze the position for tactics
    // Here we're using a simplified approach with random detection

    // Randomly detect a tactic (about 15% of the time)
    return Math.random() < 0.15;
  }

  getNotificationMessage() {
    if (this.dialogState === 'tactical_opportunity') {
      return "I see a tactical opportunity! Click for details.";
    } else if (this.dialogState === 'after_mistake') {
      return "That move might not be optimal. Click for advice.";
    }
    return "Click for chess advice";
  }

  showWelcomeMessage() {
    const welcomeMessages = [
      `Welcome to your chess game! I'm your ${this.tutorPersonality.name}-style chess tutor. What would you like help with?`,
      `Hello! Ready for some chess? I'll be your ${this.tutorPersonality.name} today. How can I assist you?`,
      `Welcome back to the board! I'm here to provide ${this.tutorPersonality.style} advice for your game.`
    ];

    const welcomeMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

    this.messageElement.textContent = welcomeMessage;

    // Show initial options
    this.showInitialOptions();
  }

  showInitialOptions() {
    this.optionsContainer.innerHTML = '';

    const initialOptions = [
      {
        name: "Opening Advice",
        action: () => this.showOpeningAdvice(),
        description: "Get advice on how to start your game"
      },
      {
        name: "Analyze Position",
        action: () => this.analyzePosition(),
        description: "Evaluate the current board position"
      },
      {
        name: "Suggest Move",
        action: () => this.suggestMove(),
        description: "Get a recommendation for your next move"
      },
      {
        name: "Chess Principles",
        action: () => this.explainChessPrinciples(),
        description: "Learn fundamental chess concepts"
      },
      {
        name: "Set Your Level",
        action: () => this.showSkillLevelOptions(),
        description: "Adjust advice to match your experience"
      }
    ];

    // Create option elements
    initialOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  showOpeningAdvice() {
    this.messageElement.textContent = "Let's talk about your opening...";

    setTimeout(() => {
      // Try to identify the opening
      let openingName = null;
      try {
        if (this.chessGame.identifyCurrentOpening) {
          openingName = this.chessGame.identifyCurrentOpening();
        }
      } catch (e) {
        console.error("Error identifying opening:", e);
      }

      let openingAdvice = "";

      if (openingName) {
        openingAdvice = `You're playing the ${openingName}.\n\n`;

        // Add specific advice based on the opening
        if (openingName.includes("Ruy Lopez") || openingName.includes("Italian Game")) {
          openingAdvice += "This is a classic opening that focuses on controlling the center and developing pieces harmoniously. Your next steps should be:\n\n";
          openingAdvice += "1. Complete your development\n";
          openingAdvice += "2. Castle to ensure king safety\n";
          openingAdvice += "3. Connect your rooks";
        } else if (openingName.includes("Sicilian")) {
          openingAdvice += "The Sicilian is an aggressive counter-attacking opening. Your priorities should be:\n\n";
          openingAdvice += "1. Control the center with your pawns\n";
          openingAdvice += "2. Develop your pieces actively\n";
          openingAdvice += "3. Watch for tactical opportunities";
        } else {
          openingAdvice += "Focus on these opening principles:\n\n";
          openingAdvice += "1. Control the center\n";
          openingAdvice += "2. Develop your pieces\n";
          openingAdvice += "3. Castle early for king safety";
        }
      } else {
        openingAdvice = "I don't recognize a specific named opening, but here are the key principles to follow:\n\n";
        openingAdvice += "1. Control the center with pawns and pieces\n";
        openingAdvice += "2. Develop your knights and bishops toward the center\n";
        openingAdvice += "3. Castle early to protect your king\n";
        openingAdvice += "4. Connect your rooks\n";
        openingAdvice += "5. Don't move the same piece multiple times in the opening";
      }

      this.messageElement.textContent = openingAdvice;

      // Show next step options
      this.showOpeningNextStepOptions();
    }, 800);
  }

  showOpeningNextStepOptions() {
    this.optionsContainer.innerHTML = '';

    const nextStepOptions = [
      {
        name: "Suggest Next Move",
        action: () => this.suggestMove(),
        description: "Get a specific move recommendation"
      },
      {
        name: "Show Development Plan",
        action: () => this.showDevelopmentPlan(),
        description: "See a plan for developing your pieces"
      },
      {
        name: "Common Opening Traps",
        action: () => this.showOpeningTraps(),
        description: "Learn about traps to avoid in this opening"
      },
      {
        name: "Main Menu",
        action: () => this.showInitialOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    nextStepOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  showMiddlegameAdvice() {
    this.messageElement.textContent = "Analyzing the middlegame position...";

    setTimeout(() => {
      // Get evaluation if available
      let evaluation = 0;
      try {
        evaluation = this.chessGame.evaluatePosition ?
          this.chessGame.evaluatePosition() : 0;
      } catch (e) {
        console.error("Error evaluating position:", e);
      }

      // Format evaluation
      const formattedEval = evaluation > 0 ?
        `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);

      // Determine advantage
      let advantageText = "The position looks equal.";
      if (evaluation > 100) {
        advantageText = "You have a significant advantage.";
      } else if (evaluation > 50) {
        advantageText = "You have a slight advantage.";
      } else if (evaluation < -100) {
        advantageText = "Your opponent has a significant advantage.";
      } else if (evaluation < -50) {
        advantageText = "Your opponent has a slight advantage.";
      }

      let middlegameAdvice = `Middlegame Analysis (Evaluation: ${formattedEval}):\n\n`;
      middlegameAdvice += `${advantageText}\n\n`;

      // Add specific middlegame advice
      if (evaluation > 0) {
        middlegameAdvice += "With your advantage, you should:\n";
        middlegameAdvice += "1. Look for tactical opportunities\n";
        middlegameAdvice += "2. Simplify if you're ahead in material\n";
        middlegameAdvice += "3. Increase pressure on weak points";
      } else if (evaluation < 0) {
        middlegameAdvice += "When at a disadvantage, you should:\n";
        middlegameAdvice += "1. Create complications to confuse your opponent\n";
        middlegameAdvice += "2. Look for tactical resources\n";
        middlegameAdvice += "3. Strengthen your defensive position";
      } else {
        middlegameAdvice += "In this balanced position, focus on:\n";
        middlegameAdvice += "1. Improving your piece placement\n";
        middlegameAdvice += "2. Creating a long-term plan\n";
        middlegameAdvice += "3. Looking for weaknesses in your opponent's position";
      }

      this.messageElement.textContent = middlegameAdvice;

      // Show middlegame options
      this.showMiddlegameOptions();
    }, 1000);
  }

  showMiddlegameOptions() {
    this.optionsContainer.innerHTML = '';

    const middlegameOptions = [
      {
        name: "Suggest Best Move",
        action: () => this.suggestMove(),
        description: "Get a specific move recommendation"
      },
      {
        name: "Identify Weaknesses",
        action: () => this.identifyWeaknesses(),
        description: "Find weaknesses in both positions"
      },
      {
        name: "Strategic Plan",
        action: () => this.suggestStrategicPlan(),
        description: "Get a long-term plan for your position"
      },
      {
        name: "Check for Tactics",
        action: () => this.checkForTactics(),
        description: "Look for tactical opportunities"
      },
      {
        name: "Main Menu",
        action: () => this.showInitialOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    middlegameOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  showEndgameAdvice() {
    this.messageElement.textContent = "Analyzing the endgame position...";

    setTimeout(() => {
      // Get material count
      const material = this.countMaterial();

      let endgameAdvice = "Endgame Analysis:\n\n";
      endgameAdvice += `Material balance: White ${material.white} vs Black ${material.black}\n\n`;

      // Add specific endgame advice
      endgameAdvice += "Key endgame principles:\n";
      endgameAdvice += "1. Activate your king - it's a strong piece in the endgame\n";
      endgameAdvice += "2. Push passed pawns toward promotion\n";
      endgameAdvice += "3. Centralize your pieces for maximum effectiveness\n";

      // Add specific advice based on the material
      if (Math.abs(material.white - material.black) > 3) {
        endgameAdvice += "\nWith a material advantage, focus on simplifying the position and trading pieces (but not pawns).";
      } else {
        endgameAdvice += "\nIn this balanced endgame, look for opportunities to create passed pawns and activate your king.";
      }

      this.messageElement.textContent = endgameAdvice;

      // Show endgame options
      this.showEndgameOptions();
    }, 1000);
  }

  showEndgameOptions() {
    this.optionsContainer.innerHTML = '';

    const endgameOptions = [
      {
        name: "Suggest Best Move",
        action: () => this.suggestMove(),
        description: "Get a specific move recommendation"
      },
      {
        name: "Pawn Structure Analysis",
        action: () => this.analyzePawnStructure(),
        description: "Analyze the pawn structure and passed pawns"
      },
      {
        name: "King Activity",
        action: () => this.analyzeKingActivity(),
        description: "Get advice on king positioning"
      },
      {
        name: "Winning/Drawing Plan",
        action: () => this.suggestEndgamePlan(),
        description: "Get a plan to win or draw the endgame"
      },
      {
        name: "Main Menu",
        action: () => this.showInitialOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    endgameOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  showMistakeAdvice() {
    this.messageElement.textContent = "Analyzing your last move...";

    setTimeout(() => {
      // Get the last move
      let lastMove = null;
      if (this.chessGame.moveHistory && this.chessGame.moveHistory.length > 0) {
        lastMove = this.chessGame.moveHistory[this.chessGame.moveHistory.length - 1];
      }

      let mistakeAdvice = "";

      if (lastMove) {
        const moveNotation = this.formatMoveForDisplay(lastMove);

        mistakeAdvice = `I noticed your move ${moveNotation} might not be optimal.\n\n`;

        // Generate some possible issues with the move
        const possibleIssues = [
          "It leaves a piece undefended.",
          "It weakens your pawn structure.",
          "It moves the same piece multiple times in the opening.",
          "It doesn't address the immediate threat.",
          "It misses a tactical opportunity.",
          "It blocks the development of other pieces."
        ];

        // Randomly select an issue
        const issue = possibleIssues[Math.floor(Math.random() * possibleIssues.length)];
        mistakeAdvice += `The issue: ${issue}\n\n`;

        // Add constructive advice
        mistakeAdvice += "Consider these alternatives:\n";
        mistakeAdvice += "1. Look for moves that develop your pieces\n";
        mistakeAdvice += "2. Address immediate threats first\n";
        mistakeAdvice += "3. Control the center with pawns and pieces";
      } else {
        mistakeAdvice = "I noticed a potential issue with your last move.\n\n";
        mistakeAdvice += "Remember to check for:\n";
        mistakeAdvice += "- Pieces under attack\n";
        mistakeAdvice += "- Tactical opportunities\n";
        mistakeAdvice += "- Development of your pieces\n";
        mistakeAdvice += "- Control of the center\n";
        mistakeAdvice += "- King safety";
      }

      this.messageElement.textContent = mistakeAdvice;

      // Show options after mistake
      this.showMistakeOptions();
    }, 1000);
  }

  showMistakeOptions() {
    this.optionsContainer.innerHTML = '';

    const mistakeOptions = [
      {
        name: "Suggest Better Move",
        action: () => this.suggestMove(),
        description: "Get a recommendation for a better move"
      },
      {
        name: "Explain Why",
        action: () => this.explainMistake(),
        description: "Get a detailed explanation of the issue"
      },
      {
        name: "Continue Anyway",
        action: () => this.continueAfterMistake(),
        description: "Continue with your current move"
      },
      {
        name: "Main Menu",
        action: () => this.showInitialOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    mistakeOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  showPositiveReinforcement() {
    // Get a random positive phrase from the tutor's personality
    const phrase = this.tutorPersonality.phrases[
      Math.floor(Math.random() * this.tutorPersonality.phrases.length)
    ];

    this.messageElement.textContent = phrase + "\n\nWhat would you like to do next?";

    // Show general options
    this.generateOptions();
  }

  showTacticalOpportunity() {
    this.messageElement.textContent = "I've spotted a tactical opportunity!";

    setTimeout(() => {
      // Generate a random tactic (in a real implementation, you'd analyze the board)
      const tactics = [
        {
          name: "Fork",
          description: "You can attack multiple pieces simultaneously with your knight."
        },
        {
          name: "Pin",
          description: "You can pin your opponent's piece against a more valuable piece."
        },
        {
          name: "Discovered Attack",
          description: "Moving your knight reveals an attack from your bishop."
        },
        {
          name: "Double Attack",
          description: "Your queen can attack two pieces at once."
        },
        {
          name: "Skewer",
          description: "You can attack two pieces in a line, forcing the first to move and capture the second."
        }
      ];

      // Randomly select a tactic
      const tactic = tactics[Math.floor(Math.random() * tactics.length)];

      let tacticalAdvice = `Tactical Opportunity: ${tactic.name}\n\n`;
      tacticalAdvice += `${tactic.description}\n\n`;
      tacticalAdvice += "Would you like me to show you the move that exploits this tactic?";

      this.messageElement.textContent = tacticalAdvice;

      // Show tactical options
      this.showTacticalOptions(tactic);
    }, 1000);
  }

  showTacticalOptions(tactic) {
    this.optionsContainer.innerHTML = '';

    const tacticalOptions = [
      {
        name: "Show Me The Move",
        action: () => this.suggestTacticalMove(tactic),
        description: "See the move that exploits this tactic"
      },
      {
        name: "Explain This Tactic",
        action: () => this.explainTactic(tactic),
        description: "Learn more about this type of tactic"
      },
      {
        name: "Let Me Find It",
        action: () => this.letPlayerFindTactic(),
        description: "Try to find the tactic yourself"
      },
      {
        name: "Main Menu",
        action: () => this.showInitialOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    tacticalOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  showGameSummary() {
    this.messageElement.textContent = "Analyzing your game...";

    setTimeout(() => {
      // Determine game result
      let result = "unknown";
      let winner = null;

      if (this.chessGame.gameState) {
        if (this.chessGame.gameState === 'checkmate') {
          result = 'checkmate';
          winner = this.chessGame.currentPlayer === 'white' ? 'black' : 'white';
        } else if (this.chessGame.gameState === 'stalemate') {
          result = 'stalemate';
        } else if (this.chessGame.gameState === 'draw') {
          result = 'draw';
        }
      }

      let summary = "Game Summary:\n\n";

      if (result === 'checkmate') {
        summary += `The game ended in checkmate. ${winner === 'white' ? 'White' : 'Black'} wins!\n\n`;
      } else if (result === 'stalemate' || result === 'draw') {
        summary += "The game ended in a draw.\n\n";
      } else {
        summary += "The game has ended.\n\n";
      }

      // Add statistics
      summary += `Total moves: ${this.moveCount}\n`;
      summary += `Mistakes identified: ${this.commonMistakes.length}\n\n`;

      // Add personalized feedback
      if (this.commonMistakes.length > 3) {
        summary += "Areas to improve:\n";
        summary += "- Watch out for undefended pieces\n";
        summary += "- Check for tactical opportunities before moving\n";
        summary += "- Develop a plan for your pieces\n\n";
      } else {
        summary += "Positive aspects of your play:\n";
        summary += "- Good piece development\n";
        summary += "- Solid positional understanding\n";
        summary += "- Effective tactical awareness\n\n";
      }

      summary += "Would you like to analyze this game further or start a new one?";

      this.messageElement.textContent = summary;

      // Show game over options
      this.showGameOverOptions();
    }, 1500);
  }

  showGameOverOptions() {
    this.optionsContainer.innerHTML = '';

    const gameOverOptions = [
      {
        name: "Analyze Key Moments",
        action: () => this.analyzeKeyMoments(),
        description: "Review the critical positions in the game"
      },
      {
        name: "Improvement Tips",
        action: () => this.showImprovementTips(),
        description: "Get personalized advice to improve your play"
      },
      {
        name: "New Game",
        action: () => this.startNewGame(),
        description: "Start a new chess game"
      },
      {
        name: "Main Menu",
        action: () => this.showInitialOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    gameOverOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  showDefenseOptions() {
    this.optionsContainer.innerHTML = '';

    const defenseOptions = [
      {
        name: "Show Defense Move",
        action: () => this.suggestDefenseMove(),
        description: "Get a move to defend against the check"
      },
      {
        name: "Explain Check",
        action: () => this.explainCheck(),
        description: "Understand why you're in check"
      },
      {
        name: "Main Menu",
        action: () => this.showInitialOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    defenseOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  showSkillLevelOptions() {
    this.messageElement.textContent = "Select your skill level so I can provide appropriate advice:";

    this.optionsContainer.innerHTML = '';

    const skillLevels = [
      {
        name: "Beginner",
        action: () => this.setSkillLevel('beginner'),
        description: "New to chess or still learning the basics"
      },
      {
        name: "Intermediate",
        action: () => this.setSkillLevel('intermediate'),
        description: "Familiar with rules and basic strategies"
      },
      {
        name: "Advanced",
        action: () => this.setSkillLevel('advanced'),
        description: "Experienced player looking for deeper insights"
      }
    ];

    // Create option elements
    skillLevels.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  setSkillLevel(level) {
    this.playerSkillLevel = level;

    this.messageElement.textContent = `Great! I'll adjust my advice for a ${level} player. What would you like help with?`;

    // Show initial options
    setTimeout(() => {
      this.showInitialOptions();
    }, 1500);
  }

  showDevelopmentPlan() {
    this.messageElement.textContent = "Creating a development plan...";

    setTimeout(() => {
      // Determine which pieces are already developed
      const developedPieces = this.analyzeDevelopedPieces();

      let developmentPlan = "Development Plan:\n\n";

      if (developedPieces.needsCastling) {
        developmentPlan += "1. Castle to ensure king safety\n";
      }

      if (developedPieces.undevelopedMinorPieces > 0) {
        developmentPlan += `2. Develop your remaining ${developedPieces.undevelopedMinorPieces} minor piece(s)\n`;
      }

      if (!developedPieces.queensideDeveloped) {
        developmentPlan += "3. Complete queenside development\n";
      }

      if (!developedPieces.rooksConnected) {
        developmentPlan += "4. Connect your rooks by clearing the back rank\n";
      }

      developmentPlan += "\nRemember: Each move in the opening should contribute to these goals!";

      this.messageElement.textContent = developmentPlan;

      // Show options
      this.showOpeningNextStepOptions();
    }, 1000);
  }

  analyzeDevelopedPieces() {
    // In a real implementation, you would analyze the board
    // Here we're using simplified logic

    return {
      needsCastling: Math.random() > 0.5,
      undevelopedMinorPieces: Math.floor(Math.random() * 3),
      queensideDeveloped: Math.random() > 0.5,
      rooksConnected: Math.random() > 0.7
    };
  }

  showOpeningTraps() {
    this.messageElement.textContent = "Analyzing opening traps...";

    setTimeout(() => {
      // Try to identify the opening
      let openingName = null;
      try {
        if (this.chessGame.identifyCurrentOpening) {
          openingName = this.chessGame.identifyCurrentOpening();
        }
      } catch (e) {
        console.error("Error identifying opening:", e);
      }

      let trapsInfo = "Common Traps to Watch For:\n\n";

      if (openingName) {
        if (openingName.includes("Sicilian")) {
          trapsInfo += "1. Siberian Trap: White can lose material after Nxe4 if not careful\n\n";
          trapsInfo += "2. Smith-Morra Declined: White can get positional compensation for the pawn\n\n";
        } else if (openingName.includes("Ruy Lopez")) {
          trapsInfo += "1. Noah's Ark Trap: Black can trap White's bishop on a4\n\n";
          trapsInfo += "2. Marshall Attack: Black sacrifices a pawn for strong attacking chances\n\n";
        } else {
          trapsInfo += "1. Scholar's Mate: Watch for early queen and bishop attacks on f7/f2\n\n";
          trapsInfo += "2. Légal's Mate: A knight sacrifice followed by queen checkmate\n\n";
        }
      } else {
        trapsInfo += "1. Scholar's Mate: Watch for early queen and bishop attacks on f7/f2\n\n";
        trapsInfo += "2. Légal's Mate: A knight sacrifice followed by queen checkmate\n\n";
        trapsInfo += "3. Fishing Pole Trap: Knight sacrifice to draw the king out\n\n";
      }

      trapsInfo += "Always check for threats before making your move!";

      this.messageElement.textContent = trapsInfo;

      // Show options
      this.showOpeningNextStepOptions();
    }, 1000);
  }

  identifyWeaknesses() {
    this.messageElement.textContent = "Analyzing position for weaknesses...";

    setTimeout(() => {
      let weaknessAnalysis = "Position Weaknesses:\n\n";

      // In a real implementation, you would analyze the board
      // Here we're generating some plausible weaknesses

      const possibleWeaknesses = [
        "Isolated d-pawn: This pawn has no friendly pawns on adjacent files, making it harder to defend.",
        "Weak light squares: Your light-squared bishop is gone, creating weaknesses on those squares.",
        "Exposed king: Your king lacks pawn cover, making it vulnerable to attack.",
        "Backward pawn on c6: This pawn can't advance safely and needs constant defense.",
        "Knight outpost on e5: Your opponent has a strong knight that can't be attacked by pawns.",
        "Weak back rank: Your king and rooks are on the same rank with no escape squares."
      ];

      // Randomly select 2-3 weaknesses
      const numWeaknesses = Math.floor(Math.random() * 2) + 2;
      const selectedWeaknesses = this.shuffleArray(possibleWeaknesses).slice(0, numWeaknesses);

      weaknessAnalysis += "Your weaknesses:\n";
      selectedWeaknesses.forEach((weakness, index) => {
        weaknessAnalysis += `${index + 1}. ${weakness}\n`;
      });

      weaknessAnalysis += "\nOpponent's weaknesses:\n";

      // Generate opponent weaknesses
      const opponentWeaknesses = this.shuffleArray(possibleWeaknesses).slice(0, 2);
      opponentWeaknesses.forEach((weakness, index) => {
        weaknessAnalysis += `${index + 1}. ${weakness}\n`;
      });

      weaknessAnalysis += "\nFocus on exploiting your opponent's weaknesses while addressing your own!";

      this.messageElement.textContent = weaknessAnalysis;

      // Show middlegame options
      this.showMiddlegameOptions();
    }, 1200);
  }

  suggestStrategicPlan() {
    this.messageElement.textContent = "Developing a strategic plan...";

    setTimeout(() => {
      // Get evaluation if available
      let evaluation = 0;
      try {
        evaluation = this.chessGame.evaluatePosition ?
          this.chessGame.evaluatePosition() : 0;
      } catch (e) {
        console.error("Error evaluating position:", e);
      }

      let strategicPlan = "Strategic Plan:\n\n";

      if (evaluation > 50) {
        // Winning position
        strategicPlan += "You have an advantage. Your plan should be:\n\n";
        strategicPlan += "1. Simplify the position by trading pieces (but not pawns)\n";
        strategicPlan += "2. Centralize your pieces, especially the king in the endgame\n";
        strategicPlan += "3. Create passed pawns and push them toward promotion\n";
        strategicPlan += "4. Prevent counterplay by limiting your opponent's activity";
      } else if (evaluation < -50) {
        // Losing position
        strategicPlan += "You're at a disadvantage. Your plan should be:\n\n";
        strategicPlan += "1. Create complications and tactical opportunities\n";
        strategicPlan += "2. Seek piece activity rather than material\n";
        strategicPlan += "3. Look for fortress positions or perpetual check opportunities\n";
        strategicPlan += "4. Prepare counterplay on the wing opposite to your opponent's attack";
      } else {
        // Equal position
        strategicPlan += "The position is roughly equal. Your plan could be:\n\n";
        strategicPlan += "1. Improve your worst-placed piece\n";
        strategicPlan += "2. Create imbalances that favor your position\n";
        strategicPlan += "3. Target weak pawns or squares in your opponent's position\n";
        strategicPlan += "4. Prepare a breakthrough in the center or on the wing";
      }

      this.messageElement.textContent = strategicPlan;

      // Show middlegame options
      this.showMiddlegameOptions();
    }, 1000);
  }

  analyzePawnStructure() {
    this.messageElement.textContent = "Analyzing pawn structure...";

    setTimeout(() => {
      let pawnAnalysis = "Pawn Structure Analysis:\n\n";

      // In a real implementation, you would analyze the board
      // Here we're generating some plausible pawn structures

      const pawnStructures = [
        {
          name: "Isolated Queen's Pawn",
          description: "You have an isolated pawn on the d-file. This can be both a weakness (hard to defend) and a strength (provides space and open lines)."
        },
        {
          name: "Hanging Pawns",
          description: "You have connected pawns on the c and d files with no pawns on adjacent files. These provide space but can become targets."
        },
        {
          name: "Pawn Chain",
          description: "You have a pawn chain pointing toward the kingside. Attack at the base of the chain or advance the front pawn."
        },
        {
          name: "Pawn Majority",
          description: "You have more pawns on the queenside. Create a passed pawn by advancing and trading pawns."
        },
        {
          name: "Backward Pawn",
          description: "You have a backward pawn that cannot be advanced safely. This is a potential weakness to defend."
        }
      ];

      // Randomly select a pawn structure
      const structure = pawnStructures[Math.floor(Math.random() * pawnStructures.length)];

      pawnAnalysis += `Structure type: ${structure.name}\n\n`;
      pawnAnalysis += `${structure.description}\n\n`;

      // Add passed pawn analysis
      pawnAnalysis += "Passed Pawns:\n";

      const passedPawns = Math.floor(Math.random() * 3);
      if (passedPawns > 0) {
        pawnAnalysis += `You have ${passedPawns} passed pawn(s). Push them forward with support from your pieces!\n`;
      } else {
        pawnAnalysis += "You don't have any passed pawns yet. Look for opportunities to create them.\n";
      }

      pawnAnalysis += "\nRemember: Pawns are the soul of chess. Their structure determines the character of the position!";

      this.messageElement.textContent = pawnAnalysis;

      // Show endgame options
      this.showEndgameOptions();
    }, 1000);
  }

  analyzeKingActivity() {
    this.messageElement.textContent = "Analyzing king activity...";

    setTimeout(() => {
      let kingAnalysis = "King Activity in the Endgame:\n\n";

      // In a real implementation, you would analyze the board
      // Here we're generating some plausible advice

      kingAnalysis += "Your king is currently on e2, which is a good central position for the endgame.\n\n";

      kingAnalysis += "King activity principles:\n";
      kingAnalysis += "1. In the endgame, your king is a strong piece - use it!\n";
      kingAnalysis += "2. Move your king toward the center and then toward the action\n";
      kingAnalysis += "3. The king can help support passed pawns\n";
      kingAnalysis += "4. The king can help stop enemy passed pawns\n";
      kingAnalysis += "5. Remember the opposition concept - kings facing each other with one square between\n\n";

      kingAnalysis += "Suggested king move: Move your king to d3 to centralize it further and support your passed d-pawn.";

      this.messageElement.textContent = kingAnalysis;

      // Show endgame options
      this.showEndgameOptions();
    }, 1000);
  }

  suggestEndgamePlan() {
    this.messageElement.textContent = "Creating endgame plan...";

    setTimeout(() => {
      // Get evaluation if available
      let evaluation = 0;
      try {
        evaluation = this.chessGame.evaluatePosition ?
          this.chessGame.evaluatePosition() : 0;
      } catch (e) {
        console.error("Error evaluating position:", e);
      }

      let endgamePlan = "Endgame Plan:\n\n";

      if (evaluation > 50) {
        // Winning plan
        endgamePlan += "You have a winning position. Your plan should be:\n\n";
        endgamePlan += "1. Create and advance passed pawns\n";
        endgamePlan += "2. Centralize your king and bring it to support your pawns\n";
        endgamePlan += "3. Trade pieces but not pawns\n";
        endgamePlan += "4. Be careful not to allow stalemate tricks";
      } else if (evaluation < -50) {
        // Drawing plan
        endgamePlan += "You're at a disadvantage. Your drawing plan should be:\n\n";
        endgamePlan += "1. Trade pawns to reduce your opponent's winning chances\n";
        endgamePlan += "2. Keep your king active and in front of enemy pawns\n";
        endgamePlan += "3. Look for fortress positions or perpetual check\n";
        endgamePlan += "4. Create counterplay with your own passed pawn if possible";
      } else {
        // Equal position
        endgamePlan += "The position is roughly equal. Your plan could be:\n\n";
        endgamePlan += "1. Create a passed pawn on the side with your pawn majority\n";
        endgamePlan += "2. Activate your king and bring it to the center\n";
        endgamePlan += "3. Target your opponent's weakest pawns\n";
        endgamePlan += "4. Look for zugzwang opportunities where any move worsens your opponent's position";
      }

      this.messageElement.textContent = endgamePlan;

      // Show endgame options
      this.showEndgameOptions();
    }, 1000);
  }

  explainMistake() {
    this.messageElement.textContent = "Analyzing the mistake...";

    setTimeout(() => {
      // Get the last move
      let lastMove = null;
      if (this.chessGame.moveHistory && this.chessGame.moveHistory.length > 0) {
        lastMove = this.chessGame.moveHistory[this.chessGame.moveHistory.length - 1];
      }

      let explanation = "";

      if (lastMove) {
        const moveNotation = this.formatMoveForDisplay(lastMove);

        explanation = `Detailed analysis of ${moveNotation}:\n\n`;

        // Generate a detailed explanation
        explanation += "This move creates several issues:\n\n";
        explanation += "1. It leaves your bishop on c5 undefended, which your opponent can now capture\n\n";
        explanation += "2. It misses a tactical opportunity to win material with Nxe4, forking the queen and rook\n\n";
        explanation += "3. It doesn't address the threat to your king, which should be your priority\n\n";

        explanation += "Remember: Always check for captures, checks, and threats before making your move!";
      } else {
        explanation = "Without specific move information, here are common mistakes to avoid:\n\n";
        explanation += "1. Leaving pieces undefended\n";
        explanation += "2. Missing tactical opportunities\n";
        explanation += "3. Ignoring your opponent's threats\n";
        explanation += "4. Moving the same piece multiple times in the opening\n";
        explanation += "5. Weakening your king's position";
      }

      this.messageElement.textContent = explanation;

      // Show mistake options
      this.showMistakeOptions();
    }, 1200);
  }

  continueAfterMistake() {
    this.messageElement.textContent = "That's fine! Everyone makes mistakes in chess. Let's continue with the game.";

    // Reset dialog state
    this.dialogState = this.determineGamePhase();

    // Show general options after a delay
    setTimeout(() => {
      this.generateOptions();
    }, 2000);
  }

  suggestTacticalMove(tactic) {
    this.messageElement.textContent = `Finding the best move for this ${tactic.name} tactic...`;

    setTimeout(() => {
      // In a real implementation, you would calculate the actual tactical move
      // Here we're generating a plausible move

      let tacticalMove = "";

      switch (tactic.name) {
        case "Fork":
          tacticalMove = "Ng5";
          break;
        case "Pin":
          tacticalMove = "Bf4";
          break;
        case "Discovered Attack":
          tacticalMove = "Nf3+";
          break;
        case "Double Attack":
          tacticalMove = "Qd5";
          break;
        case "Skewer":
          tacticalMove = "Bc4";
          break;
        default:
          tacticalMove = "Nf6";
      }

      let moveExplanation = `The tactical move is: ${tacticalMove}\n\n`;
      moveExplanation += `This ${tactic.name} works because ${tactic.description}\n\n`;
      moveExplanation += "Would you like to make this move?";

      this.messageElement.textContent = moveExplanation;

      // Show options to make the move
      this.showMakeTacticalMoveOptions(tacticalMove);
    }, 1200);
  }

  showMakeTacticalMoveOptions(move) {
    this.optionsContainer.innerHTML = '';

    const moveOptions = [
      {
        name: "Make This Move",
        action: () => this.makeTacticalMove(move),
        description: "Apply the tactical move to the board"
      },
      {
        name: "Show Me Why",
        action: () => this.explainTacticalMove(move),
        description: "Get a detailed explanation with arrows on the board"
      },
      {
        name: "Let Me Try Another",
        action: () => this.generateOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    moveOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  makeTacticalMove(move) {
    // In a real implementation, you would convert the algebraic notation
    // to coordinates and make the move
    this.messageElement.textContent = `I would make the move ${move} for you, but I need to convert it to coordinates first.`;

    // Show general options after a delay
    setTimeout(() => {
      this.generateOptions();
    }, 2000);
  }

  explainTacticalMove(move) {
    this.messageElement.textContent = `Explaining the tactical move ${move}...`;

    setTimeout(() => {
      let explanation = `The move ${move} creates multiple threats:\n\n`;

      explanation += "1. It attacks the opponent's queen on d8\n";
      explanation += "2. It simultaneously attacks the rook on h7\n";
      explanation += "3. It cannot be captured because it's protected by your bishop\n\n";

      explanation += "This is a classic knight fork, one of the most common tactical motifs in chess.";

      this.messageElement.textContent = explanation;

      // Show make move options again
      this.showMakeTacticalMoveOptions(move);
    }, 1000);
  }

  explainTactic(tactic) {
    this.messageElement.textContent = `Explaining ${tactic.name} tactics...`;

    setTimeout(() => {
      let explanation = `${tactic.name} - Chess Tactical Pattern\n\n`;

      switch (tactic.name) {
        case "Fork":
          explanation += "A fork occurs when a single piece attacks two or more enemy pieces simultaneously. Knights are especially good at forking because of their unique movement pattern.\n\n";
          explanation += "Example: A knight on f7 can fork the king on h8 and rook on d6.";
          break;
        case "Pin":
          explanation += "A pin is when a piece cannot move because doing so would expose a more valuable piece behind it to capture.\n\n";
          explanation += "Example: A bishop on g5 pinning a knight on f6 to the queen on d8.";
          break;
        case "Discovered Attack":
          explanation += "A discovered attack occurs when moving one piece reveals an attack from another piece behind it.\n\n";
          explanation += "Example: Moving a knight reveals a bishop's attack on the opponent's queen.";
          break;
        case "Double Attack":
          explanation += "A double attack is when a piece attacks two targets simultaneously.\n\n";
          explanation += "Example: A queen on d5 attacking both a knight on b5 and a bishop on h5.";
          break;
        case "Skewer":
          explanation += "A skewer is like a reverse pin - a piece is forced to move, allowing the capture of a piece behind it.\n\n";
          explanation += "Example: A bishop on a7 attacks the king on e3, forcing it to move and allowing capture of the rook on h3.";
          break;
        default:
          explanation += "This is a common tactical pattern where one piece gains an advantage over multiple opponent pieces.";
      }

      this.messageElement.textContent = explanation;

      // Show tactical options again
      this.showTacticalOptions(tactic);
    }, 1000);
  }

  letPlayerFindTactic() {
    this.messageElement.textContent = "Great! Try to find the tactic yourself. Look for pieces that can attack multiple targets at once, or pieces that can be moved to reveal attacks.";

    // Reset dialog state
    this.dialogState = this.determineGamePhase();

    // Show general options after a delay
    setTimeout(() => {
      this.generateOptions();
    }, 3000);
  }

  analyzeKeyMoments() {
    this.messageElement.textContent = "Analyzing key moments from the game...";

    setTimeout(() => {
      let keyMoments = "Key Moments Analysis:\n\n";

      // In a real implementation, you would analyze the actual game
      // Here we're generating some plausible key moments

      keyMoments += "1. Opening (Move 6):\n";
      keyMoments += "You played d4 instead of castling, delaying king safety. Consider prioritizing castling in future games.\n\n";

      keyMoments += "2. Middlegame (Move 15):\n";
      keyMoments += "You missed a tactical opportunity with Nxe4, which would have won material.\n\n";

      keyMoments += "3. Critical Position (Move 24):\n";
      keyMoments += "Your exchange sacrifice was the turning point of the game, creating strong attacking chances.\n\n";

      keyMoments += "4. Endgame (Move 35):\n";
      keyMoments += "You correctly centralized your king, which was crucial for the endgame advantage.";

      this.messageElement.textContent = keyMoments;

      // Show game over options
      this.showGameOverOptions();
    }, 1500);
  }

  showImprovementTips() {
    this.messageElement.textContent = "Generating personalized improvement tips...";

    setTimeout(() => {
      let improvementTips = "Areas for Improvement:\n\n";

      // Base tips on skill level and common mistakes
      if (this.playerSkillLevel === 'beginner') {
        improvementTips += "1. Piece Safety: Watch out for undefended pieces\n";
        improvementTips += "2. Opening Principles: Focus on controlling the center and developing pieces\n";
        improvementTips += "3. Basic Tactics: Practice identifying forks, pins, and skewers\n";
        improvementTips += "4. Checkmate Patterns: Learn the basic checkmate patterns\n";
      } else if (this.playerSkillLevel === 'intermediate') {
        improvementTips += "1. Tactical Awareness: Look deeper for tactical opportunities\n";
        improvementTips += "2. Pawn Structure: Pay more attention to pawn weaknesses\n";
        improvementTips += "3. Strategic Planning: Develop longer-term plans\n";
        improvementTips += "4. Endgame Technique: Study basic endgame positions\n";
      } else {
        improvementTips += "1. Calculation: Practice calculating variations more deeply\n";
        improvementTips += "2. Positional Understanding: Focus on subtle positional advantages\n";
        improvementTips += "3. Dynamic Play: Balance between material and activity\n";
        improvementTips += "4. Opening Preparation: Deepen your opening knowledge\n";
      }

      // Add specific advice based on common mistakes
      if (this.commonMistakes.length > 0) {
        improvementTips += "\nBased on this game, focus especially on:\n";

        if (this.commonMistakes.length >= 3) {
          improvementTips += "- Tactical awareness (you missed several tactical opportunities)\n";
        }

        // Add random specific advice
        const specificAdvice = [
          "- Piece coordination (your pieces weren't working together optimally)",
          "- King safety (your king was exposed at critical moments)",
          "- Pawn structure (you created weaknesses in your pawn formation)",
          "- Time management (you spent too much time on early decisions)"
        ];

        improvementTips += specificAdvice[Math.floor(Math.random() * specificAdvice.length)];
      }

      improvementTips += "\n\nRecommended Study Materials:\n";

      if (this.playerSkillLevel === 'beginner') {
        improvementTips += "- 'Chess Fundamentals' by José Raúl Capablanca\n";
        improvementTips += "- 'Bobby Fischer Teaches Chess' for tactical training\n";
      } else if (this.playerSkillLevel === 'intermediate') {
        improvementTips += "- 'My System' by Aron Nimzowitsch\n";
        improvementTips += "- 'Logical Chess: Move by Move' by Irving Chernev\n";
      } else {
        improvementTips += "- 'Dvoretsky's Endgame Manual' by Mark Dvoretsky\n";
        improvementTips += "- 'Positional Chess Handbook' by Israel Gelfer\n";
      }

      this.messageElement.textContent = improvementTips;

      // Show game over options
      this.showGameOverOptions();
    }, 1500);
  }

  startNewGame() {
    // Reset game state
    if (this.chessGame.resetGame) {
      this.chessGame.resetGame();
    } else {
      // Fallback if resetGame is not available
      window.location.reload();
    }

    this.messageElement.textContent = "Starting a new game! What would you like help with?";

    // Reset dialog state
    this.moveCount = 0;
    this.dialogState = 'initial';
    this.commonMistakes = [];
    this.lastAnalyzedPosition = null;

    // Show initial options
    setTimeout(() => {
      this.showInitialOptions();
    }, 1000);
  }

  explainChessPrinciples() {
    this.messageElement.textContent = "Here are the fundamental chess principles:";

    setTimeout(() => {
      let principles = "Fundamental Chess Principles:\n\n";

      principles += "1. Control the Center\n";
      principles += "   - The central squares (d4, d5, e4, e5) are crucial\n";
      principles += "   - Control them with pawns and support with pieces\n\n";

      principles += "2. Develop Your Pieces\n";
      principles += "   - Get your knights and bishops out early\n";
      principles += "   - Aim pieces toward the center\n";
      principles += "   - Don't move the same piece multiple times in the opening\n\n";

      principles += "3. King Safety\n";
      principles += "   - Castle early (usually within the first 10 moves)\n";
      principles += "   - Maintain pawn structure in front of your king\n\n";

      principles += "4. Piece Coordination\n";
      principles += "   - Pieces should work together\n";
      principles += "   - Connect your rooks on the back rank\n\n";

      principles += "5. Pawn Structure\n";
      principles += "   - Avoid creating weaknesses (isolated, doubled, or backward pawns)\n";
      principles += "   - Use pawns to control space\n\n";

      principles += "6. Think Before You Move\n";
      principles += "   - Check for captures, checks, and threats\n";
      principles += "   - Consider your opponent's possible responses";

      this.messageElement.textContent = principles;

      // Show options
      this.showPrinciplesOptions();
    }, 1000);
  }

  showPrinciplesOptions() {
    this.optionsContainer.innerHTML = '';

    const principlesOptions = [
      {
        name: "Opening Principles",
        action: () => this.explainOpeningPrinciples(),
        description: "Learn specific principles for the opening"
      },
      {
        name: "Middlegame Principles",
        action: () => this.explainMiddlegamePrinciples(),
        description: "Learn specific principles for the middlegame"
      },
      {
        name: "Endgame Principles",
        action: () => this.explainEndgamePrinciples(),
        description: "Learn specific principles for the endgame"
      },
      {
        name: "Main Menu",
        action: () => this.showInitialOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    principlesOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  explainMiddlegamePrinciples() {
    this.messageElement.textContent = "Loading middlegame principles...";

    setTimeout(() => {
      let principles = "Middlegame Principles:\n\n";

      principles += "1. Create and Execute a Plan\n";
      principles += "   - Identify weaknesses in your opponent's position\n";
      principles += "   - Determine the best wing to attack (kingside/queenside)\n";
      principles += "   - Position your pieces accordingly\n\n";

      principles += "2. Piece Activity\n";
      principles += "   - Maximize the activity of your pieces\n";
      principles += "   - Rooks belong on open files\n";
      principles += "   - Knights work best in closed positions\n";
      principles += "   - Bishops work best in open positions\n\n";

      principles += "3. Pawn Structure\n";
      principles += "   - Create pawn chains pointing toward your attack\n";
      principles += "   - Attack at the base of pawn chains\n";
      principles += "   - Create and exploit weak squares\n\n";

      principles += "4. King Safety\n";
      principles += "   - Maintain pawn cover in front of your king\n";
      principles += "   - Watch for sacrifices on typical squares (h7/h2, g7/g2)\n";
      principles += "   - Avoid weakening the king's position\n\n";

      principles += "5. Tactical Awareness\n";
      principles += "   - Always look for tactical opportunities\n";
      principles += "   - Check for forks, pins, skewers, discovered attacks\n";
      principles += "   - Calculate forced sequences carefully";

      this.messageElement.textContent = principles;

      // Show principles options
      this.showPrinciplesOptions();
    }, 1000);
  }

  explainEndgamePrinciples() {
    this.messageElement.textContent = "Loading endgame principles...";

    setTimeout(() => {
      let principles = "Endgame Principles:\n\n";

      principles += "1. King Activity\n";
      principles += "   - Your king is a strong piece in the endgame\n";
      principles += "   - Centralize your king\n";
      principles += "   - Use your king to support passed pawns\n\n";

      principles += "2. Passed Pawns\n";
      principles += "   - Create and advance passed pawns\n";
      principles += "   - The value of a passed pawn increases as it advances\n";
      principles += "   - 'A passed pawn is a criminal which should be kept under lock and key'\n\n";

      principles += "3. Opposition\n";
      principles += "   - Direct opposition: Kings face each other with one square between\n";
      principles += "   - Distant opposition: Kings face each other with odd number of squares between\n";
      principles += "   - The player not having to move often has the advantage\n\n";

      principles += "4. Rook Endgames\n";
      principles += "   - Rooks belong behind passed pawns\n";
      principles += "   - Cut off the enemy king with your rook\n";
      principles += "   - Activate your rook before pushing pawns\n\n";

      principles += "5. Zugzwang\n";
      principles += "   - Create positions where any move your opponent makes worsens their position\n";
      principles += "   - Especially powerful in king and pawn endgames";

      this.messageElement.textContent = principles;

      // Show principles options
      this.showPrinciplesOptions();
    }, 1000);
  }

  suggestDefenseMove() {
    this.messageElement.textContent = "Finding the best defense against check...";

    setTimeout(() => {
      // In a real implementation, you would calculate the actual defense move
      // Here we're generating a plausible move

      let defenseMove = "Kg1";
      let defenseExplanation = `The best defense is ${defenseMove}.\n\n`;
      defenseExplanation += "This move gets your king out of check by moving to a safe square.\n\n";
      defenseExplanation += "Would you like to make this move?";

      this.messageElement.textContent = defenseExplanation;

      // Show options to make the move
      this.showMakeDefenseMoveOptions(defenseMove);
    }, 1200);
  }

  showMakeDefenseMoveOptions(move) {
    this.optionsContainer.innerHTML = '';

    const moveOptions = [
      {
        name: "Make This Move",
        action: () => this.makeDefenseMove(move),
        description: "Apply the defense move to the board"
      },
      {
        name: "Show Me Why",
        action: () => this.explainDefenseMove(move),
        description: "Get a detailed explanation"
      },
      {
        name: "Let Me Try Another",
        action: () => this.generateOptions(),
        description: "Return to the main options"
      }
    ];

    // Create option elements
    moveOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  makeDefenseMove(move) {
    // In a real implementation, you would convert the algebraic notation
    // to coordinates and make the move
    this.messageElement.textContent = `I would make the move ${move} for you, but I need to convert it to coordinates first.`;

    // Show general options after a delay
    setTimeout(() => {
      this.generateOptions();
    }, 2000);
  }

  explainDefenseMove(move) {
    this.messageElement.textContent = `Explaining the defense move ${move}...`;

    setTimeout(() => {
      let explanation = `The move ${move} defends against check by:\n\n`;

      explanation += "1. Moving the king to a safe square where it's not under attack\n";
      explanation += "2. Avoiding other checks from the opponent's pieces\n";
      explanation += "3. Maintaining a relatively safe king position\n\n";

      explanation += "There are three ways to get out of check:\n";
      explanation += "- Move the king to a safe square\n";
      explanation += "- Capture the checking piece\n";
      explanation += "- Block the check with another piece";

      this.messageElement.textContent = explanation;

      // Show make move options again
      this.showMakeDefenseMoveOptions(move);
    }, 1000);
  }

  explainCheck() {
    this.messageElement.textContent = "Explaining the check...";

    setTimeout(() => {
      let explanation = "Check Explanation:\n\n";

      explanation += "Your king is under attack by your opponent's bishop on b5.\n\n";

      explanation += "When in check, you must address it immediately. You have three options:\n";
      explanation += "1. Move your king to a safe square\n";
      explanation += "2. Capture the checking piece (the bishop)\n";
      explanation += "3. Block the check with another piece\n\n";

      explanation += "In this position, your best option is to move your king, as the bishop cannot be captured or blocked.";

      this.messageElement.textContent = explanation;

      // Show defense options
      this.showDefenseOptions();
    }, 1000);
  }

  // Helper functions

  countMaterial() {
    // In a real implementation, you would count the actual material
    // Here we're returning placeholder values
    return {
      white: 25,
      black: 23
    };
  }

  selectOption(index) {
    const options = this.optionsContainer.querySelectorAll('.advice-option');
    if (index >= 0 && index < options.length) {
      options[index].click();
    }
  }

  // Helper function to shuffle array
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Standard functions from previous implementation

  generateOptions() {
    // Clear existing options
    this.optionsContainer.innerHTML = '';

    // Set message
    this.messageElement.textContent = "What would you like help with?";

    // Define available option categories
    const optionCategories = [
      {
        name: "Analyze Position",
        action: () => this.analyzePosition(),
        description: "Get an evaluation of the current position"
      },
      {
        name: "Suggest Move",
        action: () => this.suggestMove(),
        description: "Get a recommendation for your next move"
      },
      {
        name: "Identify Opening",
        action: () => this.identifyOpening(),
        description: "Find out what opening is being played"
      },
      {
        name: "Check for Tactics",
        action: () => this.checkForTactics(),
        description: "Look for tactical opportunities"
      },
      {
        name: "Analyze Last Move",
        action: () => this.analyzeLastMove(),
        description: "Evaluate the quality of the last move"
      },
      {
        name: "Explain Patterns",
        action: () => this.explainPatterns(),
        description: "Identify chess patterns on the board"
      },
      {
        name: "Counter Moves",
        action: () => this.suggestCounterMove(),
        description: "Find responses to your opponent's moves"
      },
      {
        name: "Endgame Tips",
        action: () => this.provideEndgameTips(),
        description: "Get advice for the endgame"
      },
      {
        name: "Opening Principles",
        action: () => this.explainOpeningPrinciples(),
        description: "Learn about opening principles"
      }
    ];

    // Randomly select 5 options
    const selectedOptions = this.shuffleArray(optionCategories).slice(0, 5);

    // Create option elements
    selectedOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  analyzePosition() {
    this.messageElement.textContent = "Analyzing the current position...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      let analysis = "Position Analysis:\n\n";

      // Get evaluation if available
      let evaluation = 0;
      try {
        evaluation = this.chessGame.evaluatePosition ?
          this.chessGame.evaluatePosition() : 0;
      } catch (e) {
        console.error("Error evaluating position:", e);
      }

      // Format evaluation
      const formattedEval = evaluation > 0 ?
        `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);

      // Determine advantage
      let advantageText = "The position looks equal.";
      if (evaluation > 100) {
        advantageText = "White has a significant advantage.";
      } else if (evaluation > 50) {
        advantageText = "White has a slight advantage.";
      } else if (evaluation < -100) {
        advantageText = "Black has a significant advantage.";
      } else if (evaluation < -50) {
        advantageText = "Black has a slight advantage.";
      }

      analysis += `Evaluation: ${formattedEval} (${advantageText})\n\n`;

      // Add general advice
      if (evaluation > 0) {
        analysis += "Advice: White should try to convert this advantage by simplifying the position or launching a direct attack.";
      } else if (evaluation < 0) {
        analysis += "Advice: Black should try to convert this advantage by simplifying the position or launching a direct attack.";
      } else {
        analysis += "Advice: Look for ways to create imbalances and seize the initiative.";
      }

      this.showResult(analysis);
    }, 1000);
  }

  suggestMove() {
    this.messageElement.textContent = "Finding the best moves for this position...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      const currentPlayer = this.chessGame.currentPlayer;

      // Get the top 5 moves
      const topMoves = this.findTopMoves(5);

      if (topMoves && topMoves.length > 0) {
        let suggestion = "Here are the best moves in this position:\n\n";

        // Show options for each move
        this.showResultWithOptions(suggestion, topMoves.map((moveData, index) => ({
          name: `${index + 1}. ${this.formatMoveForDisplay(moveData.move)}`,
          action: () => this.makeMove(this.formatMoveToString(moveData.move)),
          description: moveData.explanation
        })));
      } else {
        const suggestion = "I couldn't calculate specific best moves in this position. Try looking for pieces that are under attack, opportunities to develop your pieces, or ways to improve your pawn structure.";
        this.showResult(suggestion);
      }
    }, 1500);
  }

  findTopMoves(count = 5) {
    // In a real implementation, you would use a chess engine to find the best moves
    // Here we're implementing a simplified approach

    try {
      // Try to get moves from the engine if available
      if (this.chessGame.findMultipleBestMoves) {
        return this.chessGame.findMultipleBestMoves(count);
      }

      // Fallback implementation if the engine doesn't support multiple move suggestions
      const moves = [];

      // Try to get the best move
      let bestMove = null;
      if (window.chessTutelage && window.chessTutelage.getLearnedMove) {
        bestMove = window.chessTutelage.getLearnedMove();
      } else if (this.chessGame.findBestMoveWithVisualization) {
        bestMove = this.chessGame.findBestMoveWithVisualization(this.chessGame.currentPlayer, 3);
      }

      if (bestMove) {
        moves.push({
          move: bestMove,
          evaluation: 1.0,
          explanation: "The strongest move in this position."
        });
      }

      // Generate some plausible alternative moves
      const alternativeMoves = this.generateAlternativeMoves();

      // Add alternative moves to the list
      moves.push(...alternativeMoves);

      // Sort by evaluation (best first) and limit to requested count
      return moves
        .sort((a, b) => b.evaluation - a.evaluation)
        .slice(0, count);

    } catch (e) {
      console.error("Error finding top moves:", e);
      return this.generateAlternativeMoves(count);
    }
  }

  generateAlternativeMoves(count = 5) {
    // This is a fallback method that generates plausible moves
    // In a real implementation, you would use a chess engine

    const moves = [];
    const currentPhase = this.determineGamePhase();

    // Generate different types of moves based on the game phase
    if (currentPhase === 'opening') {
      // Opening moves focus on development, center control, and king safety
      moves.push(
        {
          move: { notation: "e2e4" },
          evaluation: 0.8,
          explanation: "Controls the center and opens lines for bishop and queen."
        },
        {
          move: { notation: "d2d4" },
          evaluation: 0.7,
          explanation: "Controls the center and opens lines for the queen and bishop."
        },
        {
          move: { notation: "g1f3" },
          evaluation: 0.6,
          explanation: "Develops the knight to a good square controlling the center."
        },
        {
          move: { notation: "e1g1" },
          evaluation: 0.5,
          explanation: "Castling ensures king safety, a key opening principle."
        },
        {
          move: { notation: "f1c4" },
          evaluation: 0.4,
          explanation: "Develops the bishop to an active square targeting f7/f2."
        }
      );
    } else if (currentPhase === 'middlegame') {
      // Middlegame moves focus on tactics, piece activity, and plans
      moves.push(
        {
          move: { notation: "d4e5" },
          evaluation: 0.9,
          explanation: "Captures a central pawn and increases piece mobility."
        },
        {
          move: { notation: "f3d4" },
          evaluation: 0.8,
          explanation: "Improves knight position to a strong central outpost."
        },
        {
          move: { notation: "c1f4" },
          evaluation: 0.7,
          explanation: "Develops the bishop to an active diagonal."
        },
        {
          move: { notation: "a1c1" },
          evaluation: 0.6,
          explanation: "Places the rook on a semi-open file for better activity."
        },
        {
          move: { notation: "h2h3" },
          evaluation: 0.5,
          explanation: "Creates a luft (escape square) for the king to prevent back rank mates."
        }
      );
    } else {
      // Endgame moves focus on king activity, passed pawns, and simplification
      moves.push(
        {
          move: { notation: "e4e5" },
          evaluation: 0.9,
          explanation: "Advances a passed pawn closer to promotion."
        },
        {
          move: { notation: "e1f2" },
          evaluation: 0.8,
          explanation: "Activates the king, crucial in the endgame."
        },
        {
          move: { notation: "a1a7" },
          evaluation: 0.7,
          explanation: "Places the rook behind the passed pawn to support its advance."
        },
        {
          move: { notation: "f3e5" },
          evaluation: 0.6,
          explanation: "Centralizes the knight to a strong outpost."
        },
        {
          move: { notation: "d4c5" },
          evaluation: 0.5,
          explanation: "Captures an opponent's pawn, simplifying toward a winning endgame."
        }
      );
    }

    // Return the requested number of moves
    return moves.slice(0, count);
  }

  identifyOpening() {
    // Implementation from previous code...
    this.messageElement.textContent = "Identifying the opening...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      let openingInfo = "";

      // Try to get opening name from the game
      let openingName = null;
      try {
        if (this.chessGame.identifyCurrentOpening) {
          openingName = this.chessGame.identifyCurrentOpening();
        }
      } catch (e) {
        console.error("Error identifying opening:", e);
      }

      if (openingName) {
        openingInfo = `You're playing the ${openingName}.\n\n`;

        // Add general advice
        openingInfo += "General advice: ";

        if (openingName.includes("Ruy Lopez") || openingName.includes("Italian Game")) {
          openingInfo += "Focus on developing your pieces, controlling the center, and preparing for castling.";
        } else if (openingName.includes("Sicilian")) {
          openingInfo += "Be prepared for sharp tactical play and be careful about your king's safety.";
        } else if (openingName.includes("French") || openingName.includes("Caro-Kann")) {
          openingInfo += "Be patient, develop your pieces, and look for opportunities to counter-attack in the center.";
        } else if (openingName.includes("Queen's Gambit")) {
          openingInfo += "Focus on piece development and control of the center. Be careful about pawn structure weaknesses.";
        } else if (openingName.includes("King's Indian") || openingName.includes("Grünfeld")) {
          openingInfo += "Allow White to build a pawn center, then counter-attack with piece pressure and timely pawn breaks.";
        } else if (openingName.includes("English")) {
          openingInfo += "Play flexibly and be ready to transpose into different opening systems.";
        } else if (openingName.includes("King's Gambit")) {
          openingInfo += "Be prepared for sharp tactical play and be careful about pawn structure weaknesses.";
        } else {
          openingInfo += "Focus on sound development, control of the center, and king safety.";
        }
      } else {
        openingInfo = "I couldn't identify a specific named opening in this position. This might be a less common variation or the game has moved beyond the opening phase.\n\nRegardless of the opening name, focus on these principles: develop your pieces to active squares, control the center, ensure your king's safety, and look for tactical opportunities.";
      }

      this.showResult(openingInfo);
    }, 1000);
  }

  checkForTactics() {
    // Implementation from previous code...
    this.messageElement.textContent = "Looking for tactical opportunities...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      // Generate some sample tactics (in a real implementation, you'd analyze the board)
      const tactics = [
        "There's a potential fork with your knight on e5, attacking the king and rook simultaneously.",
        "Your bishop on c4 is pinning the knight to the queen. You could increase pressure on this pin.",
        "There's a discovered attack opportunity if you move your knight, revealing an attack from your bishop.",
        "Your opponent has a weak back rank. Look for checkmate opportunities there.",
        "There's a potential sacrifice on h7 that could lead to a strong attack."
      ];

      // Randomly select 1-3 tactics
      const numTactics = Math.floor(Math.random() * 3) + 1;
      const selectedTactics = this.shuffleArray(tactics).slice(0, numTactics);

      if (selectedTactics.length > 0) {
        let tacticsInfo = "Tactical opportunities:\n\n";
        selectedTactics.forEach((tactic, index) => {
          tacticsInfo += `${index + 1}. ${tactic}\n\n`;
        });

        this.showResult(tacticsInfo);
      } else {
        this.showResult("I don't see any immediate tactical opportunities in this position. This might be a good time to focus on improving your position, developing your pieces, or strengthening your pawn structure.");
      }
    }, 1200);
  }

  analyzeLastMove() {
    // Implementation from previous code...
    this.messageElement.textContent = "Analyzing the last move...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      let analysis = "";

      if (this.chessGame.moveHistory && this.chessGame.moveHistory.length > 0) {
        const lastMove = this.chessGame.moveHistory[this.chessGame.moveHistory.length - 1];

        // Format the move
        const moveNotation = this.formatMoveForDisplay(lastMove);

        analysis = `Last move: ${moveNotation}\n\n`;

        // Evaluate the move (simplified)
        const moveQualities = [
          "excellent! This move creates strong threats and improves your position.",
          "good. This move develops a piece and improves your control of the center.",
          "reasonable. This move neither gains nor loses significant advantage.",
          "questionable. There might have been better alternatives available.",
          "a mistake. This move weakens your position and gives your opponent opportunities."
        ];

        const randomQuality = moveQualities[Math.floor(Math.random() * moveQualities.length)];
        analysis += `This move appears to be ${randomQuality}\n\n`;

        // Add general advice
        analysis += "Remember to always check for:\n";
        analysis += "- Pieces under attack\n";
        analysis += "- Tactical opportunities\n";
        analysis += "- Development of your pieces\n";
        analysis += "- Control of the center\n";
        analysis += "- King safety";
      } else {
        analysis = "I don't see any moves in the game history to analyze. Make a move first, and then I can analyze it for you.";
      }

      this.showResult(analysis);
    }, 1000);
  }

  explainPatterns() {
    // Implementation from previous code...
    this.messageElement.textContent = "Identifying chess patterns...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      // Generate some sample patterns (in a real implementation, you'd analyze the board)
      const patterns = [
        {
          name: "Isolated Queen's Pawn",
          description: "You have a pawn on d4 with no friendly pawns on adjacent files. This can be both a strength and weakness."
        },
        {
          name: "Fianchettoed Bishop",
          description: "Your bishop is developed to g2/g7, controlling the long diagonal. This is a strong setup for controlling the center from a distance."
        },
        {
          name: "Open File for Rooks",
          description: "The c-file has no pawns, giving your rooks potential mobility and attacking chances."
        },
        {
          name: "Backward Pawn",
          description: "The pawn on d6 cannot be advanced safely and must be defended. This could become a target."
        },
        {
          name: "Knight Outpost",
          description: "Your knight on e5 is supported by a pawn and cannot be attacked by enemy pawns. This is a strong position."
        }
      ];

      // Randomly select 1-3 patterns
      const numPatterns = Math.floor(Math.random() * 3) + 1;
      const selectedPatterns = this.shuffleArray(patterns).slice(0, numPatterns);

      if (selectedPatterns.length > 0) {
        let patternsInfo = "Chess patterns in this position:\n\n";
        selectedPatterns.forEach((pattern, index) => {
          patternsInfo += `${pattern.name}: ${pattern.description}\n\n`;
        });

        this.showResult(patternsInfo);
      } else {
        this.showResult("I don't see any specific named patterns in this position. However, here are some general principles to consider:\n\n- Develop your pieces toward the center\n- Control the center with pawns and pieces\n- Castle early to ensure king safety\n- Connect your rooks by developing pieces between them\n- Avoid creating pawn weaknesses");
      }
    }, 1100);
  }

  suggestCounterMove() {
    // Implementation from previous code...
    this.messageElement.textContent = "Finding counter moves...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      // Check if we have a counter moves manager
      if (window.counterMovesManager) {
        // Try to get the last opponent move
        let lastOpponentMove = null;
        if (this.chessGame.moveHistory && this.chessGame.moveHistory.length > 0) {
          const moveHistory = this.chessGame.moveHistory;
          for (let i = moveHistory.length - 1; i >= 0; i--) {
            const move = moveHistory[i];
            if (move.piece && move.piece.color !== this.chessGame.currentPlayer) {
              lastOpponentMove = move;
              break;
            }
          }
        }

        if (lastOpponentMove) {
          // Format the move string
          const moveString = this.formatMoveToString(lastOpponentMove);

          // Try to get a counter move
          const counterMove = window.counterMovesManager.getCounterMove(moveString);

          if (counterMove) {
            const message = `Against ${this.formatAlgebraicMove(moveString)}, I recommend playing ${this.formatAlgebraicMove(counterMove)}.`;

            // Show options to make this move or get more information
            this.showResultWithOptions(message, [
              {
                name: "Make this move",
                action: () => this.makeMove(counterMove),
                description: "Apply the counter move to the board"
              },
              {
                name: "Explain why",
                action: () => this.explainCounterMove(moveString, counterMove),
                description: "Get an explanation for this counter move"
              },
              {
                name: "New options",
                action: () => this.generateOptions(),
                description: "Return to the main menu"
              }
            ]);
            return;
          }
        }
      }

      // Fallback if no counter move found
      this.showResult("I don't have a specific counter move for the current position. Try asking for a general move suggestion instead.");
    }, 1200);
  }

  provideEndgameTips() {
    // Implementation from previous code...
    this.messageElement.textContent = "Preparing endgame advice...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      const endgameTips = [
        "Activate your king in the endgame! Unlike the opening and middlegame, the king becomes a strong piece in the endgame.",
        "Create passed pawns whenever possible. A passed pawn (with no enemy pawns in front on the same or adjacent files) is a powerful asset.",
        "The opposition is crucial in king and pawn endgames. When kings face each other with one square between them, the player not having to move often has the advantage.",
        "Rooks belong behind passed pawns - either your own (to support them) or your opponent's (to stop them).",
        "Knights are stronger in closed positions with pawns on both sides, while bishops are stronger in open positions.",
        "Two bishops are often stronger than two knights or a bishop and knight, especially in open positions.",
        "Remember the 'square rule' for pawn endgames: if the king can move into the square formed by the pawn's path to promotion, it can catch the pawn.",
        "In rook endgames, cut off the enemy king with your rook to restrict its movement.",
        "Centralize your pieces in the endgame, especially the king and rooks."
      ];

      // Randomly select 3 tips
      const selectedTips = this.shuffleArray(endgameTips).slice(0, 3);

      let tipsMessage = "Endgame Tips:\n\n";
      selectedTips.forEach((tip, index) => {
        tipsMessage += `${index + 1}. ${tip}\n\n`;
      });

      this.showResult(tipsMessage);
    }, 1000);
  }

  explainOpeningPrinciples() {
    // Implementation from previous code...
    this.messageElement.textContent = "Preparing opening advice...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      const openingPrinciples = `Opening Principles:

1. Control the center - The four central squares (d4, d5, e4, e5) are crucial. Control them with pawns and pieces.

2. Develop your pieces - Get your knights and bishops out early, aiming toward the center.

3. Castle early - Protect your king by castling, usually within the first 7-10 moves.

4. Connect your rooks - Develop the pieces between your rooks to connect them.

5. Don't move the same piece multiple times - In the opening, focus on developing different pieces rather than moving the same piece repeatedly.

6. Don't bring your queen out too early - The queen can be attacked by less valuable pieces, forcing it to retreat and lose tempo.

7. Develop with purpose - Each move should contribute to your control of the center, piece development, or king safety.

8. Think about pawn structure - Avoid creating weaknesses in your pawn structure.`;

      this.showResult(openingPrinciples);
    }, 1000);
  }

  explainMove(move) {
    this.messageElement.textContent = "Analyzing move...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      const moveNotation = this.formatMoveForDisplay(move);

      // Get the current phase
      const currentPhase = this.determineGamePhase();

      let explanation = `Analysis of ${moveNotation}:\n\n`;

      // Add phase-specific explanation
      if (currentPhase === 'opening') {
        explanation += "Opening perspective:\n";
        explanation += "✓ This move helps control the center\n";
        explanation += "✓ It develops a piece toward an active square\n";
        explanation += "✓ It prepares for castling to ensure king safety\n\n";
      } else if (currentPhase === 'middlegame') {
        explanation += "Middlegame perspective:\n";
        explanation += "✓ This move creates threats your opponent must address\n";
        explanation += "✓ It improves your piece coordination\n";
        explanation += "✓ It targets weaknesses in your opponent's position\n\n";
      } else {
        explanation += "Endgame perspective:\n";
        explanation += "✓ This move activates your pieces\n";
        explanation += "✓ It creates or advances a passed pawn\n";
        explanation += "✓ It restricts your opponent's piece mobility\n\n";
      }

      // Add positional evaluation
      explanation += "Position evaluation after this move: +0.7 (slight advantage)\n\n";

      // Add potential follow-up
      explanation += "Potential follow-up: Look for opportunities to increase pressure on the kingside.";

      this.showResultWithOptions(explanation, [
        {
          name: "Make this move",
          action: () => this.makeMove(this.formatMoveToString(move)),
          description: "Apply the suggested move to the board"
        },
        {
          name: "Show alternatives",
          action: () => this.suggestMove(),
          description: "See other top moves in this position"
        },
        {
          name: "New options",
          action: () => this.generateOptions(),
          description: "Return to the main menu"
        }
      ]);
    }, 1000);
  }


  explainCounterMove(originalMove, counterMove) {
    // Implementation from previous code...
    this.messageElement.textContent = "Analyzing counter move...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      // Generate a random explanation (in a real implementation, you'd analyze the move)
      const explanations = [
        `This counter move has been successful in previous games against ${this.formatAlgebraicMove(originalMove)}.`,
        `Playing ${this.formatAlgebraicMove(counterMove)} neutralizes the threat created by your opponent's move.`,
        `This counter move maintains balance in the position and prevents your opponent from gaining an advantage.`,
        `${this.formatAlgebraicMove(counterMove)} is a strong response that creates counter-threats of your own.`,
        `This move has been played by strong players in similar positions with good results.`
      ];

      const explanation = explanations[Math.floor(Math.random() * explanations.length)];

      this.showResultWithOptions(explanation, [
        {
          name: "Make this move",
          action: () => this.makeMove(counterMove),
          description: "Apply the counter move to the board"
        },
        {
          name: "New options",
          action: () => this.generateOptions(),
          description: "Return to the main menu"
        }
      ]);
    }, 1000);
  }

  showAlternativeMoves() {
    // Implementation from previous code...
    this.messageElement.textContent = "Finding alternative moves...";
    this.optionsContainer.innerHTML = '';

    setTimeout(() => {
      // Generate some sample alternative moves (in a real implementation, you'd analyze the board)
      const alternatives = [
        { notation: "e2e4", description: "Advance the king's pawn to control the center" },
        { notation: "g1f3", description: "Develop the knight to a good square" },
        { notation: "f1c4", description: "Develop the bishop toward the center" },
        { notation: "e1g1", description: "Castle to ensure king safety" }
      ];

      // Randomly select 3 alternatives
      const selectedAlternatives = this.shuffleArray(alternatives).slice(0, 3);

      let alternativesMessage = "Alternative moves:\n\n";

      // Create option buttons for each alternative
      this.showResultWithOptions(alternativesMessage, selectedAlternatives.map((alt, index) => ({
        name: this.formatAlgebraicMove(alt.notation),
        action: () => this.makeMove(alt.notation),
        description: alt.description
      })));
    }, 1200);
  }

  showResult(message) {
    this.messageElement.textContent = message;
    this.optionsContainer.innerHTML = '';

    // Add a "Back" button
    const backButton = document.createElement('div');
    backButton.className = 'advice-option';
    backButton.innerHTML = `
      <div class="option-number">1</div>
      <div class="option-text">
        <strong>Back to options</strong>
        <div>Return to the main menu</div>
      </div>
    `;

    backButton.addEventListener('click', () => {
      this.generateOptions();
    });

    this.optionsContainer.appendChild(backButton);
  }

  showResultWithOptions(message, options) {
    this.messageElement.textContent = message;
    this.optionsContainer.innerHTML = '';

    // Create option elements
    options.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'advice-option';
      optionElement.innerHTML = `
        <div class="option-number">${index + 1}</div>
        <div class="option-text">
          <strong>${option.name}</strong>
          <div>${option.description}</div>
        </div>
      `;

      // Add click event
      optionElement.addEventListener('click', () => {
        option.action();
      });

      this.optionsContainer.appendChild(optionElement);
    });
  }

  makeMove(moveString) {
    if (!moveString || moveString.length !== 4) {
      this.showResult("Invalid move format. Please use the format 'e2e4'.");
      return;
    }

    try {
      // Parse the move string
      const files = 'abcdefgh';
      const fromCol = files.indexOf(moveString[0]);
      const fromRow = 8 - parseInt(moveString[1]);
      const toCol = files.indexOf(moveString[2]);
      const toRow = 8 - parseInt(moveString[3]);

      // Check if the move is valid
      if (fromCol < 0 || fromCol > 7 || fromRow < 0 || fromRow > 7 ||
        toCol < 0 || toCol > 7 || toRow < 0 || toRow > 7) {
        this.showResult("Invalid move coordinates.");
        return;
      }

      // Check if there's a piece at the from position
      if (!this.chessGame.board[fromRow][fromCol]) {
        this.showResult("There's no piece at the starting square.");
        return;
      }

      // Check if the piece belongs to the current player
      const piece = this.chessGame.board[fromRow][fromCol];
      if (piece.color !== this.chessGame.currentPlayer) {
        this.showResult(`It's ${this.chessGame.currentPlayer}'s turn to move.`);
        return;
      }

      // Check if the move is valid according to chess rules
      if (!this.chessGame.isValidMove(fromRow, fromCol, toRow, toCol)) {
        this.showResult("That's not a valid move for this piece.");
        return;
      }

      // Make the move
      this.chessGame.makeMove(fromRow, fromCol, toRow, toCol);

      // Show confirmation
      this.showResult(`Move ${this.formatAlgebraicMove(moveString)} has been made.`);

      // If playing against AI, trigger AI move after a delay
      if (this.chessGame.currentPlayer === this.chessGame.aiColor) {
        setTimeout(() => {
          if (this.chessGame.makeAIMove) {
            this.chessGame.makeAIMove();
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error making move:", error);
      this.showResult("Sorry, I couldn't make that move. There was an error.");
    }
  }

  formatMoveForDisplay(move) {
    if (!move) return 'unknown move';

    // If it's already a string, just return it
    if (typeof move === 'string') {
      return this.formatAlgebraicMove(move);
    }

    // If it has from and to properties
    if (move.from && move.to) {
      const files = 'abcdefgh';
      const fromFile = files[move.from.col];
      const fromRank = 8 - move.from.row;
      const toFile = files[move.to.col];
      const toRank = 8 - move.to.row;

      return `${fromFile}${fromRank} → ${toFile}${toRank}`;
    }

    // If it has notation property
    if (move.notation) {
      return move.notation;
    }

    return 'unknown move';
  }

  formatAlgebraicMove(moveString) {
    if (!moveString || moveString.length !== 4) return moveString;

    const fromFile = moveString[0];
    const fromRank = moveString[1];
    const toFile = moveString[2];
    const toRank = moveString[3];

    return `${fromFile}${fromRank} → ${toFile}${toRank}`;
  }

  formatMoveToString(move) {
    if (!move || !move.from || !move.to) return '';

    const files = 'abcdefgh';
    const fromFile = files[move.from.col];
    const fromRank = 8 - move.from.row;
    const toFile = files[move.to.col];
    const toRank = 8 - move.to.row;

    return `${fromFile}${fromRank}${toFile}${toRank}`;
  }

  // Method to notify the user about important events
  notifyUser(message) {
    // Flash the tutor button if the advice box is closed
    if (!this.isOpen) {
      this.flashTutorButton(message);
    } else {
      // If the advice box is open, show a message
      this.showResult(message);
    }
  }

  // Method to flash the tutor button with a message
  flashTutorButton(message) {
    if (!this.tutorButton) return;

    // Store original content
    const originalContent = this.tutorButton.innerHTML;

    // Update with message
    this.tutorButton.innerHTML = `<span>${message}</span>`;
    this.tutorButton.classList.add('flashing');

    // Restore after a few seconds
    setTimeout(() => {
      this.tutorButton.innerHTML = originalContent;
      this.tutorButton.classList.remove('flashing');
    }, 5000);
  }
}

// Initialize the Chess Advice Box when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait for the chess game to initialize
  setTimeout(() => {
    if (window.chessGame) {
      // Create the advice box
      window.chessAdviceBox = new ChessAdviceBox(window.chessGame);

      console.log("Chess Advice Box initialized with automatic dialog flow");

      // Set up event listeners for important game events
      document.addEventListener('checkmate', () => {
        if (window.chessAdviceBox) {
          window.chessAdviceBox.onCheckmate();
        }
      });

      document.addEventListener('stalemate', () => {
        if (window.chessAdviceBox) {
          window.chessAdviceBox.onStalemate();
        }
      });

      document.addEventListener('check', () => {
        if (window.chessAdviceBox) {
          window.chessAdviceBox.onCheck();
        }
      });

      document.addEventListener('game-start', () => {
        if (window.chessAdviceBox) {
          window.chessAdviceBox.onGameStart();
        }
      });

      // Listen for moves
      document.addEventListener('chess-move-made', (e) => {
        if (window.chessAdviceBox) {
          window.chessAdviceBox.onMoveMade(e.detail || {});
        }
      });
    }
  }, 1500);
});


// Initialize the Chess Advice Box when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait for the chess game to initialize
  setTimeout(() => {
    if (window.chessGame) {
      // Create the advice box
      window.chessAdviceBox = new ChessAdviceBox(window.chessGame);

      console.log("Chess Advice Box initialized");

      // Set up event listeners for important game events
      document.addEventListener('checkmate', () => {
        if (window.chessAdviceBox) {
          window.chessAdviceBox.notifyUser("Checkmate! The game is over.");
        }
      });

      document.addEventListener('stalemate', () => {
        if (window.chessAdviceBox) {
          window.chessAdviceBox.notifyUser("Stalemate! The game is a draw.");
        }
      });

      document.addEventListener('check', () => {
        if (window.chessAdviceBox) {
          window.chessAdviceBox.notifyUser("Check! Your king is under attack.");
        }
      });

      document.addEventListener('game-start', () => {
        if (window.chessAdviceBox) {
          window.chessAdviceBox.notifyUser("A new game has started! Need help?");
        }
      });
    }
  }, 1500);
});
