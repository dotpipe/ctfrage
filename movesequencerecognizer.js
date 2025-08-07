// Class for recognizing and naming move sequences
class MoveSequenceRecognizer {
    constructor(chessGame) {
        this.chessGame = chessGame;

        // Database of known sequences with canonical names
        this.openingSequences = this.initializeOpeningSequences();
        this.tacticalSequences = this.initializeTacticalSequences();

        // Track current sequence
        this.currentSequence = [];

        // Recognition settings
        this.minSequenceLength = 3;
        this.maxSequenceLength = 10;
        this.similarityThreshold = 0.8;
    }

    // Initialize database of opening sequences
    initializeOpeningSequences() {
        const sequences = new Map();

        // Format: [array of moves in algebraic notation] => {name, description, category}

        // Ruy Lopez (Spanish Opening) variations
        sequences.set("e2e4 e7e5 g1f3 b8c6 f1b5", {
            name: "Ruy Lopez (Spanish Opening)",
            description: "One of the oldest and most studied openings",
            category: "Open Game"
        });

        sequences.set("e2e4 e7e5 g1f3 b8c6 f1b5 a7a6", {
            name: "Ruy Lopez, Morphy Defense",
            description: "The most common response to the Ruy Lopez",
            category: "Open Game"
        });

        sequences.set("e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4", {
            name: "Ruy Lopez, Closed Variation",
            description: "White retreats the bishop to maintain the pin",
            category: "Open Game"
        });

        sequences.set("e2e4 e7e5 g1f3 b8c6 f1b5 g8f6", {
            name: "Ruy Lopez, Berlin Defense",
            description: "A solid defensive system popularized by Vladimir Kramnik",
            category: "Open Game"
        });

        // Italian Game variations
        sequences.set("e2e4 e7e5 g1f3 b8c6 f1c4", {
            name: "Italian Game",
            description: "A classic opening aiming for quick development",
            category: "Open Game"
        });

        sequences.set("e2e4 e7e5 g1f3 b8c6 f1c4 f8c5", {
            name: "Italian Game, Giuoco Piano",
            description: "The 'Quiet Game' with solid development",
            category: "Open Game"
        });

        sequences.set("e2e4 e7e5 g1f3 b8c6 f1c4 g8f6", {
            name: "Italian Game, Two Knights Defense",
            description: "A sharp defensive system against the Italian Game",
            category: "Open Game"
        });

        // Sicilian Defense variations
        sequences.set("e2e4 c7c5", {
            name: "Sicilian Defense",
            description: "The most popular and aggressive response to 1.e4",
            category: "Semi-Open Game"
        });

        sequences.set("e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6", {
            name: "Sicilian Defense, Najdorf Variation",
            description: "A sharp, complex variation favored by many world champions",
            category: "Semi-Open Game"
        });

        sequences.set("e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6", {
            name: "Sicilian Defense, Dragon Variation",
            description: "A fierce counterattacking system with opposite-side castling",
            category: "Semi-Open Game"
        });

        // French Defense variations
        sequences.set("e2e4 e7e6", {
            name: "French Defense",
            description: "A solid defense that counters White's center control",
            category: "Semi-Open Game"
        });

        sequences.set("e2e4 e7e6 d2d4 d7d5", {
            name: "French Defense, Main Line",
            description: "The standard continuation in the French Defense",
            category: "Semi-Open Game"
        });

        // Caro-Kann Defense variations
        sequences.set("e2e4 c7c6", {
            name: "Caro-Kann Defense",
            description: "A solid defense that supports d5 before playing it",
            category: "Semi-Open Game"
        });

        // Queen's Gambit variations
        sequences.set("d2d4 d7d5 c2c4", {
            name: "Queen's Gambit",
            description: "White offers a pawn to gain central control",
            category: "Closed Game"
        });

        sequences.set("d2d4 d7d5 c2c4 e7e6", {
            name: "Queen's Gambit Declined",
            description: "Black declines the gambit and builds a solid position",
            category: "Closed Game"
        });

        sequences.set("d2d4 d7d5 c2c4 d5c4", {
            name: "Queen's Gambit Accepted",
            description: "Black accepts the gambit pawn but must deal with development issues",
            category: "Closed Game"
        });

        // Indian Defenses
        sequences.set("d2d4 g8f6", {
            name: "Indian Defense",
            description: "Black develops the knight before committing to a pawn structure",
            category: "Semi-Closed Game"
        });

        sequences.set("d2d4 g8f6 c2c4 e7e6", {
            name: "Nimzo-Indian Defense",
            description: "A hypermodern defense that controls the center from a distance",
            category: "Semi-Closed Game"
        });

        sequences.set("d2d4 g8f6 c2c4 g7g6 b1c3 d7d5", {
            name: "Grünfeld Defense",
            description: "A hypermodern defense that immediately counters in the center",
            category: "Semi-Closed Game"
        });

        sequences.set("d2d4 g8f6 c2c4 g7g6 b1c3 f8g7", {
            name: "King's Indian Defense",
            description: "A hypermodern defense with a fianchettoed bishop",
            category: "Semi-Closed Game"
        });

        // English Opening
        sequences.set("c2c4", {
            name: "English Opening",
            description: "A flexible flank opening that can transpose to many systems",
            category: "Flank Opening"
        });

        // King's Gambit
        sequences.set("e2e4 e7e5 f2f4", {
            name: "King's Gambit",
            description: "An aggressive opening where White sacrifices a pawn for development",
            category: "Open Game"
        });

        sequences.set("e2e4 e7e5 f2f4 e5f4", {
            name: "King's Gambit Accepted",
            description: "Black accepts the gambit pawn, leading to sharp play",
            category: "Open Game"
        });

        // Add many more opening sequences...

        return sequences;
    }

