
import { MoveSequenceAnalyzer } from './movesequenceanalyzer.js';
import { PieceDepthChart } from './moveanalyzer.js';

export class EnhancedChess {
    constructor() {
        // Existing initialization code...

        // Enhanced opening book with comprehensive theory
        this.openingBook = this.initializeComprehensiveOpeningBook();

        // Opening preferences based on personality
        this.openingPreferences = {
            aggressive: ['King\'s Gambit', 'Sicilian Dragon', 'Smith-Morra Gambit', 'Evans Gambit'],
            defensive: ['Caro-Kann', 'French Defense', 'Queen\'s Gambit Declined', 'Berlin Defense'],
            positional: ['Queen\'s Gambit', 'Ruy Lopez', 'English Opening', 'Catalan'],
            tactical: ['Sicilian Najdorf', 'King\'s Indian', 'Grünfeld', 'Alekhine\'s Defense'],
            balanced: ['Semi-Slav', 'Nimzo-Indian', 'Queen\'s Indian', 'Giuoco Piano'],
            hypermodern: ['Réti Opening', 'King\'s Indian', 'Nimzo-Indian', 'Modern Defense'],
            dynamic: ['Sicilian Najdorf', 'Benoni', 'Dutch Defense', 'Benko Gambit']
        };

        // Game state
        this.board = [];
        this.currentPlayer = 'white';
        this.gameMode = 'standard';
        this.gameOver = false;
        this.selectedSquare = null;
        this.moveCount = 0; // Track game progress

        // Scores
        this.whiteScore = 0;
        this.blackScore = 0;
        this.moveHistory = [];

        // AI settings
        this.aiColor = 'black';
        this.humanColor = 'white';
        this.aiLevel = 3;
        this.aiThinking = false;
        this.aiThinkingMoves = [];
        this.positionsEvaluated = 0;
        this.prunedBranches = 0;
        this.centerLinePreference = true; // New setting for center line strategy
        this.showVisualizations = true;
        this.lastPlayerMove = null;
        this.pendingPromotion = null;
        // Opening knowledge depth by skill level

        // Opening knowledge depth by skill level - significantly increased for higher levels
        this.openingKnowledgeDepth = {
            1: 2,  // Beginner: knows only 2 moves deep
            2: 4,  // Novice: knows 4 moves deep
            3: 8,  // Amateur: knows 8 moves deep
            4: 14, // Intermediate: knows 14 moves deep
            5: 20, // Advanced: knows 20 moves deep
            6: 28, // Expert: knows 28 moves deep
            7: 40, // Grandmaster: knows 40 moves deep
            8: 50  // Super GM: knows 50 moves deep
        };
        // ENHANCED: AI skill levels with significantly increased difficulty progression
        this.skillLevels = {
            1: { name: 'Beginner', depth: 20, thinkTime: 1.0, mistakes: 0.7, accuracy: 40 },
            2: { name: 'Novice', depth: 120, thinkTime: 1.5, mistakes: 0.4, accuracy: 60 },
            3: { name: 'Amateur', depth: 400, thinkTime: 2.0, mistakes: 0.25, accuracy: 75 },
            4: { name: 'Intermediate', depth: 1200, thinkTime: 2.5, mistakes: 0.15, accuracy: 85 },
            5: { name: 'Advanced', depth: 1300, thinkTime: 3.5, mistakes: 0.07, accuracy: 93 },
            6: { name: 'Expert', depth: 1650, thinkTime: 6.5, mistakes: 0.05, accuracy: 95 },
            7: { name: 'Grandmaster', depth: 1900, thinkTime: 8.5, mistakes: 0.05, accuracy: 95 },
            8: { name: 'World GM', depth: 2500, thinkTime: 9.0, mistakes: 0.01, accuracy: 100 }
        };

        // Transposition awareness by skill level (0-1 scale)
        this.transpositionAwareness = {
            1: 0.2, // Beginner: barely recognizes transpositions
            2: 0.3, // Novice: limited recognition
            3: 0.4, // Amateur: moderate recognition
            4: 0.5, // Intermediate: good recognition
            5: 0.6, // Advanced: very good recognition
            6: 0.8, // Expert: excellent recognition
            7: 0.9, // Grandmaster: near-perfect recognition
            8: 1.0  // Super GM: perfect transposition awareness
        };

        // Trap knowledge by skill level
        this.trapKnowledge = {
            1: ['Scholar\'s Mate'], // Beginner: only knows the most basic trap
            2: ['Scholar\'s Mate', 'Légal Trap'], // Novice: knows a couple traps
            3: ['Scholar\'s Mate', 'Légal Trap', 'Fishing Pole'], // Amateur
            4: ['Scholar\'s Mate', 'Légal Trap', 'Fishing Pole', 'Blackburne Shilling Gambit'], // Intermediate
            5: ['Scholar\'s Mate', 'Légal Trap', 'Fishing Pole', 'Blackburne Shilling Gambit', 'Lasker Trap'], // Advanced
            6: ['Scholar\'s Mate', 'Légal Trap', 'Fishing Pole', 'Blackburne Shilling Gambit', 'Lasker Trap', 'Elephant Trap'], // Expert
            7: ['All common traps'], // Grandmaster: knows all common traps
            8: ['All traps'] // Super GM: knows all traps, even obscure ones
        };

        // AI personalities for varied play styles
        this.aiPersonalities = {
            aggressive: {
                name: 'Aggressive',
                description: 'Prefers attacks and captures',
                captureBonus: 1.5,
                centerBonus: 0.8,
                developmentBonus: 0.7,
                kingProtectionBonus: 0.6,
                pawnStructureBonus: 0.6,
                mobilityBonus: 1.2,
                attackBonus: 1.5,
                defenseBonus: 0.5,
                fianchettoBonus: 0.5,
                sacrificeBonus: 1.3
            },
            defensive: {
                name: 'Defensive',
                description: 'Focuses on protection and solid positions',
                captureBonus: 0.8,
                centerBonus: 0.9,
                developmentBonus: 1.0,
                kingProtectionBonus: 1.5,
                pawnStructureBonus: 1.3,
                mobilityBonus: 0.8,
                attackBonus: 0.6,
                defenseBonus: 1.5,
                fianchettoBonus: 0.8,
                sacrificeBonus: 0.4
            },
            positional: {
                name: 'Positional',
                description: 'Prioritizes piece development and board control',
                captureBonus: 0.9,
                centerBonus: 1.2,
                developmentBonus: 1.3,
                kingProtectionBonus: 1.0,
                pawnStructureBonus: 1.2,
                mobilityBonus: 1.1,
                attackBonus: 0.8,
                defenseBonus: 1.0,
                fianchettoBonus: 1.0,
                sacrificeBonus: 0.6
            },
            tactical: {
                name: 'Tactical',
                description: 'Looks for combinations and tactical opportunities',
                captureBonus: 1.2,
                centerBonus: 1.0,
                developmentBonus: 0.9,
                kingProtectionBonus: 0.8,
                pawnStructureBonus: 0.7,
                mobilityBonus: 1.3,
                attackBonus: 1.3,
                defenseBonus: 0.7,
                fianchettoBonus: 0.7,
                sacrificeBonus: 1.2
            },
            balanced: {
                name: 'Balanced',
                description: 'Plays a well-rounded game',
                captureBonus: 1.0,
                centerBonus: 1.0,
                developmentBonus: 1.0,
                kingProtectionBonus: 1.0,
                pawnStructureBonus: 1.0,
                mobilityBonus: 1.0,
                attackBonus: 1.0,
                defenseBonus: 1.0,
                fianchettoBonus: 1.0,
                sacrificeBonus: 1.0
            },
            hypermodern: {
                name: 'Hypermodern',
                description: 'Controls center from a distance with fianchettos',
                captureBonus: 0.9,
                centerBonus: 0.7,
                developmentBonus: 1.1,
                kingProtectionBonus: 1.1,
                pawnStructureBonus: 1.0,
                mobilityBonus: 1.2,
                attackBonus: 0.9,
                defenseBonus: 0.9,
                fianchettoBonus: 1.5,
                sacrificeBonus: 0.8
            },
            dynamic: {
                name: 'Dynamic',
                description: 'Seeks imbalanced positions with active piece play',
                captureBonus: 1.1,
                centerBonus: 1.0,
                developmentBonus: 1.2,
                kingProtectionBonus: 0.7,
                pawnStructureBonus: 0.8,
                mobilityBonus: 1.4,
                attackBonus: 1.2,
                defenseBonus: 0.6,
                fianchettoBonus: 0.9,
                sacrificeBonus: 1.4
            }
        };

        // Randomly select an AI personality for this game
        this.aiPersonality = this.getRandomPersonality();

        // Initialize opening repertoire based on personality
        this.initializeOpeningRepertoire();

        this.moveHistoryElement = document.getElementById('moveHistory');
        if (this.moveHistoryElement) {
            this.moveHistoryElement.innerHTML = '';
        }

        // Piece symbols
        this.pieceSymbols = {
            white_king: '♔', black_king: '♚',
            white_queen: '♕', black_queen: '♛',
            white_rook: '♖', black_rook: '♜',
            white_bishop: '♗', black_bishop: '♝',
            white_knight: '♘', black_knight: '♞',
            white_pawn: '♙', black_pawn: '♟'
        };

        // Piece values for scoring
        this.pieceValues = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000
        };

        // Piece colors for AI thinking visualization
        this.pieceColors = {
            pawn: '#8BC34A',
            knight: '#FF9800',
            bishop: '#9C27B0',
            rook: '#2196F3',
            queen: '#E91E63',
            king: '#FFD700'
        };

        // For tracking position repetition
        this.previousPositions = new Map();

