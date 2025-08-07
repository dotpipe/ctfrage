/**
 * Counter Moves Manager for Chess Tutor
 */
export class CounterMovesManager {
    constructor() {
        this.counterMoves = new Map();
        this.loadCounterMoves();
        this.setupEventListeners();
    }

    /**
     * Load counter moves from localStorage
     */
    loadCounterMoves() {
        try {
            const savedMoves = localStorage.getItem('chess_counter_moves');
            if (savedMoves) {
                const parsedMoves = JSON.parse(savedMoves);
                if (Array.isArray(parsedMoves)) {
                    this.counterMoves = new Map(parsedMoves);
                    console.log(`Loaded ${this.counterMoves.size} counter moves`);
                }
            }
        } catch (error) {
            console.error("Error loading counter moves:", error);
        }

        this.renderCounterMoves();
    }

    /**
     * Save counter moves to localStorage
     */
    saveCounterMoves() {
        try {
            const movesArray = Array.from(this.counterMoves.entries());
            localStorage.setItem('chess_counter_moves', JSON.stringify(movesArray));
            console.log(`Saved ${this.counterMoves.size} counter moves`);
        } catch (error) {
            console.error("Error saving counter moves:", error);
        }
    }

    /**
     * Set up event listeners for the counter moves UI
     */
    setupEventListeners() {
        // Add counter move button
        const addButton = document.getElementById('add-counter-move');
        if (addButton) {
            addButton.addEventListener('click', () => this.addCounterMove());
        }

        // Listen for counter move suggestions from the AI
        document.addEventListener('chess-ai-counter-move', (event) => {
            if (event.detail && event.detail.opponentMove && event.detail.counterMove) {
                this.suggestCounterMove(event.detail.opponentMove, event.detail.counterMove);
            }
        });
    }

    /**
     * Add a new counter move
     */
    addCounterMove() {
        const opponentMoveInput = document.getElementById('opponent-move');
        const counterMoveInput = document.getElementById('counter-move');
        const noteInput = document.getElementById('counter-move-note');

        if (!opponentMoveInput || !counterMoveInput) return;

        const opponentMove = opponentMoveInput.value.trim();
        const counterMove = counterMoveInput.value.trim();
        const note = noteInput ? noteInput.value.trim() : '';

        if (!opponentMove || !counterMove) {
            alert('Please enter both opponent move and counter move');
            return;
        }

        // Validate move format (simple validation)
        const movePattern = /^[a-h][1-8][a-h][1-8]$/;
        if (!movePattern.test(opponentMove) || !movePattern.test(counterMove)) {
            alert('Moves should be in format "e2e4" (from square + to square)');
            return;
        }

        // Add to counter moves map
        this.counterMoves.set(opponentMove, {
            counterMove,
            note,
            addedOn: new Date().toISOString(),
            successCount: 0,
            useCount: 0
        });

        // Save and render
        this.saveCounterMoves();
        this.renderCounterMoves();

        // Clear inputs
        opponentMoveInput.value = '';
        counterMoveInput.value = '';
        if (noteInput) noteInput.value = '';

        // Show success message
        this.showSuccessMessage('Counter move added successfully!');

        // Pulse the tutor button to indicate new content
        if (window.pulseTutorButton) {
            window.pulseTutorButton();
        }
    }

    /**
     * Suggest a counter move from AI analysis
     * @param {string} opponentMove - The opponent's move
     * @param {string} counterMove - The suggested counter move
     */
    suggestCounterMove(opponentMove, counterMove) {
        // Check if we already have this counter move
        if (this.counterMoves.has(opponentMove)) {
            const existing = this.counterMoves.get(opponentMove);
            if (existing.counterMove === counterMove) {
                // Just increment success count
                existing.successCount++;
                this.saveCounterMoves();
                return;
            }
        }

        // Add notification about the suggestion
        const container = document.getElementById('counter-moves-container');
        if (container) {
            const suggestion = document.createElement('div');
            suggestion.className = 'counter-move-suggestion';
            suggestion.innerHTML = `
        <div class="suggestion-header">
          <strong>AI Suggests:</strong>
          <button class="accept-suggestion">Accept</button>
        </div>
        <div class="suggestion-content">
          Against ${this.formatMoveForDisplay(opponentMove)}, 
          play ${this.formatMoveForDisplay(counterMove)}
        </div>
      `;

            container.insertBefore(suggestion, container.firstChild);

            // Add event listener to accept button
            const acceptButton = suggestion.querySelector('.accept-suggestion');
            if (acceptButton) {
                acceptButton.addEventListener('click', () => {
                    this.counterMoves.set(opponentMove, {
                        counterMove,
                        note: 'AI suggested',
                        addedOn: new Date().toISOString(),
                        successCount: 1,
                        useCount: 0
                    });

                    this.saveCounterMoves();
                    this.renderCounterMoves();
                    suggestion.remove();

                    this.showSuccessMessage('AI suggestion added to counter moves!');
                });
            }
        }
    }

