// import AIPersonalityDisplay from './aipersonalitydisplay.js';
import ChessQueueSystem from './chessqueuesystem.js';
import { EnhancedChess } from './enhancedchess.js';
import { ChessMatchmaker } from './chessmatchmaker.js';
import { ChessChat } from './chesschat.js';
import { ChessTutelage } from './chesstutelage.js';
import { LearningEaseManager } from './learningeasemanager.js';
import { MoveSequenceAnalyzer } from './movesequenceanalyzer.js';
import { PieceDepthChart } from './moveanalyzer.js';
import { CounterMovesManager } from './countermovesmanager.js';


// In your chess game initialization
document.addEventListener('apply-counter-move', (event) => {
    if (event.detail && event.detail.counterMove) {
        const move = parseCounterMove(event.detail.counterMove);
        if (move) {
            makeMove(move.from, move.to);
        }
    }
});

// Helper function to parse counter move
function parseCounterMove(moveString) {
    if (!moveString || moveString.length !== 4) return null;

    const from = moveString.substring(0, 2);
    const to = moveString.substring(2, 4);

    return { from, to };
}

// After game ends
function gameEnded(result) {
    // ... existing code ...

    // Record counter move success
    const playerWon = result === 'player_win';

    // Get the last opponent move and counter move used
    if (lastOpponentMove && lastCounterMove) {
        window.recordCounterMoveSuccess(lastOpponentMove, playerWon);
    }
}

// /**
//  * Make a move on the chess board
//  * @param {string} moveString - The move in algebraic notation (e.g., "e2e4")
//  * @param {Object} chessGame - Reference to the chess game object
//  * @returns {boolean} - True if the move was successful, false otherwise
//  */
// function makeMove(moveString, chessGame) {
//     if (!chessGame) {
//         console.error("Chess game reference is required");
//         return false;
//     }

//     if (!moveString || moveString.length !== 4) {
//         console.error("Invalid move format. Please use the format 'e2e4'.");
//         return false;
//     }

//     try {
//         // Parse the move string
//         const files = 'abcdefgh';
//         const fromCol = files.indexOf(moveString[0]);
//         const fromRow = 8 - parseInt(moveString[1]);
//         const toCol = files.indexOf(moveString[2]);
//         const toRow = 8 - parseInt(moveString[3]);

//         // Check if the move is valid
//         if (fromCol < 0 || fromCol > 7 || fromRow < 0 || fromRow > 7 ||
//             toCol < 0 || toCol > 7 || toRow < 0 || toRow > 7) {
//             console.error("Invalid move coordinates.");
//             return false;
//         }

//         // Check if there's a piece at the from position
//         if (!chessGame.board[fromRow][fromCol]) {
//             console.error("There's no piece at the starting square.");
//             return false;
//         }

//         // Check if the piece belongs to the current player
//         const piece = chessGame.board[fromRow][fromCol];
//         if (piece.color !== chessGame.currentPlayer) {
//             console.error(`It's ${chessGame.currentPlayer}'s turn to move.`);
//             return false;
//         }

//         // Check if the move is valid according to chess rules
//         if (!chessGame.isValidMove(fromRow, fromCol, toRow, toCol)) {
//             console.error("That's not a valid move for this piece.");
//             return false;
//         }

//         // Make the move
//         chessGame.makeMove(fromRow, fromCol, toRow, toCol);

//         console.log(`Move ${moveString} executed successfully`);

//         // If playing against AI, trigger AI move after a delay
//         if (chessGame.currentPlayer === chessGame.aiColor && chessGame.makeAIMove) {
//             setTimeout(() => {
//                 chessGame.makeAIMove();
//             }, 500);
//         }

//         return true;
//     } catch (error) {
//         console.error("Error making move:", error);
//         return false;
//     }
// }