        // Initialize game
        this.setupBoard();
        this.setupEventListeners();
        this.updateSkillDescription();
        this.renderBoard();
        this.updateGameStatus();
    }

    initializeHumanOpponent(myColor, matchId) {
        // Switch from AI to human opponent
        this.gameMode = 'human';
        this.humanColor = myColor;
        this.currentPlayer = 'white'; // White always starts
        this.matchId = matchId;

        // Reset the board
        this.setupBoard();
        this.renderBoard();
        this.updateGameStatus();

        // Show notification
        this.showNotification(`Playing against human opponent. You are ${myColor}.`, 3000);
    }

    initializeAIOpponent() {
        // Switch back to AI mode
        this.gameMode = 'ai';
        this.humanColor = 'white'; // Default to white against AI
        this.aiColor = 'black';
        this.currentPlayer = 'white';
        this.matchId = null;

        // Reset the board
        this.setupBoard();
        this.renderBoard();
        this.updateGameStatus();

        // Show notification
        this.showNotification('Playing against AI opponent', 3000);
    }

    processOpponentMove(moveData) {
        // Process a move from the human opponent
        const { from, to } = moveData;

        // Make the move
        this.makeMove(from.row, from.col, to.row, to.col);

        // Update game state
        this.currentPlayer = this.humanColor;
        this.renderBoard();
        this.updateGameStatus();

        // Check for game over
        if (this.isGameOver()) {
            this.gameOver = true;
            this.showGameOver(this.getGameOverMessage());

            // Notify matchmaker
            if (window.chessMatchmaker) {
                window.chessMatchmaker.endMatch('game_over');
            }
        }
    }

    // Select an AI personality for the current game
    selectAIPersonality() {
        // Get all available personalities
        const personalities = Object.keys(this.aiPersonalities);

        // Check if a preferred personality is specified in settings
        if (this.preferredPersonality && personalities.includes(this.preferredPersonality)) {
            console.log(`Using preferred personality: ${this.preferredPersonality}`);
            return this.aiPersonalities[this.preferredPersonality];
        }

        // Adjust personality selection based on skill level
        // Higher skill levels have more strategic personality selection
        if (this.aiLevel >= 6) {
            // Expert+ levels use strategic personality selection
            return this.selectStrategicPersonality();
        } else if (this.aiLevel >= 4) {
            // Intermediate+ levels use semi-random selection with preferences
            return this.selectSemiRandomPersonality();
        } else {
            // Lower levels use completely random selection
            return this.getRandomPersonality();
        }
    }

    // Force selection of a specific personality type
    setPreferredPersonality(personalityType) {
        if (this.aiPersonalities[personalityType]) {
            this.preferredPersonality = personalityType;
            this.aiPersonality = this.aiPersonalities[personalityType];

            // Initialize opening repertoire based on new personality
            this.initializeOpeningRepertoire();

            console.log(`Forced personality change to: ${personalityType}`);
            return true;
        }
        return false;
    }



    // Get a completely random personality
    getRandomPersonality() {
        const personalities = Object.keys(this.aiPersonalities);
        const randomIndex = Math.floor(Math.random() * personalities.length);
        const personalityKey = personalities[randomIndex];

        console.log(`AI is using ${this.aiPersonalities[personalityKey].name} personality (random selection)`);
        return this.aiPersonalities[personalityKey];
    }

    // Select a personality with some preferences based on game state
    selectSemiRandomPersonality() {
        const personalities = Object.keys(this.aiPersonalities);

        // Adjust weights based on game state
        const weights = {};

        // Default equal weights
        personalities.forEach(key => {
            weights[key] = 1;
        });

        // Adjust based on game phase
        if (this.gamePhase === 'opening') {
            // In opening, prefer positional and hypermodern styles
            weights['positional'] = 1.5;
            weights['hypermodern'] = 1.5;
            weights['balanced'] = 1.3;
        } else if (this.gamePhase === 'middlegame') {
            // In middlegame, prefer tactical and dynamic styles
            weights['tactical'] = 1.5;
            weights['dynamic'] = 1.5;
            weights['aggressive'] = 1.3;
        } else if (this.gamePhase === 'endgame') {
            // In endgame, prefer balanced and positional styles
            weights['balanced'] = 1.5;
            weights['positional'] = 1.5;
            weights['defensive'] = 1.3;
        }

        // Adjust based on material difference
        const materialDifference = this.evaluatePosition();
        if (materialDifference > 200) { // We're ahead
            // When ahead, prefer defensive and balanced styles
            weights['defensive'] *= 1.3;
            weights['balanced'] *= 1.2;
        } else if (materialDifference < -200) { // We're behind
            // When behind, prefer aggressive and tactical styles
            weights['aggressive'] *= 1.5;
            weights['tactical'] *= 1.4;
            weights['dynamic'] *= 1.3;
        }

        // Select personality based on weights
        const personalityKey = this.weightedRandomSelection(weights);

        console.log(`AI is using ${this.aiPersonalities[personalityKey].name} personality (semi-random selection)`);
        return this.aiPersonalities[personalityKey];
    }

    // Select a personality strategically based on game state and opponent history
    selectStrategicPersonality() {
        const personalities = Object.keys(this.aiPersonalities);

        // Start with base weights
        const weights = {};
        personalities.forEach(key => {
            weights[key] = 1;
        });

        // Analyze opponent's previous moves to determine their style
        const opponentStyle = this.analyzeOpponentStyle();

        // Counter opponent's style
        if (opponentStyle) {
            switch (opponentStyle) {
                case 'aggressive':
                    // Counter aggressive play with defensive or positional
                    weights['defensive'] = 2.0;
                    weights['positional'] = 1.8;
                    weights['balanced'] = 1.5;
                    break;

                case 'defensive':
                    // Counter defensive play with positional or hypermodern
                    weights['positional'] = 1.8;
                    weights['hypermodern'] = 1.7;
                    weights['dynamic'] = 1.5;
                    break;

                case 'positional':
                    // Counter positional play with tactical or dynamic
                    weights['tactical'] = 1.8;
                    weights['dynamic'] = 1.7;
                    weights['aggressive'] = 1.5;
                    break;

                case 'tactical':
                    // Counter tactical play with solid defensive or balanced
                    weights['defensive'] = 1.8;
                    weights['balanced'] = 1.7;
                    weights['positional'] = 1.5;
                    break;

                case 'balanced':
                    // Counter balanced play with slightly aggressive or dynamic
                    weights['aggressive'] = 1.5;
                    weights['dynamic'] = 1.5;
                    weights['hypermodern'] = 1.4;
                    break;

                case 'hypermodern':
                    // Counter hypermodern play with aggressive center control
                    weights['aggressive'] = 1.7;
                    weights['positional'] = 1.6;
                    weights['tactical'] = 1.5;
                    break;

                case 'dynamic':
                    // Counter dynamic play with solid positional or balanced
                    weights['positional'] = 1.7;
                    weights['balanced'] = 1.6;
                    weights['defensive'] = 1.5;
                    break;
            }
        }

        // Consider opening repertoire
        const currentOpening = this.identifyCurrentOpening();
        if (currentOpening) {
            // Adjust weights based on opening
            if (currentOpening.includes("Sicilian")) {
                weights['tactical'] *= 1.3;
                weights['aggressive'] *= 1.2;
            } else if (currentOpening.includes("French") || currentOpening.includes("Caro-Kann")) {
                weights['defensive'] *= 1.3;
                weights['positional'] *= 1.2;
            } else if (currentOpening.includes("Ruy Lopez") || currentOpening.includes("Italian")) {
                weights['positional'] *= 1.3;
                weights['balanced'] *= 1.2;
            } else if (currentOpening.includes("King's Indian") || currentOpening.includes("Grünfeld")) {
                weights['dynamic'] *= 1.3;
                weights['tactical'] *= 1.2;
            } else if (currentOpening.includes("English") || currentOpening.includes("Réti")) {
                weights['hypermodern'] *= 1.3;
                weights['positional'] *= 1.2;
            }
        }

        // Consider game phase
        if (this.gamePhase === 'opening') {
            // Slightly prefer personalities good for openings
            weights['positional'] *= 1.1;
            weights['hypermodern'] *= 1.1;
        } else if (this.gamePhase === 'middlegame') {
            // Slightly prefer personalities good for middlegames
            weights['tactical'] *= 1.1;
            weights['dynamic'] *= 1.1;
        } else if (this.gamePhase === 'endgame') {
            // Slightly prefer personalities good for endgames
            weights['balanced'] *= 1.1;
            weights['positional'] *= 1.1;
        }

        // Consider material difference
        const materialDifference = this.evaluatePosition();
        if (materialDifference > 300) { // We're ahead
            // When significantly ahead, prefer solid styles
            weights['defensive'] *= 1.2;
            weights['balanced'] *= 1.1;
        } else if (materialDifference < -300) { // We're behind
            // When significantly behind, prefer aggressive styles
            weights['aggressive'] *= 1.3;
            weights['tactical'] *= 1.2;
        }

        // Add small random factor for variety
        personalities.forEach(key => {
            weights[key] *= 0.9 + Math.random() * 0.2; // 0.9-1.1 random factor
        });

        // Select personality based on weights
        const personalityKey = this.weightedRandomSelection(weights);

        console.log(`AI is using ${this.aiPersonalities[personalityKey].name} personality (strategic selection)`);
        return this.aiPersonalities[personalityKey];
    }

    // Analyze opponent's style based on their moves
    analyzeOpponentStyle() {
        // Need at least a few moves to analyze
        if (this.moveHistory.length < 6) return null;

        // Get opponent's moves
        const opponentMoves = this.moveHistory.filter((move, index) => {
            return this.aiColor === 'white' ?
                index % 2 === 1 : // Black's moves (odd indices)
                index % 2 === 0;  // White's moves (even indices)
        });

        if (opponentMoves.length < 3) return null;

        // Count style indicators
        let aggressiveCount = 0;
        let defensiveCount = 0;
        let positionalCount = 0;
        let tacticalCount = 0;
        let hypermodernCount = 0;
        let dynamicCount = 0;

        // Analyze each move
        for (const move of opponentMoves) {
            // Check for captures (aggressive)
            if (move.captured) {
                aggressiveCount++;

                // Tactical captures of valuable pieces
                if (this.pieceValues[move.captured] >= this.pieceValues['knight']) {
                    tacticalCount++;
                }
            }

            // Check for center control (positional)
            const toCol = move.to.col;
            const toRow = move.to.row;
            if ((toCol === 3 || toCol === 4) && (toRow === 3 || toRow === 4)) {
                positionalCount++;
            }

            // Check for defensive moves (king safety, piece retreats)
            if (move.piece === 'king' || this.isMoveRetreat(move)) {
                defensiveCount++;
            }

            // Check for fianchetto (hypermodern)
            if (this.isFianchettoMove(move)) {
                hypermodernCount++;
            }

            // Check for dynamic pawn structure changes
            if (move.piece === 'pawn' && this.isStructuralChange(move)) {
                dynamicCount++;
            }
        }

        // Determine dominant style
        const styles = [
            { name: 'aggressive', count: aggressiveCount },
            { name: 'defensive', count: defensiveCount },
            { name: 'positional', count: positionalCount },
            { name: 'tactical', count: tacticalCount },
            { name: 'hypermodern', count: hypermodernCount },
            { name: 'dynamic', count: dynamicCount }
        ];

        // Sort by count (descending)
        styles.sort((a, b) => b.count - a.count);

        // Return dominant style if it's significantly higher than others
        if (styles[0].count > 0 && styles[0].count >= styles[1].count * 1.3) {
            return styles[0].name;
        }

        // If no clear dominant style, return balanced
        return 'balanced';
    }

    // Helper method to check if a move is a retreat
    isMoveRetreat(move) {
        const fromRow = move.from.row;
        const toRow = move.to.row;

        // For white, retreating means moving toward rank 8
        if (this.humanColor === 'white') {
            return fromRow < toRow;
        }
        // For black, retreating means moving toward rank 1
        else {
            return fromRow > toRow;
        }
    }

    // Helper method to check if a move changes pawn structure significantly
    isStructuralChange(move) {
        if (move.piece !== 'pawn') return false;

        // Pawn breaks, advances, or captures are structural changes
        return move.captured ||
            Math.abs(move.from.row - move.to.row) > 1 ||
            move.from.col !== move.to.col;
    }

    // Weighted random selection based on weights object
    weightedRandomSelection(weights) {
        // Calculate total weight
        let totalWeight = 0;
        for (const key in weights) {
            totalWeight += weights[key];
        }

        // Generate random value
        let random = Math.random() * totalWeight;

        // Find selected key
        for (const key in weights) {
            random -= weights[key];
            if (random <= 0) {
                return key;
            }
        }

        // Fallback to first key
        return Object.keys(weights)[0];
    }

    // Create a personality profile description for display
    createPersonalityProfile() {
        const personality = this.aiPersonality;
        if (!personality) return "Standard AI";

        let profile = `<strong>${personality.name} Style</strong><br>`;
        profile += `${personality.description}<br><br>`;

        // Add specific traits
        profile += "<strong>Traits:</strong><br>";

        // Convert numerical values to descriptive text
        const getTraitLevel = (value) => {
            if (value >= 1.3) return "Very High";
            if (value >= 1.1) return "High";
            if (value >= 0.9) return "Average";
            if (value >= 0.7) return "Low";
            return "Very Low";
        };

        // Add key traits
        profile += `• Aggression: ${getTraitLevel(personality.attackBonus)}<br>`;
        profile += `• Defense: ${getTraitLevel(personality.defenseBonus)}<br>`;
        profile += `• Positional Play: ${getTraitLevel(personality.centerBonus)}<br>`;
        profile += `• Risk Taking: ${getTraitLevel(personality.sacrificeBonus)}<br>`;

        // Add preferred openings
        if (this.currentRepertoire && this.currentRepertoire.length > 0) {
            profile += "<br><strong>Preferred Openings:</strong><br>";
            const openings = this.currentRepertoire.slice(0, 3); // Show top 3
            openings.forEach(opening => {
                profile += `• ${opening}<br>`;
            });
        }

        return profile;
    }

    // Display the AI's personality in the UI
    displayAIPersonality() {
        const personalityDisplay = document.getElementById('ai-personality');
        if (personalityDisplay) {
            personalityDisplay.innerHTML = this.createPersonalityProfile();
        }

        // Also update the personality icon
        this.updatePersonalityIcon();
    }

    // Update the personality icon in the UI
    updatePersonalityIcon() {
        const iconElement = document.getElementById('personality-icon');
        if (!iconElement || !this.aiPersonality) return;

        // Set icon based on personality
        let iconClass = 'fas ';
        switch (this.aiPersonality.name) {
            case 'Aggressive':
                iconClass += 'fa-fire';
                iconElement.style.color = '#e74c3c';
                break;
            case 'Defensive':
                iconClass += 'fa-shield-alt';
                iconElement.style.color = '#3498db';
                break;
            case 'Positional':
                iconClass += 'fa-chess-board';
                iconElement.style.color = '#2ecc71';
                break;
            case 'Tactical':
                iconClass += 'fa-bolt';
                iconElement.style.color = '#f39c12';
                break;
            case 'Balanced':
                iconClass += 'fa-balance-scale';
                iconElement.style.color = '#9b59b6';
                break;
            case 'Hypermodern':
                iconClass += 'fa-lightbulb';
                iconElement.style.color = '#1abc9c';
                break;
            case 'Dynamic':
                iconClass += 'fa-random';
                iconElement.style.color = '#e67e22';
                break;
            default:
                iconClass += 'fa-chess';
                iconElement.style.color = '#7f8c8d';
        }

        iconElement.className = iconClass;
    }

    // Evaluate pawn chain length
    evaluatePawnChain(row, col, color) {
        // This is a simplified implementation
        // In a real chess engine, you would recursively check for connected pawns

        let chainLength = 0;
        const direction = color === 'white' ? -1 : 1;

        // Check diagonally forward for chain
        const forwardRow = row + direction;
        if (forwardRow >= 0 && forwardRow < 8) {
            // Check left diagonal
            if (col > 0) {
                const leftDiag = this.board[forwardRow][col - 1];
                if (leftDiag && leftDiag.type === 'pawn' && leftDiag.color === color) {
                    chainLength++;
                }
            }

            // Check right diagonal
            if (col < 7) {
                const rightDiag = this.board[forwardRow][col + 1];
                if (rightDiag && rightDiag.type === 'pawn' && rightDiag.color === color) {
                    chainLength++;
                }
            }
        }

        return chainLength;
    }

    // Setup the chess board with pieces in starting positions
    setupBoard() {
        // Initialize empty board
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Reset game state
        this.currentPlayer = 'white';
        this.gameOver = false;
        this.selectedSquare = null;
        this.whiteScore = 0;
        this.blackScore = 0;
        this.moveHistory = [];
        this.aiThinking = false;
        this.aiThinkingMoves = [];
        this.positionsEvaluated = 0;
        this.prunedBranches = 0;

        // Reset move counter
        this.moveCount = 0;

        // Reset position repetition table
        this.previousPositions = new Map();

        // Select a new AI personality for this game
        this.aiPersonality = this.getRandomPersonality();
        console.log(`New game started with AI personality: ${this.aiPersonality.name}`);

        // Show notification about AI personality
        setTimeout(() => {
            if (this.showVisualizations) {
                this.showNotification(`AI is playing with ${this.aiPersonality.name} style`, 2000);
            }
        }, 500);

        // Setup standard chess board
        this.setupStandardBoard();

        // Initialize opening name display
        this.updateOpeningName();
    }

    // Setup standard chess board
    setupStandardBoard() {
        const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

        // White pieces (bottom)
        for (let col = 0; col < 8; col++) {
            this.board[7][col] = { type: backRank[col], color: 'white' };
            this.board[6][col] = { type: 'pawn', color: 'white' };
        }

        // Black pieces (top)
        for (let col = 0; col < 8; col++) {
            this.board[0][col] = { type: backRank[col], color: 'black' };
            this.board[1][col] = { type: 'pawn', color: 'black' };
        }
    }

    // Render the chess board
    renderBoard() {
        const boardElement = document.getElementById('chessBoard');
        if (!boardElement) {
            console.error('Chess board element not found!');
            return;
        }

        boardElement.innerHTML = '';

        // Check if either king is in check
        const whiteInCheck = this.isInCheck('white');
        const blackInCheck = this.isInCheck('black');

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                // Add click event listener
                square.addEventListener('click', () => {
                    this.handleSquareClick(row, col);
                });

                // Add piece if present
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}`;

                    // Highlight king in check
                    if (piece.type === 'king') {
                        if ((piece.color === 'white' && whiteInCheck) ||
                            (piece.color === 'black' && blackInCheck)) {
                            pieceElement.classList.add('in-check');
                            square.classList.add('in-check');
                            square.style.backgroundColor = 'red'; // Add this line for red background
                        }
                    }

                    pieceElement.textContent = this.pieceSymbols[`${piece.color}_${piece.type}`];
                    square.appendChild(pieceElement);
                }

                boardElement.appendChild(square);
            }
        }

        // Show AI thinking if active
        if (this.aiThinking) {
            this.showAIThinking();
        }

        // Highlight selected square and valid moves
        this.highlightSelectedSquare();
        this.showValidMoves();

        // Update game status to show check
        if (whiteInCheck || blackInCheck) {
            const statusElement = document.getElementById('turn-indicator');
            if (statusElement) {
                const checkColor = whiteInCheck ? 'White' : 'Black';
                statusElement.innerHTML = `<strong>${checkColor} is in CHECK!</strong>`;
                statusElement.style.color = '#f44336';
            }
        }
    }

    // Handle square clickthis.lastPlayerMove = null;

    // Modify your handleSquareClick method to track the last player move
    // Find this section in your handleSquareClick method:
    handleSquareClick(row, col) {
        if (this.gameOver || this.aiThinking) return;
        if (this.currentPlayer !== this.humanColor) return;

        const clickedPiece = this.board[row][col];

        if (this.selectedSquare) {
            const selectedPiece = this.board[this.selectedSquare.row][this.selectedSquare.col];

            // Try to make a move
            if (this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
                // Analyze the move before making it
                this.analyzePlayerMove(this.selectedSquare.row, this.selectedSquare.col, row, col);

                // Store the player's move before executing it
                this.lastPlayerMove = {
                    from: { row: this.selectedSquare.row, col: this.selectedSquare.col },
                    to: { row, col }
                };

                // Make the move
                this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
                this.selectedSquare = null;

                // Increment move counter
                this.moveCount++;

                // After a successful move, if playing against human opponent
                if (this.gameMode === 'human' && this.matchId) {
                    // Record the move for the opponent to see
                    if (window.chessMatchmaker) {
                        window.chessMatchmaker.recordMove({
                            from: { row: this.selectedSquare.row, col: this.selectedSquare.col },
                            to: { row, col }
                        });
                    }
                }
                // Update game phase
                this.updateGamePhase();

                // Add position to repetition table
                const positionSignature = this.getPositionSignature();
                const repetitionCount = this.previousPositions.get(positionSignature) || 0;
                this.previousPositions.set(positionSignature, repetitionCount + 1);

                // Switch to AI turn
                this.currentPlayer = this.aiColor;

                // Update display
                this.renderBoard();
                this.updateGameStatus();

                // Check for game over
                if (this.isGameOver()) {
                    this.gameOver = true;
                    this.showGameOver(this.getGameOverMessage());
                    return;
                }

                // Trigger AI move
                setTimeout(() => {
                    this.makeAIMove();
                }, 500);
            } else {
                // If clicking on own piece, select it instead
                if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                    this.selectedSquare = { row, col };
                } else {
                    this.selectedSquare = null;
                }
            }
        } else {
            // Select a piece
            if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                this.selectedSquare = { row, col };
            }
        }

        this.renderBoard();
    }

    // Update the makeMove method to check for pawn promotion
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        // Check for pawn promotion BEFORE making the move
        if (piece.type === 'pawn' && (
            (piece.color === 'white' && toRow === 0) ||
            (piece.color === 'black' && toRow === 7)
        )) {
            // Handle pawn promotion
            this.showPromotionDialog(fromRow, fromCol, toRow, toCol, capturedPiece);
            return;
        }

        // Regular move handling
        // Record move for history
        const notation = this.getMoveNotation(fromRow, fromCol, toRow, toCol, piece, capturedPiece);

        // Make the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Update scores for captures
        if (capturedPiece) {
            const points = this.pieceValues[capturedPiece.type] || 0;
            if (piece.color === 'white') {
                this.whiteScore += points;
            } else {
                this.blackScore += points;
            }
        }

        // Add to move history
        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece.type,
            captured: capturedPiece?.type,
            notation: notation
        });

        // Update displays
        this.updateMoveHistory();
        this.updateScoreDisplay();
        this.updateOpeningName();
    }

    // Show promotion dialog
    showPromotionDialog(fromRow, fromCol, toRow, toCol, capturedPiece) {
        // Create modal for promotion selection
        const modal = document.createElement('div');
        modal.id = 'promotion-dialog';
        modal.className = 'promotion-modal';

        const pieceColor = this.board[fromRow][fromCol].color;

        modal.innerHTML = `
        <div class="promotion-modal-content">
            <h3>Choose a piece for promotion</h3>
            <div class="promotion-options">
                <div class="promotion-option" data-piece="queen">
                    ${pieceColor === 'white' ? '♕' : '♛'}
                </div>
                <div class="promotion-option" data-piece="rook">
                    ${pieceColor === 'white' ? '♖' : '♜'}
                </div>
                <div class="promotion-option" data-piece="bishop">
                    ${pieceColor === 'white' ? '♗' : '♝'}
                </div>
                <div class="promotion-option" data-piece="knight">
                    ${pieceColor === 'white' ? '♘' : '♞'}
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(modal);

        // Store promotion data for later use
        this.pendingPromotion = {
            fromRow,
            fromCol,
            toRow,
            toCol,
            capturedPiece
        };

        // Add event listeners to promotion options
        const options = modal.querySelectorAll('.promotion-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                const pieceType = option.getAttribute('data-piece');
                this.completePawnPromotion(pieceType);
                modal.remove();
            });
        });
    }

    // Update the opening name display
    updateOpeningName() {
        const openingNameElement = document.getElementById('openingName');
        if (!openingNameElement) return;

        // Identify the current opening
        const openingName = this.identifyCurrentOpening();

        // Update the display
        if (openingName) {
            openingNameElement.textContent = openingName;
        } else {
            openingNameElement.textContent = "Standard Position";
        }
    }

    isKingInCheck(color) {
        return this.isInCheck(color);
    }

    /**
     * Checks if the specified color is in checkmate.
     * @param {string} color - The color to check ('white' or 'black')
     * @returns {boolean} True if the specified color is in checkmate
     */
    isCheckmate(color) {
        // If the king is not in check, it's not checkmate
        if (!this.isKingInCheck(color)) {
            return false;
        }

        // Check if any legal move can get the king out of check
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === color) {
                    // Try all possible moves for this piece
                    for (let tr = 0; tr < 8; tr++) {
                        for (let tc = 0; tc < 8; tc++) {
                            if (this.isValidMove(r, c, tr, tc)) {
                                // Make the move temporarily
                                const originalTarget = this.board[tr][tc];
                                this.board[tr][tc] = piece;
                                this.board[r][c] = null;

                                // Check if the king is still in check
                                const stillInCheck = this.isKingInCheck(color);

                                // Undo the move
                                this.board[r][c] = piece;
                                this.board[tr][tc] = originalTarget;

                                // If this move gets the king out of check, it's not checkmate
                                if (!stillInCheck) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
        // If no move can get the king out of check, it's checkmate
        return true;
    }

    // Complete the pawn promotion with the selected piece
// In enhancedchess.js, fix the completePawnPromotion method:
completePawnPromotion(promotionPiece) {
    if (!this.pendingPromotion) return;

    const { fromRow, fromCol, toRow, toCol, capturedPiece } = this.pendingPromotion;
    const pawn = this.board[fromRow][fromCol];

    // Create the promoted piece
    const promotedPiece = {
        type: promotionPiece,
        color: pawn.color
    };

    // Record move for history with promotion notation
    const files = 'abcdefgh';
    const fromFile = files[fromCol];
    const toSquare = files[toCol] + (8 - toRow);
    let notation = '';

    if (capturedPiece) {
        notation = `${fromFile}x${toSquare}=${promotionPiece.charAt(0).toUpperCase()}`;
    } else {
        notation = `${toSquare}=${promotionPiece.charAt(0).toUpperCase()}`;
    }

    // Make the move with the promoted piece
    this.board[toRow][toCol] = promotedPiece;
    this.board[fromRow][fromCol] = null;

    // Update scores for captures
    if (capturedPiece) {
        const points = this.pieceValues[capturedPiece.type] || 0;
        if (pawn.color === 'white') {
            this.whiteScore += points;
        } else {
            this.blackScore += points;
        }
    }

    // Add bonus points for promotion
    const promotionBonus = this.pieceValues[promotionPiece] - this.pieceValues['pawn'];
    if (pawn.color === 'white') {
        this.whiteScore += promotionBonus;
    } else {
        this.blackScore += promotionBonus;
    }

    // Add to move history
    this.moveHistory.push({
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece: 'pawn',
        promotion: promotionPiece,
        captured: capturedPiece?.type,
        notation: notation
    });

    // Clear pending promotion
    this.pendingPromotion = null;

    // Update displays
    this.updateMoveHistory();
    this.updateScoreDisplay();
    this.renderBoard();

    // Show notification
    this.showNotification(`Pawn promoted to ${promotionPiece}!`, 2000);

    // Switch turns
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    this.updateGameStatus();

    // Check for game over
    if (this.isGameOver()) {
        this.gameOver = true;
        this.showGameOver(this.getGameOverMessage());
        return;
    }

    // If playing against AI and it's AI's turn, make AI move
    if (this.gameMode === 'ai' && this.currentPlayer === this.aiColor) {
        setTimeout(() => this.makeAIMove(), 500);
    }
}


    // Check if a move is valid
    isValidMove(fromRow, fromCol, toRow, toCol) {
        // Check bounds
        if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;

        const piece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];

        // Can't move empty square
        if (!piece) return false;

        // Can't move opponent's piece
        if (piece.color !== this.currentPlayer) return false;

        // Can't capture own piece
        if (targetPiece && targetPiece.color === piece.color) return false;

        // Check piece-specific movement rules
        let validMove = false;
        switch (piece.type) {
            case 'pawn':
                validMove = this.isValidPawnMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'rook':
                validMove = this.isValidRookMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'knight':
                validMove = this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'bishop':
                validMove = this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'queen':
                validMove = this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'king':
                validMove = this.isValidKingMove(fromRow, fromCol, toRow, toCol);
                break;
            default:
                validMove = false;
        }

        // If the move is valid according to piece rules, check if it would leave the king in check
        if (validMove) {
            // Check if this move would leave or put own king in check
            if (this.wouldBeInCheck(fromRow, fromCol, toRow, toCol, piece.color)) {
                return false; // Can't make a move that leaves own king in check
            }
        }

        return validMove;
    }

    // Piece movement validation methods
    isValidPawnMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const targetPiece = this.board[toRow][toCol];

        // Forward move (can only move to empty squares)
        if (fromCol === toCol && !targetPiece) {
            // One square forward
            if (toRow === fromRow + direction) {
                return true;
            }
            // Two squares from start
            if (fromRow === startRow && toRow === fromRow + 2 * direction &&
                !this.board[fromRow + direction][fromCol]) { // Check if path is clear
                return true;
            }
        }

        // Diagonal capture
        if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
            // Can only capture diagonally if there's a piece there
            if (targetPiece) {
                return true;
            }
        }

        return false;
    }

    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        // Must move in straight line
        if (fromRow !== toRow && fromCol !== toCol) return false;

        // Check path is clear
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);

        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        // Must move diagonally
        if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;

        // Check path is clear
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol) ||
            this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
    }

    isValidKingMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);

        return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;

        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol] !== null) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }

        return true;
    }

    // Enhanced makeAIMove with opening theory integration
    // Enhanced makeAIMove with opening theory integration
    // Enhanced makeAIMove with stronger play at higher levels
    makeAIMove() {
        if (this.gameOver || this.currentPlayer !== this.aiColor) return;

        this.aiThinking = true;
        const skillLevel = this.skillLevels[this.aiLevel];

        // Reset counters for visualization
        this.positionsEvaluated = 0;
        this.prunedBranches = 0;

        // Show thinking status
        this.updateThinkingStatus(true);

        // Update game phase
        this.updateGamePhase();

        // Show thinking timer
        this.showAITimer(skillLevel.thinkTime);

        // Start thinking visualization
        this.startAIThinkingVisualization(skillLevel);

        // ENHANCED: Simulate AI thinking process with multiple depth levels
        setTimeout(async () => {
            let bestMove = null;

            // First, check for opening traps we can set or avoid
            if (this.moveCount < 15) {
                bestMove = this.checkForOpeningTraps();
                if (bestMove) {
                    console.log("Setting or avoiding an opening trap");
                }
            }

            // Check opening book if in opening phase
            if (!bestMove && this.gamePhase === 'opening' && this.moveCount < 20) {
                bestMove = this.getMoveFromOpeningBook();
                if (bestMove) {
                    console.log("Using opening book move");
                }
            }

            // If no book move, calculate best move
            if (!bestMove) {
                // For higher levels, use deeper search and less randomness
                const searchDepth = this.aiLevel >= 6 ? skillLevel.depth + 1 : skillLevel.depth;

                // Find best move with enhanced visualization
                bestMove = this.findBestMoveWithVisualization(this.aiColor, searchDepth);
            }

            if (bestMove) {
                // Apply skill-based mistakes (less likely at higher levels)
                let finalMove = bestMove;

                // Only make mistakes if not in check and not a critical position
                // Higher levels (6-7) almost never make mistakes in critical positions
                const inCheck = this.isInCheck(this.aiColor);
                const isCriticalPosition = inCheck || this.isPositionCritical();

                const mistakeChance = isCriticalPosition && this.aiLevel >= 6 ?
                    skillLevel.mistakes * 0.2 : // 80% less likely to make mistakes in critical positions at high levels
                    skillLevel.mistakes;

                if (!inCheck && Math.random() < mistakeChance) {
                    const allMoves = this.getAllPossibleMoves(this.aiColor);
                    if (allMoves.length > 1) {
                        // Choose a suboptimal move, but not completely random
                        // Sort moves by score and pick from top portion based on level
                        const scoredMoves = allMoves.map(move => ({
                            move,
                            score: this.quickEvaluateMove(move)
                        })).sort((a, b) => b.score - a.score);

                        // Higher levels make better "mistakes" (from top moves only)
                        const topPortion = this.aiLevel >= 5 ? 0.3 : // Top 30% for advanced+
                            this.aiLevel >= 3 ? 0.5 : // Top 50% for amateur+
                                0.7; // Top 70% for beginners

                        const topMoveCount = Math.max(1, Math.floor(scoredMoves.length * topPortion));
                        const randomIndex = Math.floor(Math.random() * topMoveCount);
                        finalMove = scoredMoves[randomIndex].move;

                        console.log("Making a slight inaccuracy for realistic play");
                    }
                }

                // Dispatch counter move event if we have the last player move
                if (this.lastPlayerMove && finalMove) {
                    const formatMoveToString = (move) => {
                        const files = 'abcdefgh';
                        const fromFile = files[move.from.col];
                        const fromRank = 8 - move.from.row;
                        const toFile = files[move.to.col];
                        const toRank = 8 - move.to.row;
                        return `${fromFile}${fromRank}${toFile}${toRank}`;
                    };

                    const event = new CustomEvent('chess-ai-counter-move', {
                        detail: {
                            opponentMove: formatMoveToString(this.lastPlayerMove),
                            counterMove: formatMoveToString(finalMove)
                        }
                    });
                    document.dispatchEvent(event);
                }

                // Execute the move
                this.executeAIMove(finalMove);
            } else {
                this.aiThinking = false;
                this.hideAITimer();
                this.updateThinkingStatus(false);
            }
        }, skillLevel.thinkTime * 1000);
    }

    // Check if the current position is critical (material exchange, tactical situation)
    isPositionCritical() {
        // This is a simplified implementation
        // In a real chess engine, you would use more sophisticated detection

        // Check if any piece is under attack
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.aiColor) {
                    // Check if this piece is attacked by opponent
                    if (this.isSquareAttacked(row, col, this.humanColor)) {
                        // If a valuable piece is under attack, it's critical
                        if (piece.type === 'queen' || piece.type === 'rook' ||
                            (this.aiLevel >= 5 && (piece.type === 'bishop' || piece.type === 'knight'))) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }


    // ENHANCED: Find best move with visualization and increased variety
    findBestMoveWithVisualization(color, maxDepth) {
        const moves = this.getAllPossibleMoves(color);
        if (moves.length === 0) return null;

        // Check if we're in check - if so, prioritize getting out of check
        const inCheck = this.isInCheck(color);
        if (inCheck) {
            console.log(`${color} is in CHECK! Prioritizing escape moves.`);
            // Highlight the check status in the UI
            this.showNotification(`${color.toUpperCase()} is in CHECK!`, 2000);
            document.querySelector('.thinking-status').textContent = `${color.toUpperCase()} is in CHECK! Finding escape moves...`;
            document.querySelector('.thinking-status').style.color = '#f44336';
        }

        // Sort moves for better visualization (captures first)
        moves.sort((a, b) => {
            // If in check, prioritize moves that get out of check
            if (inCheck) {
                const moveAEscapesCheck = !this.wouldBeInCheck(a.from.row, a.from.col, a.to.row, a.to.col, color);
                const moveBEscapesCheck = !this.wouldBeInCheck(b.from.row, b.from.col, b.to.row, b.to.col, color);

                if (moveAEscapesCheck && !moveBEscapesCheck) return -1;
                if (!moveAEscapesCheck && moveBEscapesCheck) return 1;
            }

            const scoreA = this.quickMoveScore(a);
            const scoreB = this.quickMoveScore(b);
            return color === 'white' ? scoreB - scoreA : scoreA - scoreB;
        });

        // Evaluate each move with increasing depth for visualization
        const evaluatedMoves = [];

        // First show quick evaluations at depth 1
        for (const move of moves) {
            // Add some randomness to initial evaluation
            const randomFactor = (Math.random() * 20) - 10; // Random value between -10 and +10
            const score = this.evaluateMoveWithLookahead(move, 1) + randomFactor;
            evaluatedMoves.push({ move, score, depth: 1 });
        }

        // Sort and display initial evaluations
        this.sortAndDisplayEvaluations(evaluatedMoves, color, 1);

        // Get the requested depth array from the UI or use default progressive deepening
        const depthArray = this.getRequestedDepthArray(maxDepth);

        // Process each depth level in the array
        for (const depth of depthArray) {
            if (depth <= 1) continue; // Skip depth 1 as we already did it

            // Calculate how many moves to evaluate at this depth
            const topMovesToEvaluate = Math.max(3, Math.ceil(moves.length / (depth * 0.7)));

            // Sort by current scores
            evaluatedMoves.sort((a, b) => {
                // If in check, prioritize moves that get out of check
                if (inCheck) {
                    const moveAEscapesCheck = !this.wouldBeInCheck(
                        a.move.from.row, a.move.from.col, a.move.to.row, a.move.to.col, color
                    );
                    const moveBEscapesCheck = !this.wouldBeInCheck(
                        b.move.from.row, b.move.from.col, b.move.to.row, b.move.to.col, color
                    );

                    if (moveAEscapesCheck && !moveBEscapesCheck) return -1;
                    if (!moveAEscapesCheck && moveBEscapesCheck) return 1;
                }

                return color === 'white' ? b.score - a.score : a.score - b.score;
            });

            // Evaluate top moves at this depth
            for (let i = 0; i < topMovesToEvaluate && i < evaluatedMoves.length; i++) {
                const moveData = evaluatedMoves[i];
                // Add small random factor to encourage variety
                const randomFactor = (Math.random() * 10) - 5; // Random value between -5 and +5
                const newScore = this.evaluateMoveWithLookahead(moveData.move, depth) + randomFactor;
                moveData.score = newScore;
                moveData.depth = depth;

                // Update visualization after each deep evaluation
                if (i % 2 === 0 || i === topMovesToEvaluate - 1) {
                    this.sortAndDisplayEvaluations(evaluatedMoves, color, depth);
                }
            }

            // Final update for this depth
            this.sortAndDisplayEvaluations(evaluatedMoves, color, depth);
        }

        // Get the best moves (top 3)
        evaluatedMoves.sort((a, b) => {
            // If in check, prioritize moves that get out of check
            if (inCheck) {
                const moveAEscapesCheck = !this.wouldBeInCheck(
                    a.move.from.row, a.move.from.col, a.move.to.row, a.move.to.col, color
                );
                const moveBEscapesCheck = !this.wouldBeInCheck(
                    b.move.from.row, b.move.from.col, b.move.to.row, b.move.to.col, color
                );

                if (moveAEscapesCheck && !moveBEscapesCheck) return -1;
                if (!moveAEscapesCheck && moveBEscapesCheck) return 1;
            }

            return color === 'white' ? b.score - a.score : a.score - b.score;
        });

        // Final visualization with the best move
        this.sortAndDisplayEvaluations(evaluatedMoves, color, depthArray[depthArray.length - 1], true);

        // Reset check notification
        if (inCheck) {
            document.querySelector('.thinking-status').style.color = '';
        }

        // Select from top moves with weighted randomness
        // This adds variety while still favoring better moves
        const topMoves = evaluatedMoves.slice(0, Math.min(5, evaluatedMoves.length));

        // If in check, prioritize moves that escape check
        if (inCheck) {
            const escapeMoves = topMoves.filter(moveData =>
                !this.wouldBeInCheck(
                    moveData.move.from.row,
                    moveData.move.from.col,
                    moveData.move.to.row,
                    moveData.move.to.col,
                    color
                )
            );

            if (escapeMoves.length > 0) {
                // Randomly select from escape moves
                return this.weightedRandomChoice(escapeMoves);
            }
        }

        // Not in check or no escape moves found
        return this.weightedRandomChoice(topMoves);
    }

    // Helper method for weighted random selection - stronger for higher levels
    weightedRandomChoice(moveDataArray) {
        if (moveDataArray.length === 0) return null;
        if (moveDataArray.length === 1) return moveDataArray[0].move;

        // For highest levels, just pick the best move most of the time
        if (this.aiLevel >= 6 && Math.random() < 0.8) {
            return moveDataArray[0].move;
        }

        // Calculate total weight (higher scores = higher weights)
        let totalWeight = 0;
        const weights = [];

        // Normalize scores to positive values
        const minScore = Math.min(...moveDataArray.map(md => md.score));
        const normalizedScores = moveDataArray.map(md => md.score - minScore + 1);

        // Calculate weights based on normalized scores
        // Higher levels use more aggressive weighting to prefer better moves
        const exponent = this.aiLevel >= 5 ? 2.5 :
            this.aiLevel >= 3 ? 1.8 : 1.5;

        for (let i = 0; i < normalizedScores.length; i++) {
            // Use exponential weighting to favor better moves
            const weight = Math.pow(normalizedScores[i], exponent);
            weights.push(weight);
            totalWeight += weight;
        }

        // Select a random value based on weights
        let random = Math.random() * totalWeight;

        // Find the selected move
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return moveDataArray[i].move;
            }
        }

        // Fallback to best move if something goes wrong
        return moveDataArray[0].move;
    }


    // Get requested depth array from UI or generate default
    getRequestedDepthArray(maxDepth) {
        // Check if custom depth array is specified in the UI
        const depthInput = document.getElementById('depth-array');
        if (depthInput && depthInput.value) {
            try {
                // Parse the input as a comma-separated list of depths
                const depthArray = depthInput.value.split(',')
                    .map(d => parseInt(d.trim()))
                    .filter(d => !isNaN(d) && d > 0 && d <= 10); // Limit max depth to 10 for safety

                if (depthArray.length > 0) {
                    return depthArray;
                }
            } catch (e) {
                console.error('Error parsing depth array:', e);
            }
        }

        // Default progressive deepening
        const depthArray = [];
        for (let depth = 1; depth <= maxDepth; depth++) {
            depthArray.push(depth);
        }
        return depthArray;
    }

    // Sort and display move evaluations
    sortAndDisplayEvaluations(evaluatedMoves, color, currentDepth, isFinal = false) {
        // Sort by score
        evaluatedMoves.sort((a, b) => {
            return color === 'white' ? b.score - a.score : a.score - b.score;
        });

        // Update the AI thinking visualization
        this.aiThinkingMoves = evaluatedMoves.slice(0, 5).map(moveData => ({
            from: moveData.move.from,
            to: moveData.move.to,
            piece: moveData.move.piece,
            score: moveData.score,
            depth: moveData.depth
        }));

        // Update the move evaluations display
        this.updateMoveEvaluationsDisplay(evaluatedMoves, currentDepth, isFinal);

        // Update the strength bars
        this.updateStrengthBars(evaluatedMoves, color);

        // Update search stats
        document.getElementById('positions-evaluated').textContent = this.positionsEvaluated;
        document.getElementById('search-depth').textContent = currentDepth;
        document.getElementById('pruned-branches').textContent = this.prunedBranches;

        // Render the board to show thinking
        this.renderBoard();
    }

    // Update move evaluations display
    updateMoveEvaluationsDisplay(evaluatedMoves, currentDepth, isFinal) {
        const moveEvaluationsElement = document.getElementById('move-evaluations');
        if (!moveEvaluationsElement) return;

        // Clear previous evaluations
        moveEvaluationsElement.innerHTML = '';

        // Show top moves (up to 8)
        const movesToShow = evaluatedMoves.slice(0, 8);

        movesToShow.forEach((moveData, index) => {
            const { move, score, depth } = moveData;
            const moveElement = document.createElement('div');
            moveElement.className = `move-evaluation ${index === 0 ? 'best' : ''}`;

            // Format the score with + sign for positive values
            const formattedScore = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);

            // Get algebraic notation
            const from = this.getSquareName(move.from.row, move.from.col);
            const to = this.getSquareName(move.to.row, move.to.col);

            moveElement.innerHTML = `
                <span>${move.piece.type.charAt(0).toUpperCase()}${from}-${to}</span>
                <span>${formattedScore}</span>
                <span>${depth}</span>
            `;

            moveEvaluationsElement.appendChild(moveElement);
        });

        // Update thinking status
        const thinkingStatus = document.querySelector('.thinking-status');
        if (thinkingStatus) {
            if (isFinal) {
                thinkingStatus.textContent = `Analysis complete at depth ${currentDepth}`;
                thinkingStatus.classList.remove('active');
            } else {
                thinkingStatus.textContent = `Analyzing at depth ${currentDepth}...`;
            }
        }
    }

    // Update strength bars
    updateStrengthBars(evaluatedMoves, color) {
        const strengthBarsElement = document.getElementById('column-strength-bars');
        if (!strengthBarsElement) return;

        // Clear previous bars
        strengthBarsElement.innerHTML = '';

        // Find min and max scores for scaling
        let minScore = Infinity;
        let maxScore = -Infinity;

        evaluatedMoves.forEach(moveData => {
            minScore = Math.min(minScore, moveData.score);
            maxScore = Math.max(maxScore, moveData.score);
        });

        // Ensure we have a reasonable range
        const range = Math.max(200, maxScore - minScore);

        // Group moves by starting column for visualization
        const columnMoves = {};

        evaluatedMoves.forEach(moveData => {
            const col = moveData.move.from.col;
            if (!columnMoves[col] || moveData.score > columnMoves[col].score) {
                columnMoves[col] = moveData;
            }
        });

        // Create bars for each column
        for (let col = 0; col < 8; col++) {
            const barContainer = document.createElement('div');
            barContainer.className = 'strength-bar-container';

            const bar = document.createElement('div');
            bar.className = 'strength-bar';

            const moveData = columnMoves[col];

            if (moveData) {
                // Normalize score to 0-100 range for height
                const normalizedScore = ((moveData.score - minScore) / range) * 100;
                const height = Math.max(5, normalizedScore); // Minimum 5% height

                bar.style.height = `${height}%`;

                // Color based on score
                if (moveData.score > 0) {
                    bar.classList.add('positive');
                } else if (moveData.score < 0) {
                    bar.classList.add('negative');
                }

                // Highlight best/worst moves
                if (moveData.score === maxScore) {
                    bar.classList.add('best');
                } else if (moveData.score === minScore) {
                    bar.classList.add('worst');
                }

                // Add score label
                const scoreLabel = document.createElement('div');
                scoreLabel.className = 'strength-bar-value';
                scoreLabel.textContent = moveData.score.toFixed(1);
                bar.appendChild(scoreLabel);
            } else {
                // No moves from this column
                bar.style.height = '5%';
                bar.style.opacity = '0.3';
            }

            // Add column label
            const colLabel = document.createElement('div');
            colLabel.className = 'strength-bar-label';
            colLabel.textContent = String.fromCharCode(97 + col); // a-h
            bar.appendChild(colLabel);

            barContainer.appendChild(bar);
            strengthBarsElement.appendChild(barContainer);
        }
    }

    // Add this to the executeAIMove method
    executeAIMove(move) {
        // Clear thinking state
        this.aiThinking = false;
        this.aiThinkingMoves = [];
        this.hideAITimer();
        this.updateThinkingStatus(false);

        // Check if this is a pawn promotion move
        const piece = this.board[move.from.row][move.from.col];
        if (piece && piece.type === 'pawn' && (
            (piece.color === 'white' && move.to.row === 0) ||
            (piece.color === 'black' && move.to.row === 7)
        )) {
            // AI always promotes to queen
            const capturedPiece = this.board[move.to.row][move.to.col];

            // Create the promoted piece
            const promotedPiece = {
                type: 'queen',
                color: piece.color
            };

            // Make the move with the promoted piece
            this.board[move.to.row][move.to.col] = promotedPiece;
            this.board[move.from.row][move.from.col] = null;

            // Record move for history with promotion notation
            const files = 'abcdefgh';
            const fromFile = files[move.from.col];
            const toSquare = files[move.to.col] + (8 - move.to.row);
            let notation = '';

            if (capturedPiece) {
                notation = `${fromFile}x${toSquare}=Q`;
            } else {
                notation = `${toSquare}=Q`;
            }

            // Add to move history
            this.moveHistory.push({
                from: { row: move.from.row, col: move.from.col },
                to: { row: move.to.row, col: move.to.col },
                piece: 'pawn',
                promotion: 'queen',
                captured: capturedPiece?.type,
                notation: notation
            });

            // Show notification
            this.showNotification(`AI promoted pawn to queen!`, 2000);
        } else {
            // Regular move
            this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
        }

        // Increment move counter
        this.moveCount++;

        // Update game phase
        this.updateGamePhase();

        // Add position to repetition table
        const positionSignature = this.getPositionSignature();
        const repetitionCount = this.previousPositions.get(positionSignature) || 0;
        this.previousPositions.set(positionSignature, repetitionCount + 1);

        // Update opening name display
        this.updateOpeningName();

        // Occasionally change AI personality for more variety (10% chance after move 10)
        if (this.moveCount > 10 && Math.random() < 0.1) {
            const oldPersonality = this.aiPersonality.name;
            this.aiPersonality = this.getRandomPersonality();

            // Only show notification if personality actually changed
            if (oldPersonality !== this.aiPersonality.name) {
                console.log(`AI changed strategy to ${this.aiPersonality.name}`);

                // Show subtle notification about AI changing strategy
                if (this.showVisualizations) {
                    this.showNotification(`AI adapts its strategy...`, 1500);
                }
            }
        }

        // Switch turns
        this.currentPlayer = this.humanColor;

        // Update display
        this.renderBoard();
        this.updateGameStatus();

        // Check for game over
        if (this.isGameOver()) {
            this.gameOver = true;
            this.showGameOver(this.getGameOverMessage());
        }
    }


    // Update thinking status
    updateThinkingStatus(isThinking) {
        const thinkingStatus = document.querySelector('.thinking-status');
        if (thinkingStatus) {
            if (isThinking) {
                thinkingStatus.textContent = 'AI is thinking...';
                thinkingStatus.classList.add('active');
            } else {
                thinkingStatus.textContent = 'AI is idle';
                thinkingStatus.classList.remove('active');
            }
        }
    }

    // Show AI thinking timer
    showAITimer(duration) {
        const timerValue = document.getElementById('timerValue');
        const timerProgress = document.querySelector('.timer-progress');

        if (timerValue && timerProgress) {
            let remaining = duration;

            // Clear any existing timer
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }

            // Start new timer
            this.timerInterval = setInterval(() => {
                remaining -= 0.1;

                timerValue.textContent = remaining.toFixed(1) + 's';

                const progress = (duration - remaining) / duration;
                const dashOffset = 283 * (1 - progress);
                timerProgress.style.strokeDashoffset = dashOffset;

                // Change color based on remaining time
                if (remaining <= duration * 0.3) {
                    timerProgress.style.stroke = '#f44336'; // Red
                } else if (remaining <= duration * 0.6) {
                    timerProgress.style.stroke = '#FF9800'; // Orange
                } else {
                    timerProgress.style.stroke = '#4CAF50'; // Green
                }

                if (remaining <= 0) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
            }, 100);
        }
    }

    // Hide AI timer
    hideAITimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Start AI thinking visualization
    startAIThinkingVisualization(skillLevel) {
        const allMoves = this.getAllPossibleMoves(this.aiColor);
        const updateInterval = (skillLevel.thinkTime * 1000) / 20;

        let updateCount = 0;
        const maxUpdates = 20;

        const thinkingInterval = setInterval(() => {
            if (!this.aiThinking || updateCount >= maxUpdates) {
                clearInterval(thinkingInterval);
                return;
            }

            // Simulate AI considering different moves
            this.aiThinkingMoves = this.simulateAIThinking(allMoves, updateCount, maxUpdates);
            this.renderBoard();

            updateCount++;
        }, updateInterval);
    }

    // Simulate AI thinking for visualization
    simulateAIThinking(allMoves, updateCount, maxUpdates) {
        const progress = updateCount / maxUpdates;
        const numMovesToShow = Math.min(6, Math.max(1, Math.floor(allMoves.length * (1 - progress * 0.7))));

        // Evaluate moves and sort by quality
        const evaluatedMoves = allMoves.map(move => {
            const score = this.quickEvaluateMove(move);
            return { ...move, score };
        }).sort((a, b) => {
            return this.aiColor === 'white' ? b.score - a.score : a.score - b.score;
        });

        // Add some randomness to simulate thinking process
        const thinkingMoves = [];
        for (let i = 0; i < numMovesToShow; i++) {
            if (i < evaluatedMoves.length) {
                let moveIndex = i;
                if (progress < 0.5 && Math.random() < 0.3) {
                    moveIndex = Math.min(evaluatedMoves.length - 1, i + Math.floor(Math.random() * 3));
                }
                thinkingMoves.push(evaluatedMoves[moveIndex]);
            }
        }

        return thinkingMoves;
    }

    // Quick evaluation of a move for visualization
    quickEvaluateMove(move) {
        // Make temporary move
        const originalPiece = this.board[move.to.row][move.to.col];
        this.board[move.to.row][move.to.col] = this.board[move.from.row][move.from.col];
        this.board[move.from.row][move.from.col] = null;

        let score = this.evaluatePosition();

        // Bonus for captures
        if (originalPiece) {
            score += (this.aiColor === 'white' ? 1 : -1) * (this.pieceValues[originalPiece.type] || 0);
        }

        // Undo temporary move
        this.board[move.from.row][move.from.col] = this.board[move.to.row][move.to.col];
        this.board[move.to.row][move.to.col] = originalPiece;

        return score;
    }

    // ENHANCED: Evaluate move with lookahead
    evaluateMoveWithLookahead(move, depth) {
        // Increment positions evaluated counter
        this.positionsEvaluated++;

        // Make temporary move
        const originalPiece = this.board[move.to.row][move.to.col];
        const movingPiece = this.board[move.from.row][move.from.col];

        // Apply move
        this.board[move.to.row][move.to.col] = movingPiece;
        this.board[move.from.row][move.from.col] = null;

        // Calculate immediate bonus for this move
        let immediateBonus = this.calculateImmediateBonus(move, originalPiece);

        // Use alpha-beta for deeper evaluation
        let futureScore = 0;
        if (depth > 1) {
            futureScore = this.alphaBeta(
                depth - 1,
                movingPiece.color === 'white' ? 'black' : 'white',
                -Infinity,
                Infinity,
                movingPiece.color === 'white' ? false : true
            );
        }

        // Restore board
        this.board[move.from.row][move.from.col] = movingPiece;
        this.board[move.to.row][move.to.col] = originalPiece;

        // Weight immediate benefits more than future potential
        const totalScore = immediateBonus * 1.5 + futureScore;

        return totalScore;
    }

    // Calculate immediate bonus for a move with personality influence
    calculateImmediateBonus(move, capturedPiece) {
        let bonus = 0;
        const piece = this.board[move.to.row][move.to.col];
        const personality = this.aiPersonality;
        const colorMultiplier = piece.color === 'white' ? 1 : -1;

        // Bonus for captures - influenced by personality
        if (capturedPiece) {
            const captureValue = this.pieceValues[capturedPiece.type] || 0;
            // Apply personality's capture preference
            const captureBonus = captureValue * personality.captureBonus;
            bonus += captureBonus * colorMultiplier;
        }

        // Center control bonus - influenced by personality
        const centerBonus = this.calculateCenterBonus(move) * personality.centerBonus;
        bonus += centerBonus * colorMultiplier;

        // Development bonus for knights and bishops
        if ((piece.type === 'knight' || piece.type === 'bishop') && this.moveCount < 15) {
            // Moving knights and bishops out in the opening is good
            if (piece.color === 'white' && move.from.row === 7 && move.to.row < 7) {
                bonus += 30 * personality.developmentBonus;
            } else if (piece.color === 'black' && move.from.row === 0 && move.to.row > 0) {
                bonus -= 30 * personality.developmentBonus;
            }
        }

        // King safety bonus
        if (piece.type === 'king') {
            // Early game - penalize moving the king too much
            if (this.moveCount < 15) {
                bonus -= 20 * colorMultiplier;
            }

            // Bonus for castling-like moves
            if (Math.abs(move.from.col - move.to.col) === 2) {
                bonus += 50 * personality.kingProtectionBonus * colorMultiplier;
            }

            // Evaluate king safety in the new position
            const kingSafetyBonus = this.evaluateKingPositionAfterMove(move) * personality.kingProtectionBonus;
            bonus += kingSafetyBonus * colorMultiplier;
        }

        // Pawn advancement bonus - increases with distance
        if (piece.type === 'pawn') {
            const advancementBonus = piece.color === 'white' ?
                (7 - move.to.row) * 5 :
                move.to.row * 5;

            // Extra bonus for pawns nearing promotion
            if ((piece.color === 'white' && move.to.row <= 1) ||
                (piece.color === 'black' && move.to.row >= 6)) {
                bonus += 50 * colorMultiplier;
            }

            bonus += advancementBonus * colorMultiplier;

            // Bonus for pawn structure improvements
            const pawnStructureBonus = this.evaluatePawnMoveStructure(move) * personality.pawnStructureBonus;
            bonus += pawnStructureBonus * colorMultiplier;

            // In the opening, bonus for central pawn moves
            if (this.gamePhase === 'opening') {
                if ((move.to.col === 3 || move.to.col === 4) &&
                    (move.to.row === 3 || move.to.row === 4)) {
                    bonus += 20 * colorMultiplier;
                }
            }
        }

        // Mobility bonus - pieces that gain mobility
        const mobilityBonus = this.evaluateMobilityChange(move) * personality.mobilityBonus;
        bonus += mobilityBonus * colorMultiplier;

        // Attack bonus - moves that create threats
        const attackBonus = this.evaluateAttackPotential(move) * personality.attackBonus;
        bonus += attackBonus * colorMultiplier;

        // Defense bonus - moves that defend pieces
        const defenseBonus = this.evaluateDefensePotential(move) * personality.defenseBonus;
        bonus += defenseBonus * colorMultiplier;

        // Opening theory bonuses
        if (this.gamePhase === 'opening') {
            // Penalize early queen moves
            if (piece.type === 'queen' && this.moveCount < 8) {
                bonus -= 25 * colorMultiplier;
            }

            // Bonus for developing toward the center
            if ((piece.type === 'knight' || piece.type === 'bishop') &&
                (move.to.col >= 2 && move.to.col <= 5) &&
                (move.to.row >= 2 && move.to.row <= 5)) {
                bonus += 15 * colorMultiplier;
            }

            // Bonus for moves that enable castling
            if (this.moveEnablesCastling(move)) {
                bonus += 20 * colorMultiplier;
            }
        }

        // Special personality-specific bonuses
        if (personality.name === 'Hypermodern' && this.isFianchettoMove(move)) {
            bonus += 30 * personality.fianchettoBonus * colorMultiplier;
        }

        if (personality.name === 'Dynamic' && this.isSacrificeMove(move, capturedPiece)) {
            bonus += 40 * personality.sacrificeBonus * colorMultiplier;
        }

        // Add randomness based on move count for more variety
        // More randomness in the opening and less in the endgame
        const randomFactor = Math.random() * 20 - 10; // -10 to +10
        const randomnessWeight = Math.max(0, 30 - this.moveCount) / 30; // Decreases as game progresses
        bonus += randomFactor * randomnessWeight * colorMultiplier;

        return bonus;
    }

    // Calculate center control bonus
    calculateCenterBonus(move) {
        let bonus = 0;

        // Bonus for controlling center columns (c, d, e, f)
        if (move.to.col >= 2 && move.to.col <= 5) {
            bonus += 20;

            // Extra bonus for the very center (d, e)
            if (move.to.col >= 3 && move.to.col <= 4) {
                bonus += 15;
            }
        }

        // Bonus for center rows (3, 4, 5, 6)
        if (move.to.row >= 2 && move.to.row <= 5) {
            bonus += 10;

            // Extra bonus for the very center rows (4, 5)
            if (move.to.row >= 3 && move.to.row <= 4) {
                bonus += 10;
            }
        }

        return bonus;
    }

    // Check if a move enables castling
    moveEnablesCastling(move) {
        const piece = this.board[move.to.row][move.to.col];

        // Only relevant for knights and bishops
        if (piece.type !== 'knight' && piece.type !== 'bishop') {
            return false;
        }

        // Check if this is a developing move from the back rank
        if ((piece.color === 'white' && move.from.row === 7) ||
            (piece.color === 'black' && move.from.row === 0)) {

            // Check if king and rook are still in place
            const backRow = piece.color === 'white' ? 7 : 0;
            const kingPiece = this.board[backRow][4];
            const kingsideRook = this.board[backRow][7];
            const queensideRook = this.board[backRow][0];

            if (kingPiece && kingPiece.type === 'king' && kingPiece.color === piece.color) {
                // King is still in place, check if this move clears the way for castling
                if (kingsideRook && kingsideRook.type === 'rook' && kingsideRook.color === piece.color) {
                    // Check if this move clears the way for kingside castling
                    if (move.from.col > 4 && move.from.col < 7) {
                        return true;
                    }
                }

                if (queensideRook && queensideRook.type === 'rook' && queensideRook.color === piece.color) {
                    // Check if this move clears the way for queenside castling
                    if (move.from.col > 0 && move.from.col < 4) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // Check if a move is a fianchetto (for hypermodern style)
    isFianchettoMove(move) {
        const piece = this.board[move.to.row][move.to.col];

        // Fianchetto is placing a bishop on the long diagonal
        if (piece.type === 'bishop') {
            // White bishop fianchetto positions
            if (piece.color === 'white' &&
                ((move.to.row === 6 && move.to.col === 1) || // b2
                    (move.to.row === 6 && move.to.col === 6))) { // g2
                return true;
            }

            // Black bishop fianchetto positions
            if (piece.color === 'black' &&
                ((move.to.row === 1 && move.to.col === 1) || // b7
                    (move.to.row === 1 && move.to.col === 6))) { // g7
                return true;
            }
        }

        return false;
    }

    // Check if a move is a sacrifice (for dynamic style)
    isSacrificeMove(move, capturedPiece) {
        // If we're capturing, it's not a sacrifice
        if (capturedPiece) return false;

        const piece = this.board[move.to.row][move.to.col];

        // Check if the piece is moving to a square that's attacked by opponent pawns
        const opponentColor = piece.color === 'white' ? 'black' : 'white';

        // Check if the destination square is attacked
        if (this.isSquareAttacked(move.to.row, move.to.col, opponentColor)) {
            // It's a sacrifice if we're putting a valuable piece in danger
            return piece.type === 'queen' || piece.type === 'rook' ||
                piece.type === 'bishop' || piece.type === 'knight';
        }

        return false;
    }

    // Check if a square is attacked by a specific color
    isSquareAttacked(row, col, attackerColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === attackerColor) {
                    if (this.isValidMoveIgnoreCheck(r, c, row, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Evaluate king position after a move
    evaluateKingPositionAfterMove(move) {
        // This is a placeholder - in a real implementation, you would evaluate
        // king safety factors like pawn shield, nearby defenders, etc.
        return 0;
    }

    // Evaluate pawn structure changes from a move
    evaluatePawnMoveStructure(move) {
        // This is a placeholder - in a real implementation, you would evaluate
        // factors like isolated pawns, doubled pawns, pawn chains, etc.
        return 0;
    }

    // Evaluate mobility change from a move
    evaluateMobilityChange(move) {
        // This is a placeholder - in a real implementation, you would calculate
        // the difference in mobility before and after the move
        return 0;
    }

    // Evaluate attack potential of a move
    evaluateAttackPotential(move) {
        // This is a placeholder - in a real implementation, you would evaluate
        // factors like threats created, pieces attacked, etc.
        return 0;
    }

    // Evaluate defensive potential of a move
    evaluateDefensePotential(move) {
        // This is a placeholder - in a real implementation, you would evaluate
        // factors like pieces defended, threats countered, etc.
        return 0;
    }

    // Update game phase based on material and move count
    updateGamePhase() {
        // Count material to determine game phase
        let totalMaterial = 0;
        let pieceCount = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type !== 'king') {
                    totalMaterial += this.pieceValues[piece.type];
                    pieceCount++;
                }
            }
        }

        // Determine game phase
        if (this.moveCount < 10 || totalMaterial > 6000) {
            this.gamePhase = 'opening';
        } else if (pieceCount < 10 || totalMaterial < 3000) {
            this.gamePhase = 'endgame';
        } else {
            this.gamePhase = 'middlegame';
        }
    }

    // Get position signature for repetition detection
    getPositionSignature() {
        // Simple implementation - in a real chess engine, you would use Zobrist hashing
        let signature = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    signature += `${row}${col}${piece.type[0]}${piece.color[0]}`;
                }
            }
        }

        signature += this.currentPlayer[0]; // Add current player

        return signature;
    }

    // Alpha-Beta Pruning Algorithm
    alphaBeta(depth, color, alpha, beta, isMaximizing) {
        // Base case: reached depth limit or game over
        if (depth === 0) {
            return this.evaluatePosition();
        }

        const moves = this.getAllPossibleMoves(color);
        if (moves.length === 0) {
            return this.evaluatePosition();
        }

        // Sort moves for better pruning
        moves.sort((a, b) => {
            const scoreA = this.quickMoveScore(a);
            const scoreB = this.quickMoveScore(b);
            return isMaximizing ? scoreB - scoreA : scoreA - scoreB;
        });

        if (isMaximizing) {
            let maxEvaluation = -Infinity;

            for (const move of moves) {
                // Make temporary move
                const originalPiece = this.board[move.to.row][move.to.col];
                const movingPiece = this.board[move.from.row][move.from.col];

                // Apply move
                this.board[move.to.row][move.to.col] = movingPiece;
                this.board[move.from.row][move.from.col] = null;

                // Recurse
                this.positionsEvaluated++;
                const evaluation = this.alphaBeta(
                    depth - 1,
                    color === 'white' ? 'black' : 'white',
                    alpha,
                    beta,
                    false
                );

                // Restore board
                this.board[move.from.row][move.from.col] = movingPiece;
                this.board[move.to.row][move.to.col] = originalPiece;

                maxEvaluation = Math.max(maxEvaluation, evaluation);
                alpha = Math.max(alpha, evaluation);

                // Alpha-beta pruning
                if (beta <= alpha) {
                    this.prunedBranches++;
                    break; // Beta cutoff
                }
            }

            return maxEvaluation;
        } else {
            let minEvaluation = Infinity;

            for (const move of moves) {
                // Make temporary move
                const originalPiece = this.board[move.to.row][move.to.col];
                const movingPiece = this.board[move.from.row][move.from.col];

                // Apply move
                this.board[move.to.row][move.to.col] = movingPiece;
                this.board[move.from.row][move.from.col] = null;

                // Recurse
                this.positionsEvaluated++;
                const evaluation = this.alphaBeta(
                    depth - 1,
                    color === 'white' ? 'black' : 'white',
                    alpha,
                    beta,
                    true
                );

                // Restore board
                this.board[move.from.row][move.from.col] = movingPiece;
                this.board[move.to.row][move.to.col] = originalPiece;

                minEvaluation = Math.min(minEvaluation, evaluation);
                beta = Math.min(beta, evaluation);

                // Alpha-beta pruning
                if (beta <= alpha) {
                    this.prunedBranches++;
                    break; // Alpha cutoff
                }
            }

            return minEvaluation;
        }
    }

    // Quick move scoring for move ordering (improves pruning)
    quickMoveScore(move) {
        let score = 0;

        const targetPiece = this.board[move.to.row][move.to.col];

        // Prioritize captures
        if (targetPiece) {
            score += this.pieceValues[targetPiece.type] || 0;
        }

        // Prioritize moves toward center
        const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
        score += (7 - centerDistance) * 10;

        return score;
    }

    // Get all possible moves for a color
    getAllPossibleMoves(color) {
        const moves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const pieceMoves = this.getPieceValidMoves(row, col);
                    moves.push(...pieceMoves);
                }
            }
        }

        return moves;
    }

    // Get valid moves for a piece
    getPieceValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const moves = [];

        // Check all possible destination squares
        for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
                if (this.isValidMove(row, col, toRow, toCol)) {
                    moves.push({
                        from: { row, col },
                        to: { row: toRow, col: toCol },
                        piece: piece
                    });
                }
            }
        }

        return moves;
    }

    // Get a random AI personality
    getRandomPersonality() {
        const personalities = Object.keys(this.aiPersonalities);
        const randomIndex = Math.floor(Math.random() * personalities.length);
        const personalityKey = personalities[randomIndex];

        console.log(`AI is using ${this.aiPersonalities[personalityKey].name} personality`);
        return this.aiPersonalities[personalityKey];
    }

    // Position evaluation with personality influence
    // Position evaluation with personality influence and stronger strategic play at higher levels
    evaluatePosition() {
        let score = 0;
        let materialScore = 0;
        let positionalScore = 0;
        let developmentScore = 0;
        let kingProtectionScore = 0;
        let centerControlScore = 0;
        let mobilityScore = 0;
        let pawnStructureScore = 0;

        // Count developed pieces for each side
        let whiteDevelopedPieces = 0;
        let blackDevelopedPieces = 0;

        // Track king protection
        let whiteKingProtection = 0;
        let blackKingProtection = 0;

        // Track center control
        let whiteCenterControl = 0;
        let blackCenterControl = 0;

        // Track mobility
        let whiteMobility = 0;
        let blackMobility = 0;

        // Track pawn structure
        let whitePawnStructure = 0;
        let blackPawnStructure = 0;

        // Find kings
        let whiteKingPos = null;
        let blackKingPos = null;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (!piece) continue;

                const pieceValue = this.pieceValues[piece.type] || 0;
                const multiplier = piece.color === 'white' ? 1 : -1;

                // Material score
                materialScore += pieceValue * multiplier;

                // Positional bonuses
                positionalScore += this.getPositionalBonus(piece, row, col) * multiplier;

                // Track kings
                if (piece.type === 'king') {
                    if (piece.color === 'white') {
                        whiteKingPos = { row, col };
                    } else {
                        blackKingPos = { row, col };
                    }
                }

                // Development score - pieces moved from starting positions
                if (piece.color === 'white') {
                    if ((piece.type === 'knight' || piece.type === 'bishop') && row < 6) {
                        whiteDevelopedPieces++;
                    }
                } else {
                    if ((piece.type === 'knight' || piece.type === 'bishop') && row > 1) {
                        blackDevelopedPieces++;
                    }
                }

                // Center control - count attacks on center squares
                if (this.aiLevel >= 4) { // Only higher levels evaluate this deeply
                    const centerSquares = [
                        { row: 3, col: 3 }, { row: 3, col: 4 },
                        { row: 4, col: 3 }, { row: 4, col: 4 }
                    ];

                    for (const square of centerSquares) {
                        if (this.canAttackFromTo(row, col, square.row, square.col)) {
                            if (piece.color === 'white') {
                                whiteCenterControl++;
                            } else {
                                blackCenterControl++;
                            }
                        }
                    }
                }

                // Mobility - count legal moves for each piece
                if (this.aiLevel >= 5) { // Only higher levels evaluate mobility
                    const moves = this.getPieceValidMoves(row, col);
                    if (piece.color === 'white') {
                        whiteMobility += moves.length;
                    } else {
                        blackMobility += moves.length;
                    }
                }

                // Pawn structure - evaluate at higher levels
                if (this.aiLevel >= 6 && piece.type === 'pawn') {
                    const structureScore = this.evaluatePawnStructure(row, col, piece.color);
                    if (piece.color === 'white') {
                        whitePawnStructure += structureScore;
                    } else {
                        blackPawnStructure += structureScore;
                    }
                }
            }
        }

        // Calculate king protection
        if (whiteKingPos) {
            whiteKingProtection = this.evaluateKingProtection(whiteKingPos, 'white');
        }

        if (blackKingPos) {
            blackKingProtection = this.evaluateKingProtection(blackKingPos, 'black');
        }

        // Development score
        developmentScore = (whiteDevelopedPieces - blackDevelopedPieces) * 15;

        // King protection score
        kingProtectionScore = (whiteKingProtection - blackKingProtection) * 10;

        // Center control score
        centerControlScore = (whiteCenterControl - blackCenterControl) * 8;

        // Mobility score
        mobilityScore = (whiteMobility - blackMobility) * 2;

        // Pawn structure score
        pawnStructureScore = (whitePawnStructure - blackPawnStructure) * 5;

        // Apply personality modifiers
        const personality = this.aiPersonality;

        // Calculate final score with personality weights
        score = materialScore * (this.aiColor === 'white' ? personality.captureBonus : 1) +
            positionalScore * personality.centerBonus +
            developmentScore * personality.developmentBonus +
            kingProtectionScore * personality.kingProtectionBonus;

        // Add advanced evaluation components for higher levels
        if (this.aiLevel >= 4) {
            score += centerControlScore * personality.centerBonus;
        }

        if (this.aiLevel >= 5) {
            score += mobilityScore * personality.mobilityBonus;
        }

        if (this.aiLevel >= 6) {
            score += pawnStructureScore * personality.pawnStructureBonus;
        }

        // Game phase adjustments
        if (this.moveCount < 10) {
            // Early game: emphasize development and center control
            score += developmentScore * 0.5;
            score += centerControlScore * 0.5;
        } else if (this.moveCount > 30) {
            // Late game: emphasize material and king safety
            score += materialScore * 0.3;
            score += kingProtectionScore * 0.3;
        }

        return score;
    }

    // Check if a piece can attack from one square to another
    canAttackFromTo(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;

        // Simple check based on piece type
        switch (piece.type) {
            case 'pawn':
                // Pawns attack diagonally
                const direction = piece.color === 'white' ? -1 : 1;
                return toRow === fromRow + direction && Math.abs(toCol - fromCol) === 1;

            case 'knight':
                // Knights move in L-shape
                const rowDiff = Math.abs(fromRow - toRow);
                const colDiff = Math.abs(fromCol - toCol);
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

            case 'bishop':
                // Bishops move diagonally
                if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
                return this.isPathClear(fromRow, fromCol, toRow, toCol);

            case 'rook':
                // Rooks move horizontally or vertically
                if (fromRow !== toRow && fromCol !== toCol) return false;
                return this.isPathClear(fromRow, fromCol, toRow, toCol);

            case 'queen':
                // Queens move like bishops or rooks
                if (fromRow === toRow || fromCol === toCol) {
                    return this.isPathClear(fromRow, fromCol, toRow, toCol);
                }
                if (Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) {
                    return this.isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;

            case 'king':
                // Kings move one square in any direction
                return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;

            default:
                return false;
        }
    }

    // Evaluate pawn structure (for higher difficulty levels)
    evaluatePawnStructure(row, col, color) {
        let score = 0;
        const piece = this.board[row][col];
        if (!piece || piece.type !== 'pawn') return 0;

        // Check for passed pawns
        if (this.isPassedPawn(row, col, color)) {
            score += 30;

            // Advanced passed pawns are even better
            const advancementBonus = color === 'white' ? (6 - row) * 5 : row * 5;
            score += advancementBonus;
        }

        // Penalize isolated pawns
        if (this.isIsolatedPawn(row, col, color)) {
            score -= 20;
        }

        // Penalize doubled pawns
        if (this.isDoubledPawn(row, col, color)) {
            score -= 15;
        }

        // Bonus for connected pawns
        if (this.hasConnectedPawn(row, col, color)) {
            score += 15;
        }

        // Bonus for pawn chains
        const chainLength = this.evaluatePawnChain(row, col, color);
        score += chainLength * 10;

        return score;
    }

    // Check if a pawn is passed (no enemy pawns ahead on same or adjacent files)
    isPassedPawn(row, col, color) {
        const direction = color === 'white' ? -1 : 1;
        const enemyColor = color === 'white' ? 'black' : 'white';

        // Check all rows ahead of the pawn
        for (let r = row + direction; color === 'white' ? r >= 0 : r < 8; r += direction) {
            // Check same file and adjacent files
            for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
                const piece = this.board[r][c];
                if (piece && piece.type === 'pawn' && piece.color === enemyColor) {
                    return false;
                }
            }
        }

        return true;
    }

    // Check if a pawn is isolated (no friendly pawns on adjacent files)
    isIsolatedPawn(row, col, color) {
        // Check all rows for pawns on adjacent files
        for (let r = 0; r < 8; r++) {
            // Check left file
            if (col > 0) {
                const leftPiece = this.board[r][col - 1];
                if (leftPiece && leftPiece.type === 'pawn' && leftPiece.color === color) {
                    return false;
                }
            }

            // Check right file
            if (col < 7) {
                const rightPiece = this.board[r][col + 1];
                if (rightPiece && rightPiece.type === 'pawn' && rightPiece.color === color) {
                    return false;
                }
            }
        }

        return true;
    }

    // Check if a pawn is doubled (another friendly pawn on the same file)
    isDoubledPawn(row, col, color) {
        for (let r = 0; r < 8; r++) {
            if (r === row) continue; // Skip self

            const piece = this.board[r][col];
            if (piece && piece.type === 'pawn' && piece.color === color) {
                return true;
            }
        }

        return false;
    }

    // Check if a pawn has a connected pawn (friendly pawn diagonally adjacent)
    hasConnectedPawn(row, col, color) {
        const direction = color === 'white' ? -1 : 1;

        // Check diagonally forward
        const forwardRow = row + direction;
        if (forwardRow >= 0 && forwardRow < 8) {
            // Check left diagonal
            if (col > 0) {
                const leftDiag = this.board[forwardRow][col - 1];
                if (leftDiag && leftDiag.type === 'pawn' && leftDiag.color === color) {
                    return true;
                }
            }

            // Check right diagonal
            if (col < 7) {
                const rightDiag = this.board[forwardRow][col + 1];
                if (rightDiag && rightDiag.type === 'pawn' && rightDiag.color === color) {
                    return true;
                }
            }
        }

        return false;
    }


    // Evaluate king protection
    evaluateKingProtection(kingPos, kingColor) {
        let protection = 0;
        const { row, col } = kingPos;

        // Check surrounding squares for friendly pieces
        for (let r = Math.max(0, row - 1); r <= Math.min(7, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
                if (r === row && c === col) continue; // Skip king itself

                const piece = this.board[r][c];
                if (piece && piece.color === kingColor) {
                    protection += 1;

                    // Pawns are especially good for protection
                    if (piece.type === 'pawn') {
                        protection += 0.5;
                    }
                }
            }
        }

        // Check if king is castled or in a safe corner
        if (kingColor === 'white') {
            if ((col <= 1 || col >= 6) && row >= 6) {
                protection += 2; // King in corner or castled
            }
        } else {
            if ((col <= 1 || col >= 6) && row <= 1) {
                protection += 2; // King in corner or castled
            }
        }

        return protection;
    }

    // Get positional bonus for a piece
    getPositionalBonus(piece, row, col) {
        let bonus = 0;

        // Center control bonus
        const centerDistance = Math.abs(row - 3.5) + Math.abs(col - 3.5);
        bonus += (4 - centerDistance) * 5;

        // Piece-specific bonuses
        switch (piece.type) {
            case 'pawn':
                // Bonus for advanced pawns
                const advancement = piece.color === 'white' ? (6 - row) : (row - 1);
                bonus += advancement * 10;

                // Bonus for center pawns
                if (col >= 2 && col <= 5) {
                    bonus += 5;
                }
                break;

            case 'knight':
                // Knights are better near the center
                if (centerDistance <= 2) {
                    bonus += 20;
                }
                break;

            case 'bishop':
                // Bishops control more squares when they're not on the edge
                if (row > 0 && row < 7 && col > 0 && col < 7) {
                    bonus += 15;
                }
                break;

            case 'rook':
                // Rooks are good on open files
                let openFile = true;
                for (let r = 0; r < 8; r++) {
                    if (r !== row && this.board[r][col] && this.board[r][col].type === 'pawn') {
                        openFile = false;
                        break;
                    }
                }
                if (openFile) {
                    bonus += 20;
                }

                // Bonus for 7th rank (2nd rank for black)
                if ((piece.color === 'white' && row === 1) || (piece.color === 'black' && row === 6)) {
                    bonus += 30;
                }
                break;

            case 'queen':
                // Queens are versatile but vulnerable
                if (centerDistance <= 2) {
                    bonus += 10;
                }
                break;

            case 'king':
                // Kings should stay back in the opening/middlegame
                if (piece.color === 'white') {
                    if (row >= 6) {
                        bonus += 30; // Safety bonus for staying back
                    }
                } else {
                    if (row <= 1) {
                        bonus += 30; // Safety bonus for staying back
                    }
                }
                break;
        }

        return bonus;
    }

    analyzePlayerMove(fromRow, fromCol, toRow, toCol) {
        if (!this.showVisualizations || this.aiThinking) return;

        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.humanColor) return;

        // Create a move object
        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece
        };

        // Get current AI skill level
        const skillLevel = this.skillLevels[this.aiLevel];

        // Analyze the move with the same depth as AI
        const score = this.evaluateMoveWithLookahead(move, skillLevel.depth);

        // Show the evaluation
        this.showMoveEvaluation(move, score, skillLevel.depth);
    }

    showMoveEvaluation(move, score, depth) {
        // Create a floating evaluation display
        const evaluationElement = document.createElement('div');
        evaluationElement.className = 'move-evaluation-popup';

        // Format score
        const formattedScore = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);

        // Add content
        evaluationElement.innerHTML = `
            <div class="eval-header">Move Analysis (Depth ${depth})</div>
            <div class="eval-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'}">
                ${formattedScore}
            </div>
        `;

        // Position near the move
        const toSquare = document.querySelector(`[data-row="${move.to.row}"][data-col="${move.to.col}"]`);
        if (toSquare) {
            document.body.appendChild(evaluationElement);

            // Position near the square
            const rect = toSquare.getBoundingClientRect();
            evaluationElement.style.left = `${rect.right + 10}px`;
            evaluationElement.style.top = `${rect.top}px`;

            // Remove after a few seconds
            setTimeout(() => {
                if (evaluationElement.parentNode) {
                    evaluationElement.parentNode.removeChild(evaluationElement);
                }
            }, 3000);
        }
    }

    // Show AI thinking visualization on the board
    showAIThinking() {
        if (!this.showVisualizations || !this.aiThinking || this.aiThinkingMoves.length === 0) {
            return;
        }

        const squares = document.querySelectorAll('.square');

        // Clear any existing thinking visualization first
        this.clearAIThinking();

        this.aiThinkingMoves.forEach((move, index) => {
            const { from, to, piece, score } = move;

            // Get the color for this piece type
            const pieceColor = this.pieceColors[piece.type] || '#666666';

            // Calculate opacity based on move ranking (best moves more opaque)
            const opacity = Math.max(0.3, 1 - (index * 0.15));

            // Highlight source square with piece color
            const fromIndex = from.row * 8 + from.col;
            const fromSquare = squares[fromIndex];
            if (fromSquare) {
                fromSquare.style.boxShadow = `inset 0 0 0 4px ${pieceColor}`;
                fromSquare.style.opacity = opacity;
            }

            // Highlight destination square with piece color (lighter)
            const toIndex = to.row * 8 + to.col;
            const toSquare = squares[toIndex];
            if (toSquare) {
                toSquare.style.backgroundColor = pieceColor;
                toSquare.style.opacity = opacity * 0.7;

                // Add pulsing animation for top moves
                if (index < 3) {
                    fromSquare?.classList.add('ai-thinking-pulse');
                    toSquare.classList.add('ai-thinking-pulse');
                }

                // Add move evaluation indicator
                const evaluationDot = document.createElement('div');
                evaluationDot.className = 'evaluation-dot';
                evaluationDot.style.backgroundColor = score > 0 ? '#4CAF50' : score < 0 ? '#f44336' : '#FFC107';
                evaluationDot.style.width = '8px';
                evaluationDot.style.height = '8px';
                evaluationDot.style.borderRadius = '50%';
                evaluationDot.style.position = 'absolute';
                evaluationDot.style.top = '2px';
                evaluationDot.style.right = '2px';
                evaluationDot.style.zIndex = '10';
                toSquare.appendChild(evaluationDot);
            }
        });
    }

    // Clear AI thinking visualization
    clearAIThinking() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            // Reset square styling
            square.style.boxShadow = '';
            square.style.opacity = '';
            square.style.backgroundColor = '';
            square.classList.remove('ai-thinking-pulse');

            // Remove evaluation dots
            const dots = square.querySelectorAll('.evaluation-dot');
            dots.forEach(dot => dot.remove());
        });
    }

    // Highlight selected square
    highlightSelectedSquare() {
        if (!this.selectedSquare) return;

        const { row, col } = this.selectedSquare;
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (square) {
            square.classList.add('selected');
        }
    }

    // Show valid moves for selected piece
    showValidMoves() {
        if (!this.selectedSquare) return;

        const { row: fromRow, col: fromCol } = this.selectedSquare;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(fromRow, fromCol, row, col)) {
                    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (square) {
                        const targetPiece = this.board[row][col];
                        if (targetPiece) {
                            square.classList.add('capture-move');
                        } else {
                            square.classList.add('valid-move');
                        }
                    }
                }
            }
        }
    }

    // Check if game is over
    isGameOver() {
        // Check if either king is captured
        let whiteKing = false;
        let blackKing = false;
        let whiteKingPos = null;
        let blackKingPos = null;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king') {
                    if (piece.color === 'white') {
                        whiteKing = true;
                        whiteKingPos = { row, col };
                    }
                    if (piece.color === 'black') {
                        blackKing = true;
                        blackKingPos = { row, col };
                    }
                }
            }
        }

        // If a king is missing, game is over
        if (!whiteKing || !blackKing) {
            return true;
        }

        // Check for checkmate
        const whiteInCheck = this.isInCheck('white');
        const blackInCheck = this.isInCheck('black');

        if (whiteInCheck) {
            // Check if white has any legal moves
            const hasLegalMoves = this.hasLegalMoves('white');
            if (!hasLegalMoves) {
                this.checkmateColor = 'white';
                return true; // Checkmate
            }
        }

        if (blackInCheck) {
            // Check if black has any legal moves
            const hasLegalMoves = this.hasLegalMoves('black');
            if (!hasLegalMoves) {
                this.checkmateColor = 'black';
                return true; // Checkmate
            }
        }

        return false;
    }

    // Check if a color is in check
    isInCheck(color) {
        // Find the king position
        let kingPos = null;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    kingPos = { row, col };
                    break;
                }
            }
            if (kingPos) break;
        }

        if (!kingPos) return false; // No king found

        // Check if any opponent piece can capture the king
        const opponentColor = color === 'white' ? 'black' : 'white';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    // Check if this piece can move to the king's position
                    if (this.isValidMoveIgnoreCheck(row, col, kingPos.row, kingPos.col)) {
                        return true; // King is in check
                    }
                }
            }
        }

        return false; // King is not in check
    }

    // Check if a move would put or leave own king in check
    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Make temporary move
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];

        // Apply move
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = null;

        // Check if in check
        const inCheck = this.isInCheck(color);

        // Restore board
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;

        return inCheck;
    }

    // Check if a color has any legal moves
    hasLegalMoves(color) {
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                return true; // Found at least one legal move
                            }
                        }
                    }
                }
            }
        }
        return false; // No legal moves found
    }

    // Check move validity without considering check (for check detection)
    isValidMoveIgnoreCheck(fromRow, fromCol, toRow, toCol) {
        // Check bounds
        if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;

        const piece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];

        // Can't move empty square
        if (!piece) return false;

        // Can't capture own piece
        if (targetPiece && targetPiece.color === piece.color) return false;

        // Check piece-specific movement rules
        let validMove = false;
        switch (piece.type) {
            case 'pawn':
                validMove = this.isValidPawnMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'rook':
                validMove = this.isValidRookMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'knight':
                validMove = this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'bishop':
                validMove = this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'queen':
                validMove = this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'king':
                validMove = this.isValidKingMove(fromRow, fromCol, toRow, toCol);
                break;
            default:
                validMove = false;
        }

        return validMove;
    }

    // Get game over message
    getGameOverMessage() {
        // Check if either king is captured
        let whiteKing = false;
        let blackKing = false;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king') {
                    if (piece.color === 'white') whiteKing = true;
                    if (piece.color === 'black') blackKing = true;
                }
            }
        }

        if (!whiteKing) {
            return this.humanColor === 'black' ?
                '🏆 You Win! White king captured!' :
                '❌ AI Wins! Your king was captured!';
        } else if (!blackKing) {
            return this.humanColor === 'white' ?
                '🏆 You Win! Black king captured!' :
                '❌ AI Wins! Your king was captured!';
        }

        // Check for checkmate
        if (this.checkmateColor === 'white') {
            return this.humanColor === 'white' ?
                '❌ Checkmate! AI Wins!' :
                '🏆 Checkmate! You Win!';
        } else if (this.checkmateColor === 'black') {
            return this.humanColor === 'black' ?
                '❌ Checkmate! AI Wins!' :
                '🏆 Checkmate! You Win!';
        }

        return 'Game Over';
    }

    // Show game over message
    showGameOver(message) {
        // Update game status
        const statusElement = document.getElementById('turn-indicator');
        if (statusElement) {
            statusElement.innerHTML = `<strong>${message}</strong>`;
            statusElement.style.color = message.includes('Win') ? '#4CAF50' : '#f44336';
        }

        // Show notification
        this.showNotification(message);

        // Disable further moves
        this.gameOver = true;
    }

    // Show notification
    showNotification(message, duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Update game status
    updateGameStatus() {
        const statusElement = document.getElementById('turn-indicator');
        if (!statusElement) return;

        let statusText = '';

        if (this.gameOver) {
            statusText = 'Game Over';
        } else if (this.aiThinking) {
            statusText = `🤖 AI (${this.aiColor}) is thinking...`;
        } else {
            const playerName = this.currentPlayer === this.humanColor ? 'Your' : 'AI';
            statusText = `${playerName} turn (${this.currentPlayer})`;
        }

        statusElement.textContent = statusText;
    }

    // Update score display
    updateScoreDisplay() {
        const whiteScoreElement = document.getElementById('whiteScore');
        const blackScoreElement = document.getElementById('blackScore');

        if (whiteScoreElement) {
            whiteScoreElement.textContent = this.whiteScore;
        }
        if (blackScoreElement) {
            blackScoreElement.textContent = this.blackScore;
        }
    }

    // Update move history
    updateMoveHistory() {
        const historyElement = document.getElementById('moveHistory');
        if (!historyElement) return;

        historyElement.innerHTML = '';

        this.moveHistory.forEach((move, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = 'move-item';

            const moveNumber = Math.floor(index / 2) + 1;
            const isWhiteMove = index % 2 === 0;

            if (isWhiteMove) {
                moveElement.innerHTML = `<span class="move-number">${moveNumber}.</span> ${move.notation}`;
            } else {
                moveElement.innerHTML = `${move.notation}`;
                moveElement.style.marginLeft = '20px';
            }

            historyElement.appendChild(moveElement);
        });

        // Scroll to bottom
        historyElement.scrollTop = historyElement.scrollHeight;
    }

    // Get move notation
    getMoveNotation(fromRow, fromCol, toRow, toCol, piece, capturedPiece) {
        const files = 'abcdefgh';
        const fromSquare = files[fromCol] + (8 - fromRow);
        const toSquare = files[toCol] + (8 - toRow);

        let notation = '';

        if (piece.type === 'pawn') {
            if (capturedPiece) {
                notation = files[fromCol] + 'x' + toSquare;
            } else {
                notation = toSquare;
            }
        } else {
            const pieceSymbol = piece.type.charAt(0).toUpperCase();
            notation = pieceSymbol + (capturedPiece ? 'x' : '') + toSquare;
        }

        return notation;
    }

    // Get square name (e.g., "e4")
    getSquareName(row, col) {
        const files = 'abcdefgh';
        return files[col] + (8 - row);
    }

    // Setup event listeners
    setupEventListeners() {
        // New Game button
        const newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.setupBoard();
                this.renderBoard();
                this.updateGameStatus();
                this.updateScoreDisplay();
                this.updateMoveHistory();
            });
        }

        // Visualization toggle
        const visualizationCheckbox = document.getElementById('show-visualizations');
        if (visualizationCheckbox) {
            visualizationCheckbox.addEventListener('change', (e) => {
                this.showVisualizations = e.target.checked;
                this.renderBoard(); // Re-render to apply changes
            });
        }

        // Difficulty selector
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.aiLevel = parseInt(e.target.value);
                this.updateSkillDescription();
            });
        }

        // Center line strategy toggle
        const centerLineCheckbox = document.getElementById('center-line-strategy');
        if (centerLineCheckbox) {
            centerLineCheckbox.addEventListener('change', (e) => {
                this.centerLinePreference = e.target.checked;
            });
        }

        // Analyze position button
        const analyzeBtn = document.getElementById('analyze-position');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeCurrentPosition();
            });
        }
    }

    // Analyze current position with custom depth
    analyzeCurrentPosition() {
        if (this.aiThinking || this.gameOver) {
            this.showNotification("Cannot analyze while AI is thinking or game is over", 2000);
            return;
        }

        // Get the depth array from input
        const depthInput = document.getElementById('depth-array');
        if (!depthInput || !depthInput.value) {
            this.showNotification("Please specify depth sequence (e.g., 1,3,5)", 2000);
            return;
        }

        try {
            // Parse the input as a comma-separated list of depths
            const depthArray = depthInput.value.split(',')
                .map(d => parseInt(d.trim()))
                .filter(d => !isNaN(d) && d > 0 && d <= 10); // Limit max depth to 10 for safety

            if (depthArray.length === 0) {
                this.showNotification("Invalid depth sequence", 2000);
                return;
            }

            // Start analysis
            this.showNotification(`Analyzing position at depths: ${depthArray.join(', ')}`, 2000);

            // Set AI thinking state
            this.aiThinking = true;
            this.updateThinkingStatus(true);
            document.querySelector('.thinking-status').textContent = `Analyzing at depths: ${depthArray.join(', ')}...`;

            // Reset counters
            this.positionsEvaluated = 0;
            this.prunedBranches = 0;

            // Get all possible moves for current player
            const moves = this.getAllPossibleMoves(this.currentPlayer);

            // Evaluate each move with custom depths
            const evaluatedMoves = [];

            // Process each move at each depth level
            const processDepths = async () => {
                for (const depth of depthArray) {
                    // Update status
                    document.querySelector('.thinking-status').textContent = `Analyzing at depth ${depth}...`;
                    document.getElementById('search-depth').textContent = depth;

                    // Process each move at this depth
                    for (let i = 0; i < moves.length; i++) {
                        const move = moves[i];

                        // Find if we already have this move in evaluatedMoves
                        let moveData = evaluatedMoves.find(m =>
                            m.move.from.row === move.from.row &&
                            m.move.from.col === move.from.col &&
                            m.move.to.row === move.to.row &&
                            m.move.to.col === move.to.col
                        );

                        if (!moveData) {
                            // New move, evaluate it
                            const score = this.evaluateMoveWithLookahead(move, depth);
                            moveData = { move, score, depth };
                            evaluatedMoves.push(moveData);
                        } else {
                            // Update existing move with deeper evaluation
                            const newScore = this.evaluateMoveWithLookahead(move, depth);
                            moveData.score = newScore;
                            moveData.depth = depth;
                        }

                        // Update visualization every few moves
                        if (i % 3 === 0 || i === moves.length - 1) {
                            this.sortAndDisplayEvaluations(evaluatedMoves, this.currentPlayer, depth);
                            // Small delay to allow UI updates
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }
                    }

                    // Final update for this depth
                    this.sortAndDisplayEvaluations(evaluatedMoves, this.currentPlayer, depth);
                    // Delay between depths
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Final visualization
                this.sortAndDisplayEvaluations(evaluatedMoves, this.currentPlayer, depthArray[depthArray.length - 1], true);

                // End analysis
                this.aiThinking = false;
                this.updateThinkingStatus(false);
                document.querySelector('.thinking-status').textContent = `Analysis complete at depth ${depthArray[depthArray.length - 1]}`;
            };

            // Start the analysis process
            processDepths();
        } catch (e) {
            console.error('Error analyzing position:', e);
            this.showNotification("Error analyzing position", 2000);
            this.aiThinking = false;
            this.updateThinkingStatus(false);
        }
    }

    // Add this to the EnhancedChess class if it's not already there

    // Update skill description
    updateSkillDescription() {
        const skillLevel = this.skillLevels[this.aiLevel];
        const descElement = document.getElementById('skill-description');

        if (descElement) {
            descElement.textContent = `Level ${this.aiLevel}: ${skillLevel.name} (${skillLevel.accuracy}% accuracy) Projects ${skillLevel.depth} moves ahead`;
        }
    }


    // Initialize a comprehensive opening book with detailed theory
    initializeComprehensiveOpeningBook() {
        const book = new Map();

        // Ruy Lopez (Spanish Game)
        book.set('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b', ['e7e5']); // After 1.e4
        book.set('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w', ['g1f3']); // After 1.e4 e5
        book.set('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b', ['b8c6']); // After 1.e4 e5 2.Nf3
        book.set('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w', ['f1b5']); // After 1.e4 e5 2.Nf3 Nc6

        // Morphy Defense
        book.set('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b', ['a7a6']); // After 1.e4 e5 2.Nf3 Nc6 3.Bb5
        book.set('r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w', ['b5a4']); // After 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6
        book.set('r1bqkbnr/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R b', ['g8f6']); // After 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4
        book.set('r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w', ['e1g1']); // After 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6
        book.set('r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQ1RK1 b', ['f8e7']); // After 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O

        // Berlin Defense
        book.set('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b', ['g8f6']); // After 1.e4 e5 2.Nf3 Nc6 3.Bb5
        book.set('r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w', ['e1g1']); // After 1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6
        book.set('r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 b', ['f6e4']); // After 1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6 4.O-O
        book.set('r1bqkb1r/pppp1ppp/2n5/1B2p3/4n3/5N2/PPPP1PPP/RNBQ1RK1 w', ['d2d4']); // After 1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6 4.O-O Nxe4

        // Sicilian Defense
        book.set('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b', ['c7c5']); // After 1.e4
        book.set('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w', ['g1f3']); // After 1.e4 c5
        book.set('rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b', ['d7d6', 'b8c6', 'e7e6', 'g7g6']); // After 1.e4 c5 2.Nf3

        // Najdorf Variation
        book.set('rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b', ['d7d6']); // After 1.e4 c5 2.Nf3
        book.set('rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w', ['d2d4']); // After 1.e4 c5 2.Nf3 d6
        book.set('rnbqkbnr/pp2pppp/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b', ['c5d4']); // After 1.e4 c5 2.Nf3 d6 3.d4
        book.set('rnbqkbnr/pp2pppp/3p4/8/3pP3/5N2/PPP2PPP/RNBQKB1R w', ['f3d4']); // After 1.e4 c5 2.Nf3 d6 3.d4 cxd4
        book.set('rnbqkbnr/pp2pppp/3p4/8/3NP3/8/PPP2PPP/RNBQKB1R b', ['g8f6']); // After 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4
        book.set('rnbqkb1r/pp2pppp/3p1n2/8/3NP3/8/PPP2PPP/RNBQKB1R w', ['b1c3']); // After 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6
        book.set('rnbqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R b', ['a7a6']); // After 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3

        // Add many more openings and variations...

        return book;
    }

    // Initialize opening repertoire based on AI personality
    initializeOpeningRepertoire() {
        const personality = this.aiPersonality.name.toLowerCase();
        this.currentRepertoire = [];

        // Select openings based on personality
        if (this.openingPreferences[personality]) {
            this.currentRepertoire = this.openingPreferences[personality];
        } else {
            // Default to balanced repertoire
            this.currentRepertoire = this.openingPreferences.balanced;
        }

        console.log(`AI initialized with ${personality} opening repertoire: ${this.currentRepertoire.join(', ')}`);
    }

    // Get move from opening book with enhanced theory knowledge
    getMoveFromOpeningBook() {
        // Get current position FEN
        const positionFEN = this.getPositionFEN();

        // Check if position is in our opening book
        if (this.openingBook.has(positionFEN)) {
            const possibleMoves = this.openingBook.get(positionFEN);

            if (possibleMoves && possibleMoves.length > 0) {
                // Get the skill level's opening knowledge depth
                const knowledgeDepth = this.openingKnowledgeDepth[this.aiLevel];

                // If we're beyond the AI's knowledge depth, don't use book
                if (this.moveCount > knowledgeDepth) {
                    return null;
                }

                // Select move based on personality and repertoire
                let selectedMove;

                // Check if we have a preferred opening in our repertoire
                const currentOpeningName = this.identifyCurrentOpening();

                if (currentOpeningName && this.currentRepertoire.includes(currentOpeningName)) {
                    // We're in a preferred opening, follow main line
                    selectedMove = possibleMoves[0]; // Main line is first
                } else {
                    // Choose based on personality
                    switch (this.aiPersonality.name) {
                        case 'Aggressive':
                            // Prefer sharp, attacking lines
                            selectedMove = this.findSharpestMove(possibleMoves);
                            break;
                        case 'Defensive':
                            // Prefer solid, safe lines
                            selectedMove = this.findSolidMove(possibleMoves);
                            break;
                        case 'Positional':
                            // Prefer positional, strategic lines
                            selectedMove = this.findPositionalMove(possibleMoves);
                            break;
                        case 'Tactical':
                            // Prefer tactical, complex lines
                            selectedMove = this.findTacticalMove(possibleMoves);
                            break;
                        case 'Hypermodern':
                            // Prefer hypermodern approaches
                            selectedMove = this.findHypermodernMove(possibleMoves);
                            break;
                        default:
                            // Balanced or other personalities: slightly randomize
                            const moveIndex = Math.floor(Math.random() * Math.min(3, possibleMoves.length));
                            selectedMove = possibleMoves[moveIndex];
                    }
                }

                // If we couldn't find a specific move, use the first one
                if (!selectedMove) {
                    selectedMove = possibleMoves[0];
                }

                // Convert notation to move object
                return this.notationToMove(selectedMove);
            }
        }

        // Check for transpositions if we have high enough skill
        if (Math.random() < this.transpositionAwareness[this.aiLevel]) {
            const transpositionMove = this.findTranspositionMove();
            if (transpositionMove) {
                return transpositionMove;
            }
        }

        // No book move found
        return null;
    }

    // Get position FEN (simplified version)
    getPositionFEN() {
        let fen = '';

        // Board position
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;

            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];

                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }

                    let pieceChar = '';
                    switch (piece.type) {
                        case 'pawn': pieceChar = 'p'; break;
                        case 'knight': pieceChar = 'n'; break;
                        case 'bishop': pieceChar = 'b'; break;
                        case 'rook': pieceChar = 'r'; break;
                        case 'queen': pieceChar = 'q'; break;
                        case 'king': pieceChar = 'k'; break;
                    }

                    fen += piece.color === 'white' ? pieceChar.toUpperCase() : pieceChar;
                } else {
                    emptyCount++;
                }
            }

            if (emptyCount > 0) {
                fen += emptyCount;
            }

            if (row < 7) {
                fen += '/';
            }
        }

        // Add active color
        fen += ' ' + this.currentPlayer.charAt(0);

        return fen;
    }

    // Convert algebraic notation to move object
    notationToMove(notation) {
        // This is a simplified implementation
        // In a real chess engine, you would parse algebraic notation properly

        // Example: "e2e4" format
        if (notation.length === 4) {
            const files = 'abcdefgh';
            const fromCol = files.indexOf(notation[0]);
            const fromRow = 8 - parseInt(notation[1]);
            const toCol = files.indexOf(notation[2]);
            const toRow = 8 - parseInt(notation[3]);

            if (fromCol >= 0 && fromRow >= 0 && toCol >= 0 && toRow >= 0) {
                const piece = this.board[fromRow][fromCol];
                if (piece) {
                    return {
                        from: { row: fromRow, col: fromCol },
                        to: { row: toRow, col: toCol },
                        piece: piece
                    };
                }
            }
        }

        return null;
    }

    // Find a move that transposes to a favorable opening
    findTranspositionMove() {
        // Get current position FEN
        const positionFEN = this.getPositionFEN();

        // Define common transpositions with target openings
        const transpositions = {
            // Example: This position can transpose to Ruy Lopez
            "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w": {
                move: "f1b5", // Bb5 transposes to Ruy Lopez
                target: "Ruy Lopez"
            },
            // Position that can transpose to Sicilian Dragon
            "rnbqkb1r/pp2pp1p/3p1np1/8/3NP3/2N5/PPP2PPP/R1BQKB1R w": {
                move: "c1e3", // Be3 transposes to Sicilian Dragon
                target: "Sicilian Dragon"
            },
            // Position that can transpose to Queen's Gambit
            "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w": {
                move: "c2c4", // c4 transposes to Queen's Gambit
                target: "Queen's Gambit"
            }
        };

        // Check if current position can transpose
        if (transpositions[positionFEN]) {
            const transposition = transpositions[positionFEN];

            // Check if this transposition aligns with AI personality
            if (this.aiPersonality && this.currentRepertoire.includes(transposition.target)) {
                console.log(`Found transposition to ${transposition.target}`);
                return this.notationToMove(transposition.move);
            }
        }

        // Check simplified positions (ignoring castling rights and en passant)
        const simplifiedFEN = this.getSimplifiedPositionFEN();
        for (const [fen, data] of Object.entries(transpositions)) {
            // Compare only piece positions, not full FEN
            if (this.fenPiecesMatch(simplifiedFEN, fen)) {
                console.log(`Found approximate transposition to ${data.target}`);
                const move = this.notationToMove(data.move);
                if (move && this.isValidMove(move.from.row, move.from.col, move.to.row, move.to.col)) {
                    return move;
                }
            }
        }

        return null;
    }

    // Get simplified position FEN (just pieces, no castling/en passant info)
    getSimplifiedPositionFEN() {
        let fen = '';

        // Board position only
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;

            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];

                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }

                    let pieceChar = '';
                    switch (piece.type) {
                        case 'pawn': pieceChar = 'p'; break;
                        case 'knight': pieceChar = 'n'; break;
                        case 'bishop': pieceChar = 'b'; break;
                        case 'rook': pieceChar = 'r'; break;
                        case 'queen': pieceChar = 'q'; break;
                        case 'king': pieceChar = 'k'; break;
                    }

                    fen += piece.color === 'white' ? pieceChar.toUpperCase() : pieceChar;
                } else {
                    emptyCount++;
                }
            }

            if (emptyCount > 0) {
                fen += emptyCount;
            }

            if (row < 7) {
                fen += '/';
            }
        }

        // Add active color
        fen += ' ' + this.currentPlayer.charAt(0);

        return fen;
    }

    // Compare FEN piece positions
    fenPiecesMatch(fen1, fen2) {
        // Extract just the piece positions part
        const pieces1 = fen1.split(' ')[0];
        const pieces2 = fen2.split(' ')[0];
        return pieces1 === pieces2;
    }

    // Check for opening traps based on skill level
    checkForOpeningTraps() {
        // Get the traps this AI knows based on skill level
        const knownTraps = this.trapKnowledge[this.aiLevel];

        // If we're at a high skill level, we know all traps
        if (knownTraps.includes('All traps') || knownTraps.includes('All common traps')) {
            // Check for all possible traps
            return this.findAnyOpeningTrap();
        }

        // Otherwise, check only for the traps we know
        for (const trapName of knownTraps) {
            const trapMove = this.checkSpecificTrap(trapName);
            if (trapMove) {
                console.log(`Found trap: ${trapName}`);
                return trapMove;
            }
        }

        return null;
    }

    // Find any opening trap in the current position
    findAnyOpeningTrap() {
        // Define all possible traps to check
        const allTraps = [
            'Scholar\'s Mate',
            'Légal Trap',
            'Fishing Pole',
            'Blackburne Shilling Gambit',
            'Lasker Trap',
            'Elephant Trap',
            'Noah\'s Ark Trap',
            'Siberian Trap',
            'Halosar Trap',
            'Englund Gambit Trap',
            'Stafford Gambit',
            'Fried Liver Attack'
        ];

        // Check each trap
        for (const trapName of allTraps) {
            const trapMove = this.checkSpecificTrap(trapName);
            if (trapMove) {
                console.log(`Found trap: ${trapName}`);
                return trapMove;
            }
        }

        // Check for general tactical opportunities
        return this.findTacticalTrap();
    }

    // Find tactical traps not tied to specific named traps
    findTacticalTrap() {
        const moves = this.getAllPossibleMoves(this.aiColor);

        // Look for moves that:
        // 1. Set up a fork
        // 2. Set up a discovered attack
        // 3. Create a pin
        // 4. Lead to material gain in 2-3 moves

        for (const move of moves) {
            // Make temporary move
            const originalPiece = this.board[move.to.row][move.to.col];
            this.board[move.to.row][move.to.col] = this.board[move.from.row][move.from.col];
            this.board[move.from.row][move.from.col] = null;

            // Check if this move creates a fork
            const createsFork = this.moveCreatesFork(move);

            // Check if this move creates a pin
            const createsPin = this.moveCreatesPin(move);

            // Check if this move sets up a discovered attack
            const createsDiscoveredAttack = this.moveCreatesDiscoveredAttack(move);

            // Restore board
            this.board[move.from.row][move.from.col] = this.board[move.to.row][move.to.col];
            this.board[move.to.row][move.to.col] = originalPiece;

            // If this move creates a tactical opportunity, return it
            if (createsFork || createsPin || createsDiscoveredAttack) {
                console.log("Found tactical trap opportunity");
                return move;
            }
        }

        return null;
    }

    // Check if a move creates a fork (attacking two or more pieces simultaneously)
    moveCreatesFork(move) {
        const piece = this.board[move.to.row][move.to.col];
        const attackedPieces = [];

        // Check all squares for opponent pieces that can be attacked from the new position
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const targetPiece = this.board[row][col];
                if (targetPiece && targetPiece.color !== piece.color) {
                    // Check if our piece can attack this opponent piece
                    if (this.canAttackFromTo(move.to.row, move.to.col, row, col)) {
                        attackedPieces.push({
                            piece: targetPiece,
                            position: { row, col }
                        });
                    }
                }
            }
        }

        // It's a fork if we're attacking 2+ valuable pieces
        return attackedPieces.length >= 2 &&
            attackedPieces.some(p => p.piece.type !== 'pawn');
    }

    // Check if a move creates a pin (opponent piece can't move without exposing more valuable piece)
    moveCreatesPin(move) {
        const piece = this.board[move.to.row][move.to.col];
        const opponentColor = piece.color === 'white' ? 'black' : 'white';

        // Only long-range pieces can create pins
        if (piece.type !== 'queen' && piece.type !== 'rook' && piece.type !== 'bishop') {
            return false;
        }

        // Check all directions based on piece type
        const directions = [];

        if (piece.type === 'rook' || piece.type === 'queen') {
            // Horizontal and vertical directions
            directions.push({ rowStep: 0, colStep: 1 });  // right
            directions.push({ rowStep: 0, colStep: -1 }); // left
            directions.push({ rowStep: 1, colStep: 0 });  // down
            directions.push({ rowStep: -1, colStep: 0 }); // up
        }

        if (piece.type === 'bishop' || piece.type === 'queen') {
            // Diagonal directions
            directions.push({ rowStep: 1, colStep: 1 });   // down-right
            directions.push({ rowStep: 1, colStep: -1 });  // down-left
            directions.push({ rowStep: -1, colStep: 1 });  // up-right
            directions.push({ rowStep: -1, colStep: -1 }); // up-left
        }

        // Check each direction for a pin
        for (const dir of directions) {
            let firstPiece = null;
            let secondPiece = null;

            let row = move.to.row + dir.rowStep;
            let col = move.to.col + dir.colStep;

            // Scan in this direction
            while (row >= 0 && row < 8 && col >= 0 && col < 8) {
                const currentPiece = this.board[row][col];

                if (currentPiece) {
                    if (!firstPiece) {
                        // Found first piece
                        if (currentPiece.color === opponentColor) {
                            firstPiece = { piece: currentPiece, position: { row, col } };
                        } else {
                            // Our own piece blocks the pin
                            break;
                        }
                    } else {
                        // Found second piece
                        if (currentPiece.color === opponentColor) {
                            secondPiece = { piece: currentPiece, position: { row, col } };

                            // Check if this is a valuable pin (second piece more valuable than first)
                            if (this.pieceValues[secondPiece.piece.type] > this.pieceValues[firstPiece.piece.type]) {
                                return true;
                            }
                        }
                        break;
                    }
                }

                row += dir.rowStep;
                col += dir.colStep;
            }
        }

        return false;
    }

    // Check if a move creates a discovered attack
    moveCreatesDiscoveredAttack(move) {
        const piece = this.board[move.to.row][move.to.col];
        const opponentColor = piece.color === 'white' ? 'black' : 'white';

        // Calculate the direction of movement
        const rowDir = Math.sign(move.to.row - move.from.row);
        const colDir = Math.sign(move.to.col - move.from.col);

        // Check the opposite direction for our pieces that can now attack
        const oppositeRowDir = -rowDir;
        const oppositeColDir = -colDir;

        // Start from the original position
        let row = move.from.row;
        let col = move.from.col;

        // First, find our attacking piece behind the moved piece
        let attackingPiece = null;

        row += oppositeRowDir;
        col += oppositeColDir;

        while (row >= 0 && row < 8 && col >= 0 && col < 8) {
            const currentPiece = this.board[row][col];

            if (currentPiece) {
                if (currentPiece.color === piece.color) {
                    // Found our potential attacking piece
                    if (currentPiece.type === 'queen' ||
                        currentPiece.type === 'rook' ||
                        currentPiece.type === 'bishop') {
                        attackingPiece = { piece: currentPiece, position: { row, col } };
                    }
                }
                break;
            }

            row += oppositeRowDir;
            col += oppositeColDir;
        }

        if (!attackingPiece) {
            return false;
        }

        // Now check if there's a valuable target in the forward direction
        row = move.from.row + rowDir;
        col = move.from.col + colDir;

        while (row >= 0 && row < 8 && col >= 0 && col < 8) {
            const currentPiece = this.board[row][col];

            if (currentPiece) {
                if (currentPiece.color === opponentColor) {
                    // Found a target - check if our attacking piece can actually attack it
                    if (this.canPieceAttackTarget(attackingPiece.piece,
                        attackingPiece.position.row,
                        attackingPiece.position.col,
                        row, col)) {
                        // Valuable discovered attack
                        return currentPiece.type === 'queen' ||
                            currentPiece.type === 'rook' ||
                            currentPiece.type === 'king';
                    }
                }
                break;
            }

            row += rowDir;
            col += colDir;
        }

        return false;
    }

    // Check if a specific piece can attack a target position
    canPieceAttackTarget(piece, fromRow, fromCol, toRow, toCol) {
        switch (piece.type) {
            case 'queen':
                return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            default:
                return false;
        }
    }

    // Check for a specific trap
    checkSpecificTrap(trapName) {
        switch (trapName) {
            case 'Scholar\'s Mate':
                return this.checkScholarsMateTrap();
            case 'Légal Trap':
                return this.checkLegalTrap();
            case 'Fishing Pole':
                return this.checkFishingPoleTrap();
            case 'Blackburne Shilling Gambit':
                return this.checkBlackburneShillingGambit();
            case 'Lasker Trap':
                return this.checkLaskerTrap();
            case 'Elephant Trap':
                return this.checkElephantTrap();
            case 'Stafford Gambit':
                return this.checkStaffordGambit();
            case 'Fried Liver Attack':
                return this.checkFriedLiverAttack();
            default:
                return null;
        }
    }

    // Check for Scholar's Mate trap
    checkScholarsMateTrap() {
        // If we're white, try to set up Scholar's Mate
        if (this.aiColor === 'white') {
            // Get current position
            const moveHistory = this.getMoveHistoryNotation();

            // Early moves of Scholar's Mate
            if (moveHistory === "") {
                // First move: e4
                return this.notationToMove("e2e4");
            } else if (moveHistory.includes("1.e4") && !moveHistory.includes("2.")) {
                // Second move: Qh5
                return this.notationToMove("d1h5");
            } else if (moveHistory.includes("2.Qh5") && !moveHistory.includes("3.")) {
                // Third move: Bc4
                return this.notationToMove("f1c4");
            } else if (moveHistory.includes("3.Bc4") && !moveHistory.includes("4.")) {
                // Look for checkmate opportunity
                // Check if f7 is vulnerable
                const f7Piece = this.board[1][5]; // f7 square

                if (!f7Piece || f7Piece.type !== 'pawn') {
                    // Try to checkmate with Qxf7#
                    return this.notationToMove("h5f7");
                }
            }
        }

        // If we're black, try to avoid Scholar's Mate
        else {
            const moveHistory = this.getMoveHistoryNotation();

            // Detect Scholar's Mate attempt
            if (moveHistory.includes("1.e4") && moveHistory.includes("2.Qh5")) {
                // Defend with g6 or Nf6
                const g6Move = this.notationToMove("g7g6");
                const nf6Move = this.notationToMove("g8f6");

                if (g6Move && this.isValidMove(g6Move.from.row, g6Move.from.col, g6Move.to.row, g6Move.to.col)) {
                    return g6Move;
                } else if (nf6Move && this.isValidMove(nf6Move.from.row, nf6Move.from.col, nf6Move.to.row, nf6Move.to.col)) {
                    return nf6Move;
                }
            }
        }

        return null;
    }

    // Check for Legal Trap
    checkLegalTrap() {
        // Legal's trap occurs in the Italian Game or Two Knights Defense
        const moveHistory = this.getMoveHistoryNotation();

        if (this.aiColor === 'white') {
            // Setting up Legal Trap
            if (moveHistory.includes("1.e4 e5 2.Nf3 Nc6 3.Bc4") &&
                moveHistory.includes("3...Nf6") &&
                !moveHistory.includes("4.")) {
                // Play 4.Ng5 attacking f7
                return this.notationToMove("f3g5");
            }

            // If black defends with d5
            if (moveHistory.includes("4.Ng5 d5")) {
                // Take the pawn with 5.exd5
                return this.notationToMove("e4d5");
            }

            // If black plays Nxd5
            if (moveHistory.includes("5.exd5 Nxd5")) {
                // Play 6.Nxf7
                return this.notationToMove("g5f7");
            }

            // If black takes the knight
            if (moveHistory.includes("6.Nxf7 Kxf7")) {
                // Play 7.Qf3+ forking king and knight
                return this.notationToMove("d1f3");
            }
        }
        else { // Black
            // Avoiding Legal Trap
            if (moveHistory.includes("1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5")) {
                // Instead of d5, play h6
                return this.notationToMove("h7h6");
            }
        }

        return null;
    }

    // Check for Fishing Pole Trap
    checkFishingPoleTrap() {
        const moveHistory = this.getMoveHistoryNotation();

        if (this.aiColor === 'black') {
            // Setting up Fishing Pole as Black
            if (moveHistory.includes("1.e4 e5 2.Nf3") && !moveHistory.includes("2...")) {
                // Play 2...Nf6
                return this.notationToMove("g8f6");
            }

            // Continue with the trap
            if (moveHistory.includes("1.e4 e5 2.Nf3 Nf6 3.Nxe5")) {
                // Play 3...Nc6
                return this.notationToMove("b8c6");
            }

            if (moveHistory.includes("3.Nxe5 Nc6") && !moveHistory.includes("4...")) {
                // Play 4...Nxe5
                return this.notationToMove("c6e5");
            }

            // Look for the fishing pole opportunity
            if (moveHistory.includes("1.e4 e5 2.Nf3 Nf6") &&
                !moveHistory.includes("2...Nf6 3.Nxe5") &&
                this.moveCount >= 6) {
                // Check if we can play Ng4
                const ng4Move = this.notationToMove("f6g4");
                if (ng4Move && this.isValidMove(ng4Move.from.row, ng4Move.from.col, ng4Move.to.row, ng4Move.to.col)) {
                    return ng4Move;
                }
            }
        }

        return null;
    }

    // Check for Blackburne Shilling Gambit
    checkBlackburneShillingGambit() {
        const moveHistory = this.getMoveHistoryNotation();

        if (this.aiColor === 'black') {
            // Setting up Blackburne Shilling Gambit
            if (moveHistory.includes("1.e4 e5 2.Nf3") && !moveHistory.includes("2...")) {
                // Play 2...Nc6
                return this.notationToMove("b8c6");
            }

            if (moveHistory.includes("1.e4 e5 2.Nf3 Nc6 3.Bc4") && !moveHistory.includes("3...")) {
                // Play 3...Nd4
                return this.notationToMove("c6d4");
            }

            if (moveHistory.includes("3.Bc4 Nd4") && moveHistory.includes("4.Nxe5")) {
                // Play 4...Qg5
                return this.notationToMove("d8g5");
            }

            if (moveHistory.includes("4.Nxe5 Qg5") && moveHistory.includes("5.Nxf7")) {
                // Play 5...Qxg2
                return this.notationToMove("g5g2");
            }

            if (moveHistory.includes("5.Nxf7 Qxg2") && moveHistory.includes("6.Rf1")) {
                // Play 6...Qxe4+
                return this.notationToMove("g2e4");
            }
        }

        return null;
    }

    // Check for Lasker Trap in the Albin Countergambit
    checkLaskerTrap() {
        const moveHistory = this.getMoveHistoryNotation();

        if (this.aiColor === 'black') {
            // Setting up Lasker Trap
            if (moveHistory.includes("1.d4 d5 2.c4") && !moveHistory.includes("2...")) {
                // Play 2...e5 (Albin Countergambit)
                return this.notationToMove("e7e5");
            }

            if (moveHistory.includes("1.d4 d5 2.c4 e5 3.dxe5") && !moveHistory.includes("3...")) {
                // Play 3...d4
                return this.notationToMove("d5d4");
            }

            if (moveHistory.includes("3.dxe5 d4 4.e3") && !moveHistory.includes("4...")) {
                // Play 4...Bb4+
                return this.notationToMove("f8b4");
            }

            if (moveHistory.includes("4.e3 Bb4+ 5.Bd2") && !moveHistory.includes("5...")) {
                // Play 5...dxe3
                return this.notationToMove("d4e3");
            }

            if (moveHistory.includes("5.Bd2 dxe3 6.Bxb4") && !moveHistory.includes("6...")) {
                // Play 6...exf2+
                return this.notationToMove("e3f2");
            }
        }

        return null;
    }

    // Check for Elephant Trap in the Queen's Gambit
    checkElephantTrap() {
        const moveHistory = this.getMoveHistoryNotation();

        if (this.aiColor === 'black') {
            // Setting up Elephant Trap
            if (moveHistory.includes("1.d4 d5 2.c4") && !moveHistory.includes("2...")) {
                // Play 2...e6
                return this.notationToMove("e7e6");
            }

            if (moveHistory.includes("1.d4 d5 2.c4 e6 3.Nc3") && !moveHistory.includes("3...")) {
                // Play 3...Nf6
                return this.notationToMove("g8f6");
            }

            if (moveHistory.includes("3.Nc3 Nf6 4.Bg5") && !moveHistory.includes("4...")) {
                // Play 4...Nbd7
                return this.notationToMove("b8d7");
            }

            if (moveHistory.includes("4.Bg5 Nbd7 5.cxd5") && !moveHistory.includes("5...")) {
                // Play 5...exd5
                return this.notationToMove("e6d5");
            }

            // Look for the trap opportunity
            if (moveHistory.includes("5.cxd5 exd5") &&
                this.isSquareOccupied(0, 3) && // Check if white queen is on d1
                this.board[0][3].type === 'queen') {
                // Check if we can play Bb4
                const bb4Move = this.notationToMove("f8b4");
                if (bb4Move && this.isValidMove(bb4Move.from.row, bb4Move.from.col, bb4Move.to.row, bb4Move.to.col)) {
                    return bb4Move;
                }
            }
        }

        return null;
    }

    // Check for Stafford Gambit
    checkStaffordGambit() {
        const moveHistory = this.getMoveHistoryNotation();

        if (this.aiColor === 'black') {
            // Setting up Stafford Gambit
            if (moveHistory.includes("1.e4 e5 2.Nf3") && !moveHistory.includes("2...")) {
                // Play 2...Nf6
                return this.notationToMove("g8f6");
            }

            if (moveHistory.includes("1.e4 e5 2.Nf3 Nf6 3.Nxe5") && !moveHistory.includes("3...")) {
                // Play 3...Nc6
                return this.notationToMove("b8c6");
            }

            if (moveHistory.includes("3.Nxe5 Nc6 4.Nxc6") && !moveHistory.includes("4...")) {
                // Play 4...dxc6
                return this.notationToMove("d7c6");
            }

            // Look for tactical opportunities
            if (moveHistory.includes("4.Nxc6 dxc6") && !moveHistory.includes("5...")) {
                // Check if we can play Nxe4
                const nxe4Move = this.notationToMove("f6e4");
                if (nxe4Move && this.isValidMove(nxe4Move.from.row, nxe4Move.from.col, nxe4Move.to.row, nxe4Move.to.col)) {
                    return nxe4Move;
                }
            }
        }

        return null;
    }

    // Check for Fried Liver Attack
    checkFriedLiverAttack() {
        const moveHistory = this.getMoveHistoryNotation();

        if (this.aiColor === 'white') {
            // Setting up Fried Liver Attack
            if (moveHistory === "") {
                // Play 1.e4
                return this.notationToMove("e2e4");
            }

            if (moveHistory.includes("1.e4 e5") && !moveHistory.includes("2.")) {
                // Play 2.Nf3
                return this.notationToMove("g1f3");
            }

            if (moveHistory.includes("2.Nf3 Nc6") && !moveHistory.includes("3.")) {
                // Play 3.Bc4
                return this.notationToMove("f1c4");
            }

            if (moveHistory.includes("3.Bc4 Nf6") && !moveHistory.includes("4.")) {
                // Play 4.Ng5
                return this.notationToMove("f3g5");
            }

            if (moveHistory.includes("4.Ng5") && !moveHistory.includes("5.")) {
                // Check if d5 is played
                if (moveHistory.includes("4...d5")) {
                    // Play 5.exd5
                    return this.notationToMove("e4d5");
                }
            }

            if (moveHistory.includes("5.exd5 Nxd5") && !moveHistory.includes("6.")) {
                // Play 6.Nxf7
                return this.notationToMove("g5f7");
            }
        }
        else { // Black
            // Avoiding Fried Liver Attack
            if (moveHistory.includes("1.e4 e5 2.Nf3 Nc6 3.Bc4") && !moveHistory.includes("3...")) {
                // Instead of Nf6, play Be7 or Bc5
                const be7Move = this.notationToMove("f8e7");
                const bc5Move = this.notationToMove("f8c5");

                if (bc5Move && this.isValidMove(bc5Move.from.row, bc5Move.from.col, bc5Move.to.row, bc5Move.to.col)) {
                    return bc5Move; // Prefer Bc5
                } else if (be7Move && this.isValidMove(be7Move.from.row, be7Move.from.col, be7Move.to.row, be7Move.to.col)) {
                    return be7Move;
                }
            }

            // If we already played Nf6 and white plays Ng5, use the Two Knights Defense
            if (moveHistory.includes("3.Bc4 Nf6 4.Ng5") && !moveHistory.includes("4...")) {
                // Play 4...d5 (Two Knights Defense)
                const d5Move = this.notationToMove("d7d5");
                if (d5Move && this.isValidMove(d5Move.from.row, d5Move.from.col, d5Move.to.row, d5Move.to.col)) {
                    return d5Move;
                }
            }

            // If white plays Nxf7, don't capture with the king
            if (moveHistory.includes("6.Nxf7") && !moveHistory.includes("6...")) {
                // Instead of Kxf7, play Qe7 if possible
                const qe7Move = this.notationToMove("d8e7");
                if (qe7Move && this.isValidMove(qe7Move.from.row, qe7Move.from.col, qe7Move.to.row, qe7Move.to.col)) {
                    return qe7Move;
                }
            }
        }

        return null;
    }

    // Helper method to check if a square is occupied
    isSquareOccupied(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8 && this.board[row][col] !== null;
    }

    // Helper method to find a piece of specific type and color
    findPiece(type, color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === type && piece.color === color) {
                    return { row, col, piece };
                }
            }
        }
        return null;
    }

    // Helper method to find all pieces of specific type and color
    findAllPieces(type, color) {
        const pieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === type && piece.color === color) {
                    pieces.push({ row, col, piece });
                }
            }
        }
        return pieces;
    }

    // Helper method to check if a square is under attack
    isSquareUnderAttack(row, col, attackerColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === attackerColor) {
                    if (this.isValidMoveIgnoreCheck(r, c, row, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Helper method to evaluate if a move is safe (doesn't put piece under attack)
    isSafeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;

        const opponentColor = piece.color === 'white' ? 'black' : 'white';

        // Make temporary move
        const originalPiece = this.board[toRow][toCol];
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Check if destination square would be under attack
        const isUnderAttack = this.isSquareUnderAttack(toRow, toCol, opponentColor);

        // Restore board
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = originalPiece;

        return !isUnderAttack;
    }

    // Helper method to find the safest square for a piece
    findSafestSquare(row, col) {
        const piece = this.board[row][col];
        if (!piece) return null;

        const moves = this.getPieceValidMoves(row, col);
        let bestMove = null;
        let bestSafetyScore = -Infinity;

        for (const move of moves) {
            // Calculate safety score for this move
            const safetyScore = this.calculateMoveSafetyScore(move);

            if (safetyScore > bestSafetyScore) {
                bestSafetyScore = safetyScore;
                bestMove = move;
            }
        }

        return bestMove;
    }

    // Calculate safety score for a move
    calculateMoveSafetyScore(move) {
        const piece = this.board[move.from.row][move.from.col];
        if (!piece) return -Infinity;

        const opponentColor = piece.color === 'white' ? 'black' : 'white';
        let safetyScore = 0;

        // Make temporary move
        const originalPiece = this.board[move.to.row][move.to.col];
        this.board[move.to.row][move.to.col] = piece;
        this.board[move.from.row][move.from.col] = null;

        // Base score on piece value
        safetyScore += this.pieceValues[piece.type];

        // Penalty if the square is under attack
        if (this.isSquareUnderAttack(move.to.row, move.to.col, opponentColor)) {
            safetyScore -= this.pieceValues[piece.type] * 0.8;
        }

        // Bonus for squares defended by our pieces
        if (this.isSquareDefended(move.to.row, move.to.col, piece.color)) {
            safetyScore += 50;
        }

        // Bonus for captures
        if (originalPiece) {
            safetyScore += this.pieceValues[originalPiece.type];
        }

        // Bonus for center control
        const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
        safetyScore += (4 - centerDistance) * 10;

        // Restore board
        this.board[move.from.row][move.from.col] = piece;
        this.board[move.to.row][move.to.col] = originalPiece;

        return safetyScore;
    }

    // Check if a square is defended by a specific color
    isSquareDefended(row, col, defenderColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === defenderColor && (r !== row || c !== col)) {
                    if (this.isValidMoveIgnoreCheck(r, c, row, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Identify the current opening being played
    identifyCurrentOpening() {
        // Get the move history in a standardized format
        const moveHistory = this.getMoveHistoryNotation();

        // Define opening patterns with their names
        const openingPatterns = {
            // Ruy Lopez / Spanish Opening
            "1.e4 e5 2.Nf3 Nc6 3.Bb5": "Ruy Lopez (Spanish Opening)",
            "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6": "Ruy Lopez, Morphy Defense",
            "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4": "Ruy Lopez, Closed Variation",
            "1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6": "Ruy Lopez, Berlin Defense",

            // Italian Game
            "1.e4 e5 2.Nf3 Nc6 3.Bc4": "Italian Game",
            "1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5": "Italian Game, Giuoco Piano",
            "1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6": "Italian Game, Two Knights Defense",

            // Sicilian Defense
            "1.e4 c5": "Sicilian Defense",
            "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6": "Sicilian Defense, Najdorf Variation",
            "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6": "Sicilian Defense, Dragon Variation",
            "1.e4 c5 2.Nf3 e6": "Sicilian Defense, French Variation",
            "1.e4 c5 2.Nf3 Nc6": "Sicilian Defense, Classical Variation",
            "1.e4 c5 2.c3": "Sicilian Defense, Alapin Variation",

            // French Defense
            "1.e4 e6": "French Defense",
            "1.e4 e6 2.d4 d5": "French Defense, Main Line",
            "1.e4 e6 2.d4 d5 3.Nc3": "French Defense, Classical Variation",
            "1.e4 e6 2.d4 d5 3.e5": "French Defense, Advance Variation",

            // Caro-Kann Defense
            "1.e4 c6": "Caro-Kann Defense",
            "1.e4 c6 2.d4 d5": "Caro-Kann Defense, Main Line",
            "1.e4 c6 2.d4 d5 3.e5": "Caro-Kann Defense, Advance Variation",
            "1.e4 c6 2.d4 d5 3.Nc3": "Caro-Kann Defense, Classical Variation",

            // Queen's Gambit
            "1.d4 d5 2.c4": "Queen's Gambit",
            "1.d4 d5 2.c4 e6": "Queen's Gambit Declined",
            "1.d4 d5 2.c4 dxc4": "Queen's Gambit Accepted",
            "1.d4 d5 2.c4 c6": "Slav Defense",
            "1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5": "Queen's Gambit, Orthodox Defense",

            // Indian Defenses
            "1.d4 Nf6": "Indian Defense",
            "1.d4 Nf6 2.c4 e6": "Indian Defense, Normal Variation",
            "1.d4 Nf6 2.c4 g6": "Indian Defense, King's Indian or Grünfeld",
            "1.d4 Nf6 2.c4 e6 3.Nc3 Bb4": "Nimzo-Indian Defense",
            "1.d4 Nf6 2.c4 g6 3.Nc3 d5": "Grünfeld Defense",
            "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7": "King's Indian Defense",

            // English Opening
            "1.c4": "English Opening",
            "1.c4 e5": "English Opening, Reversed Sicilian",
            "1.c4 c5": "English Opening, Symmetrical Variation",

            // King's Gambit
            "1.e4 e5 2.f4": "King's Gambit",
            "1.e4 e5 2.f4 exf4": "King's Gambit Accepted",
            "1.e4 e5 2.f4 Bc5": "King's Gambit, Classical Variation",

            // Scandinavian Defense
            "1.e4 d5": "Scandinavian Defense",
            "1.e4 d5 2.exd5 Qxd5": "Scandinavian Defense, Queen Recapture",
            "1.e4 d5 2.exd5 Nf6": "Scandinavian Defense, Modern Variation",

            // Pirc Defense
            "1.e4 d6 2.d4 Nf6 3.Nc3 g6": "Pirc Defense",

            // Modern Defense
            "1.e4 g6": "Modern Defense",

            // Alekhine's Defense
            "1.e4 Nf6": "Alekhine's Defense",

            // Hypermodern openings
            "1.Nf3": "Réti Opening",
            "1.g3": "King's Fianchetto Opening",
            "1.b3": "Nimzo-Larsen Attack"
        };

        // Check if our move sequence matches any known opening pattern
        for (const [pattern, name] of Object.entries(openingPatterns)) {
            if (moveHistory.startsWith(pattern)) {
                return name;
            }
        }

        // If no specific opening is identified, try to classify by structure
        if (moveHistory.includes("1.e4 e5")) {
            return "Open Game";
        } else if (moveHistory.includes("1.e4") && !moveHistory.includes("1.e4 e5")) {
            return "Semi-Open Game";
        } else if (moveHistory.includes("1.d4 d5")) {
            return "Closed Game";
        } else if (moveHistory.includes("1.d4") && !moveHistory.includes("1.d4 d5")) {
            return "Semi-Closed Game";
        } else if (moveHistory.includes("1.c4") || moveHistory.includes("1.Nf3") || moveHistory.includes("1.g3")) {
            return "Flank Opening";
        }

        // If we've made at least 3 moves but can't identify the opening
        if (this.moveHistory.length >= 6) { // 3 moves for each player
            return "Irregular Opening";
        }

        // Not enough moves to identify an opening yet
        return null;
    }

    // Convert move history to standard algebraic notation
    getMoveHistoryNotation() {
        let notation = "";
        let moveNumber = 1;

        for (let i = 0; i < this.moveHistory.length; i++) {
            const move = this.moveHistory[i];

            // Add move number for white's moves
            if (i % 2 === 0) {
                notation += moveNumber + ".";
                moveNumber++;
            }

            // Add the move notation
            notation += move.notation + " ";
        }

        return notation.trim();
    }


    // Find the sharpest move from possible moves (placeholder)
    findSharpestMove(possibleMoves) {
        // In a real implementation, this would evaluate which move leads to the sharpest position
        // For now, just return the first move
        return possibleMoves[0];
    }

    // Find the most solid move from possible moves (placeholder)
    findSolidMove(possibleMoves) {
        // In a real implementation, this would evaluate which move leads to the most solid position
        // For now, just return the first move
        return possibleMoves[0];
    }

    // Find the most positional move from possible moves (placeholder)
    findPositionalMove(possibleMoves) {
        // In a real implementation, this would evaluate which move leads to the best positional advantage
        // For now, just return the first move
        return possibleMoves[0];
    }

    // Find the most tactical move from possible moves (placeholder)
    findTacticalMove(possibleMoves) {
        // In a real implementation, this would evaluate which move leads to the most tactical position
        // For now, just return the first move
        return possibleMoves[0];
    }

    // Find the most hypermodern move from possible moves (placeholder)
    findHypermodernMove(possibleMoves) {
        // In a real implementation, this would evaluate which move aligns with hypermodern principles
        // For now, just return the first move
        return possibleMoves[0];
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Create HTML structure for the chess board
    const boardContainer = document.getElementById('board');
    if (boardContainer) {
        boardContainer.innerHTML = `
            <div id="chessBoard"></div>
            <div class="game-info">
                <div class="score-display">
                    <div>White: <span id="whiteScore">0</span></div>
                    <div>Black: <span id="blackScore">0</span></div>
                </div>
                <div class="timer-container">
                    <svg class="timer-svg" width="60" height="60" viewBox="0 0 100 100">
                        <circle class="timer-circle timer-background" cx="50" cy="50" r="45" />
                        <circle class="timer-circle timer-progress" cx="50" cy="50" r="45" stroke-dashoffset="0" />
                    </svg>
                    <div class="timer-text" id="timerValue">0.0s</div>
                </div>
                <div class="move-history-container">
                    <h4>Move History</h4>
                    <div id="moveHistory"></div>
                </div>
            </div>
        `;

        // Add CSS for pawn promotion modal
        const style = document.createElement('style');
        style.textContent = `
            .promotion-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .promotion-modal-content {
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                text-align: center;
            }
            
            .promotion-options {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 15px;
            }
            
            .promotion-option {
                width: 60px;
                height: 60px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 40px;
                cursor: pointer;
                border: 2px solid #ccc;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .promotion-option:hover {
                background-color: #f0f0f0;
                border-color: #333;
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize the game
    window.chessGame = new EnhancedChess();

    // Initialize the move sequence analyzer
    window.sequenceAnalyzer = new MoveSequenceAnalyzer(window.chessGame);

    // Initialize the piece depth chart
    window.pieceChart = new PieceDepthChart(window.chessGame);

    // Setup additional event listeners for new features
    setupAdditionalEventListeners();
});

// Setup additional event listeners for new features
export function setupAdditionalEventListeners() {
    // Analyze sequences button
    const analyzeSequencesBtn = document.getElementById('analyze-sequences');
    if (analyzeSequencesBtn) {
        analyzeSequencesBtn.addEventListener('click', () => {
            const depthSelect = document.getElementById('sequence-depth');
            const depth = depthSelect ? parseInt(depthSelect.value) : 4;
            window.sequenceAnalyzer.startAnalysis(depth);
        });
    }

    // Stop sequence analysis button
    const stopAnalysisBtn = document.getElementById('stop-sequence-analysis');
    if (stopAnalysisBtn) {
        stopAnalysisBtn.addEventListener('click', () => {
            window.sequenceAnalyzer.stopAnalysis();
        });
    }

    // Generate piece chart button
    const generateChartBtn = document.getElementById('generate-piece-chart');
    if (generateChartBtn) {
        generateChartBtn.addEventListener('click', () => {
            // Reset chart data
            window.pieceChart.resetData();

            // Get the depth array from input or use default
            const depthInput = document.getElementById('depth-array');
            let depths = [1, 2, 3, 4];

            if (depthInput && depthInput.value) {
                try {
                    depths = depthInput.value.split(',')
                        .map(d => parseInt(d.trim()))
                        .filter(d => !isNaN(d) && d > 0 && d <= 10);

                    if (depths.length === 0) {
                        depths = [1, 2, 3, 4];
                    }
                } catch (e) {
                    console.error('Error parsing depth array:', e);
                }
            }

            // Start analysis for piece chart
            analyzePositionForPieceChart(depths);
        });
    }

    const newGameBtn = document.getElementById('new-game');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            // Reset game state completely
            this.gameOver = false;
            this.currentPlayer = 'white';
            this.selectedSquare = null;
            this.moveCount = 0;
            this.moveHistory = [];
            this.previousPositions = new Map();
            
            // Reset the board
            this.setupBoard();
            this.renderBoard();
            this.updateGameStatus();
            this.updateScoreDisplay();
            this.updateMoveHistory();
            
            // Reset AI thinking state
            this.aiThinking = false;
            this.aiThinkingMoves = [];
            
            // Show notification
            this.showNotification('New game started!', 2000);
        });
    }
    

}