    /**
     * Format a move for display
     * @param {string} move - Move in format "e2e4"
     * @returns {string} Formatted move
     */
    formatMoveForDisplay(move) {
        if (!move || move.length !== 4) return move;

        return `${move.substring(0, 2)} → ${move.substring(2, 4)}`;
    }

    /**
     * Delete a counter move
     * @param {string} opponentMove - The opponent move to delete
     */
    deleteCounterMove(opponentMove) {
        if (confirm('Are you sure you want to delete this counter move?')) {
            this.counterMoves.delete(opponentMove);
            this.saveCounterMoves();
            this.renderCounterMoves();
        }
    }

    /**
     * Render counter moves in the UI
     */
    renderCounterMoves() {
        const listElement = document.getElementById('counter-moves-list');
        const noMovesMessage = document.getElementById('no-counter-moves-message');

        if (!listElement) return;

        // Clear existing content
        listElement.innerHTML = '';

        if (this.counterMoves.size === 0) {
            if (noMovesMessage) noMovesMessage.style.display = 'block';
            return;
        }

        if (noMovesMessage) noMovesMessage.style.display = 'none';

        // Sort counter moves by success rate
        const sortedMoves = Array.from(this.counterMoves.entries())
            .sort((a, b) => {
                const successRateA = a[1].useCount > 0 ? a[1].successCount / a[1].useCount : 0;
                const successRateB = b[1].useCount > 0 ? b[1].successCount / b[1].useCount : 0;
                return successRateB - successRateA;
            });

        // Add each counter move to the list
        for (const [opponentMove, data] of sortedMoves) {
            const moveItem = document.createElement('div');
            moveItem.className = 'counter-move-item';

            const successRate = data.useCount > 0
                ? Math.round((data.successCount / data.useCount) * 100)
                : 0;

            moveItem.innerHTML = `
        <div class="counter-move-header">
          <div class="counter-move-title">
            ${this.formatMoveForDisplay(opponentMove)} → ${this.formatMoveForDisplay(data.counterMove)}
          </div>
          <div class="counter-move-actions">
            <span class="counter-move-action apply" title="Apply this counter move">
              <i class="fas fa-play"></i>
            </span>
            <span class="counter-move-action delete" title="Delete this counter move">
              <i class="fas fa-trash"></i>
            </span>
          </div>
        </div>
        <div class="counter-move-details">
          Success rate: ${successRate}% (${data.successCount}/${data.useCount})
        </div>
        ${data.note ? `<div class="counter-move-note">${data.note}</div>` : ''}
      `;

            // Add event listeners
            const deleteAction = moveItem.querySelector('.counter-move-action.delete');
            if (deleteAction) {
                deleteAction.addEventListener('click', () => this.deleteCounterMove(opponentMove));
            }

            const applyAction = moveItem.querySelector('.counter-move-action.apply');
            if (applyAction) {
                applyAction.addEventListener('click', () => this.applyCounterMove(opponentMove, data.counterMove));
            }

            listElement.appendChild(moveItem);
        }
    }

    /**
     * Apply a counter move to the current game
     * @param {string} opponentMove - The opponent move
     * @param {string} counterMove - The counter move to apply
     */
    applyCounterMove(opponentMove, counterMove) {
        // Increment use count
        if (this.counterMoves.has(opponentMove)) {
            const data = this.counterMoves.get(opponentMove);
            data.useCount++;
            this.saveCounterMoves();
            this.renderCounterMoves();
        }

        // Dispatch event for the chess game to handle
        const event = new CustomEvent('apply-counter-move', {
            detail: {
                opponentMove,
                counterMove
            }
        });
        document.dispatchEvent(event);

        this.showSuccessMessage('Counter move applied!');
    }

    /**
     * Record the success of a counter move
     * @param {string} opponentMove - The opponent move
     * @param {boolean} wasSuccessful - Whether the counter move was successful
     */
    recordCounterMoveSuccess(opponentMove, wasSuccessful) {
        if (this.counterMoves.has(opponentMove)) {
            const data = this.counterMoves.get(opponentMove);
            if (wasSuccessful) {
                data.successCount++;
            }
            this.saveCounterMoves();
            this.renderCounterMoves();
        }
    }

    /**
     * Show a success message
     * @param {string} message - The message to show
     */
    showSuccessMessage(message) {
        const container = document.getElementById('counter-moves-container');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'success-message';
        messageElement.textContent = message;

        container.insertBefore(messageElement, container.firstChild);

        // Remove after animation completes
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }

    /**
     * Get a counter move for a specific opponent move
     * @param {string} opponentMove - The opponent's move
     * @returns {string|null} The counter move or null if not found
     */
    getCounterMove(opponentMove) {
        if (this.counterMoves.has(opponentMove)) {
            const data = this.counterMoves.get(opponentMove);
            data.useCount++;
            this.saveCounterMoves();
            return data.counterMove;
        }
        return null;
    }
}
