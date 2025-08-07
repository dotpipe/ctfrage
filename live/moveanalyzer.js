
// Simple placeholder classes for analysis features
export class MoveSequenceAnalyzer {
    constructor(chessGame) {
        this.chessGame = chessGame;
        this.analyzing = false;
    }

    startAnalysis(depth) {
        console.log(`Starting sequence analysis at depth ${depth}`);
        this.analyzing = true;
        // In a real implementation, this would analyze move sequences
        setTimeout(() => {
            this.stopAnalysis();
        }, 2000);
    }

    stopAnalysis() {
        console.log('Stopping sequence analysis');
        this.analyzing = false;
    }
}

export class PieceDepthChart {
    constructor(chessGame) {
        this.chessGame = chessGame;
        this.data = {};
    }

    resetData() {
        this.data = {};
    }

    addDataPoint(pieceType, depth, score) {
        if (!this.data[pieceType]) {
            this.data[pieceType] = {};
        }

        if (!this.data[pieceType][depth]) {
            this.data[pieceType][depth] = [];
        }

        this.data[pieceType][depth].push(score);
    }

    renderChart() {
        console.log('Rendering piece depth chart');
        // In a real implementation, this would render a chart
    }
}

// Analyze position for piece chart
export async function analyzePositionForPieceChart(depths) {
    const chessGame = window.chessGame;
    const pieceChart = window.pieceChart;

    // Show notification
    chessGame.showNotification(`Analyzing position at depths: ${depths.join(', ')}`, 2000);

    // Get all possible moves for current player
    const moves = chessGame.getAllPossibleMoves(chessGame.currentPlayer);

    // Group moves by piece type
    const movesByPiece = {};
    moves.forEach(move => {
        const pieceType = move.piece.type;
        if (!movesByPiece[pieceType]) {
            movesByPiece[pieceType] = [];
        }
        movesByPiece[pieceType].push(move);
    });

    // Analyze each piece type at each depth
    for (const depth of depths) {
        // Update status
        document.querySelector('.thinking-status').textContent = `Analyzing at depth ${depth}...`;

        // Process each piece type
        for (const pieceType in movesByPiece) {
            const pieceMoves = movesByPiece[pieceType];

            // Take up to 3 moves per piece type for analysis
            const movesToAnalyze = pieceMoves.slice(0, 3);

            // Evaluate each move at this depth
            for (const move of movesToAnalyze) {
                const score = chessGame.evaluateMoveWithLookahead(move, depth);
                pieceChart.addDataPoint(pieceType, depth, score);
            }
        }

        // Render chart after each depth
        pieceChart.renderChart();

        // Small delay between depths
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Final render
    pieceChart.renderChart();
    document.querySelector('.thinking-status').textContent = `Analysis complete at depths: ${depths.join(', ')}`;
}

// Example usage:
document.addEventListener('apply-counter-move', (event) => {
    if (event.detail && event.detail.counterMove) {
        makeMove(event.detail.counterMove, window.chessGame);
    }
});

// Or with a button click:
// document.getElementById('make-move-btn').addEventListener('click', () => {
//     const moveInput = document.getElementById('move-input').value;
//     makeMove(moveInput, window.chessGame);
// });

// Listen for counter move applications
document.addEventListener('apply-counter-move', (event) => {
    if (event.detail && event.detail.counterMove) {
        makeMove(event.detail.counterMove, window.chessGame);
    }
});

export function createChatWindow() {
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
    document.getElementById('minimize-chat').addEventListener('click', toggleChatWindow);
    document.getElementById('send-chat').addEventListener('click', sendChatMessage);
    document.getElementById('chat-input').addEventListener('keypress', e => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

// This could be generated on page load or passed from PHP
const mySessionId = generateSessionId();
let opponentSessionId = null;

export function generateSessionId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

// Store my session ID in localStorage
localStorage.setItem('chess_player_id', mySessionId);

export function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    const timestamp = new Date().getTime();
    const chatMessage = {
        sender: mySessionId,
        message: message,
        timestamp: timestamp
    };

    // Add to my chat window
    addMessageToChat(chatMessage, true);

    // Store in localStorage for the other player to see
    const chatKey = 'chess_chat_' + timestamp;
    localStorage.setItem(chatKey, JSON.stringify(chatMessage));

    // Clear input
    input.value = '';
}

export function addMessageToChat(chatMessage, isFromMe) {
    const messagesContainer = document.getElementById('chat-messages');
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

    messageDiv.textContent = chatMessage.message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

export function toggleChatWindow() {
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

let lastCheckedTimestamp = Date.now();

export function pollForNewMessages() {
    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // Check if it's a chat message
        if (key.startsWith('chess_chat_')) {
            const chatMessage = JSON.parse(localStorage.getItem(key));

            // If it's from the opponent and we haven't seen it yet
            if (chatMessage.sender !== mySessionId && chatMessage.timestamp > lastCheckedTimestamp) {
                addMessageToChat(chatMessage, false);
            }
        }
    }

    lastCheckedTimestamp = Date.now();
}

// Poll every 5 seconds
const chatPollInterval = setInterval(pollForNewMessages, 5000);

export function handleGameEnd(result) {
    // Add a system message about the game result
    const gameEndMessage = {
        sender: 'system',
        message: `Game over! ${result}`,
        timestamp: Date.now()
    };

    addMessageToChat(gameEndMessage, false);

    // Option 1: Clear chat history
    clearChatHistory();

    // Option 2: Keep chat history but stop polling
    // clearInterval(chatPollInterval);
}

export function clearChatHistory() {
    // Remove all chat messages from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('chess_chat_')) {
            localStorage.removeItem(key);
        }
    }

    // Clear the chat window
    document.getElementById('chat-messages').innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
    createChatWindow();

    // Hook into the game's end event
    // This depends on how your chess game signals the end
    document.addEventListener('game-over', (event) => {
        handleGameEnd(event.detail.result);
    });
});