    // Initialize database of tactical sequences
    initializeTacticalSequences() {
        const sequences = new Map();

        // Format: [array of moves in algebraic notation] => {name, description, category}

        // Scholar's Mate
        sequences.set("e2e4 e7e5 f1c4 b8c6 d1h5 g8f6 h5f7", {
            name: "Scholar's Mate",
            description: "A quick checkmate targeting f7",
            category: "Mating Pattern"
        });

        // Legal's Mate
        sequences.set("e2e4 e7e5 g1f3 b8c6 f1c4 d7d6 b1c3 f8g4 h2h3 g4f3 d1f3 g8f6 f3f7", {
            name: "Legal's Mate",
            description: "A classic mating pattern involving a queen sacrifice",
            category: "Mating Pattern"
        });

        // Smothered Mate
        sequences.set("g1f3 d7d6 e2e4 g8f6 b1c3 g7g6 f1c4 f8g7 e1g1 e8g8 d2d4 b8d7 c4b3 c7c5 d4d5 a7a6 a2a4 e7e6 d5e6 f7e6 c1g5 d8c7 f3d4 c5d4 d1d4 h7h6 g5h4 g6g5 h4g3 b7b5 a4b5 a6b5 a1a8 c8b7 a8b8 d7b8 c3b5 c7c6 b5d6", {
            name: "Smothered Mate",
            description: "A knight delivers checkmate to a king surrounded by its own pieces",
            category: "Mating Pattern"
        });

        // Back Rank Mate
        sequences.set("e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5c6 d7c6 e1g1 f8d6 d2d4 e5d4 f3d4 g8e7 b1c3 e8g8 c1g5 f7f6 g5h4 c8g4 d1d3 d6f4 d3g3 f4g3 h2g3 d8d7 a1d1 d7f7 f1d1 f8d8 d1d3 g4f5 e4f5 f7f5 d4f5 e7f5 d3d8 c6d8", {
            name: "Back Rank Mate",
            description: "A rook delivers checkmate on the back rank",
            category: "Mating Pattern"
        });

        // Opera Mate
        sequences.set("e2e4 e7e5 g1f3 d7d6 f1c4 f8g4 e1g1 g4f3 d1f3 g8f6 f1e1 b8c6 c4f7 e8f7 f3f6 g7f6 e1e5 d8d7 e5f5 f7g7 e4e5 d6e5 f3e5 c6e5 f5e5 d7d1 c1f4 d1a4 b1c3 a4a5 e5e7 g7g8 f4d6 a5d8 e7e8 d8e8 d6e8", {
            name: "Opera Mate",
            description: "A bishop and rook combine to deliver checkmate",
            category: "Mating Pattern"
        });

        // Add more tactical sequences...

        return sequences;
    }

    // Add a move to the current sequence
    addMove(move) {
        // Convert move to algebraic notation
        const algebraic = this.moveToAlgebraic(move);

        // Add to current sequence
        this.currentSequence.push(algebraic);

        // Limit sequence length
        if (this.currentSequence.length > this.maxSequenceLength) {
            this.currentSequence.shift();
        }

        // Try to recognize the sequence
        return this.recognizeCurrentSequence();
    }

    // Convert a move object to algebraic notation
    moveToAlgebraic(move) {
        const files = 'abcdefgh';
        const fromFile = files[move.from.col];
        const fromRank = 8 - move.from.row;
        const toFile = files[move.to.col];
        const toRank = 8 - move.to.row;

        return `${fromFile}${fromRank}${toFile}${toRank}`;
    }

    // Recognize the current sequence
    recognizeCurrentSequence() {
        if (this.currentSequence.length < this.minSequenceLength) {
            return null;
        }

        // Try to match with opening sequences
        const openingMatch = this.findMatchingSequence(this.openingSequences);
        if (openingMatch) {
            return {
                type: "opening",
                ...openingMatch
            };
        }

        // Try to match with tactical sequences
        const tacticalMatch = this.findMatchingSequence(this.tacticalSequences);
        if (tacticalMatch) {
            return {
                type: "tactical",
                ...tacticalMatch
            };
        }

        return null;
    }

    // Find a matching sequence in the provided database
    findMatchingSequence(sequenceDatabase) {
        let bestMatch = null;
        let bestSimilarity = 0;

        // Convert current sequence to a string for comparison
        const currentSequenceStr = this.currentSequence.join(' ');

        // Check each sequence in the database
        sequenceDatabase.forEach((data, sequenceStr) => {
            // Calculate similarity
            const similarity = this.calculateSequenceSimilarity(currentSequenceStr, sequenceStr);

            // Update best match if this is better
            if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
                bestSimilarity = similarity;
                bestMatch = {
                    name: data.name,
                    description: data.description,
                    category: data.category,
                    similarity: similarity
                };
            }
        });

        return bestMatch;
    }

    // Calculate similarity between two sequences
    calculateSequenceSimilarity(sequence1, sequence2) {
        // Simple implementation - check if one is a prefix of the other
        if (sequence2.startsWith(sequence1)) {
            return sequence1.length / sequence2.length;
        }

        if (sequence1.startsWith(sequence2)) {
            return sequence2.length / sequence1.length;
        }

        // Count matching moves
        const moves1 = sequence1.split(' ');
        const moves2 = sequence2.split(' ');

        let matchCount = 0;
        const minLength = Math.min(moves1.length, moves2.length);

        for (let i = 0; i < minLength; i++) {
            if (moves1[i] === moves2[i]) {
                matchCount++;
            } else {
                break; // Stop at first mismatch
            }
        }

        return matchCount / Math.max(moves1.length, moves2.length);
    }

    // Reset the current sequence
    resetSequence() {
        this.currentSequence = [];
    }
}

// Initialize the tutelage system when the chess game is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the chess game to initialize
    setTimeout(() => {
        if (window.chessGame) {
            // Initialize the tutelage system
            window.chessTutelage = new ChessTutelage(window.chessGame);

            // Initialize the sequence recognizer
            window.sequenceRecognizer = new MoveSequenceRecognizer(window.chessGame);

            console.log("Chess Tutelage System initialized");

            // Hook into the move history update to recognize sequences
            const originalUpdateMoveHistory = window.chessGame.updateMoveHistory;
            window.chessGame.updateMoveHistory = function () {
                // Call original method
                originalUpdateMoveHistory.call(this);

                // If we have a move history and sequence recognizer
                if (this.moveHistory && this.moveHistory.length > 0 && window.sequenceRecognizer) {
                    // Get the last move
                    const lastMove = this.moveHistory[this.moveHistory.length - 1];

                    // Add to sequence recognizer
                    const recognizedSequence = window.sequenceRecognizer.addMove(lastMove);

                    // If a sequence was recognized, show notification
                    if (recognizedSequence) {
                        this.showNotification(`${recognizedSequence.name} detected!`, 3000);

                        // Update opening name display if it's an opening
                        if (recognizedSequence.type === "opening") {
                            const openingNameElement = document.getElementById('openingName');
                            if (openingNameElement) {
                                openingNameElement.textContent = recognizedSequence.name;
                            }
                        }
                    }
                }
            };
        }
    }, 1000);
});
