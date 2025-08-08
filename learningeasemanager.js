import { CounterMovesManager } from './countermovesmanager.js';


/**
 * LearningEaseManager - Enhanced version with bookstyle learning
 * Extends the ChessTutelage system with advanced learning capabilities
 */
export class LearningEaseManager {
    /**
     * Initialize the Learning Ease Manager
     * @param {ChessTutelage} tutelageSystem - The existing chess tutelage system
     */
    constructor(tutelageSystem) {
        this.tutelageSystem = tutelageSystem;
        this.chessGame = tutelageSystem.chessGame;

        // Learning ease settings (with defaults)
        this.learningEasePercentage = 50.0; // Default to middle value (0-100)
        this.learningEnabled = true; // Default to enabled
        this.thoughtBalloonsEnabled = true; // Default to enabled
        this.bookstyleLearningEnabled = false; // Default to disabled

        // Track current difficulty level
        this.currentDifficultyLevel = this.chessGame.aiLevel || 3;

        // Initialize move buckets for bookstyle learning
        this.moveBuckets = {
            // Each difficulty level (1-8) will have its own bucket
            // Format: { positionFEN: { move: count, ... }, ... }
        };

        // Counter-strategy database
        this.counterStrategies = {
            // Format: { playerPattern: { response: count, ... }, ... }
        };

        // Load saved settings and move buckets from localStorage
        this.loadSettings();
        this.loadMoveBuckets();

        // Create UI elements
        this.createLearningEaseUI();

        // Initialize thought balloon system
        this.thoughtBalloonActive = this.thoughtBalloonsEnabled;
        this.thoughtBalloonTimeout = null;
        this.createThoughtBalloonElement();

        // Set up quip templates
        this.initializeQuipTemplates();

        // Set up event listeners
        this.setupEventListeners();

        // Apply initial learning rate based on settings
        this.updateLearningRate();

        // Track player's move patterns (last 5 moves)
        this.playerMoveHistory = [];

        // Track positions where the player consistently makes the same move
        this.playerPatternDatabase = {};
    }

    // Add to learningeasemanager.js:
cleanupOldData() {
    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000); // 90 days in milliseconds
    
    // Check if we need to reset data
    const lastPlayedDate = localStorage.getItem('chess_last_played_date');
    if (lastPlayedDate && parseInt(lastPlayedDate) < ninetyDaysAgo) {
        console.log("Data is older than 90 days, resetting learning data");
        this.resetLearningData();
    }
    
    // Update last played date
    localStorage.setItem('chess_last_played_date', now.toString());
    
    // Also clean up any individual old entries
    for (const pattern in this.playerPatternDatabase) {
        if (this.playerPatternDatabase[pattern].lastSeen < ninetyDaysAgo) {
            delete this.playerPatternDatabase[pattern];
        }
    }
    
    // Save the cleaned data
    this.saveMoveBuckets();
}

// Add this method to reset learning data
resetLearningData() {
    this.moveBuckets = {};
    for (let level = 1; level <= 8; level++) {
        this.moveBuckets[level] = {};
    }
    this.counterStrategies = {};
    this.playerPatternDatabase = {};
    this.playerMoveHistory = [];
    
    // Save the reset data
    this.saveMoveBuckets();
    console.log("Learning data has been reset");
}

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('chessTutelage_learningEaseSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.learningEasePercentage = settings.learningEasePercentage || 50.0;
                this.learningEnabled = settings.learningEnabled !== undefined ? settings.learningEnabled : true;
                this.thoughtBalloonsEnabled = settings.thoughtBalloonsEnabled !== undefined ? settings.thoughtBalloonsEnabled : true;
                this.bookstyleLearningEnabled = settings.bookstyleLearningEnabled !== undefined ? settings.bookstyleLearningEnabled : false;

                console.log("Loaded learning ease settings from localStorage");
            }
        } catch (error) {
            console.error("Error loading learning ease settings:", error);
            // Use defaults if there's an error
        }
    }

    /**
     * Load move buckets from localStorage
     */
    loadMoveBuckets() {
        try {
            // Load move buckets for each difficulty level
            for (let level = 1; level <= 8; level++) {
                const savedBucket = localStorage.getItem(`chessTutelage_moveBucket_${level}`);
                if (savedBucket) {
                    this.moveBuckets[level] = JSON.parse(savedBucket);
                } else {
                    this.moveBuckets[level] = {};
                }
            }

            // Load counter-strategies
            const savedCounterStrategies = localStorage.getItem('chessTutelage_counterStrategies');
            if (savedCounterStrategies) {
                this.counterStrategies = JSON.parse(savedCounterStrategies);
            }

            // Load player pattern database
            const savedPatternDatabase = localStorage.getItem('chessTutelage_playerPatterns');
            if (savedPatternDatabase) {
                this.playerPatternDatabase = JSON.parse(savedPatternDatabase);
            }

            console.log("Loaded move buckets and counter-strategies from localStorage");
        } catch (error) {
            console.error("Error loading move buckets:", error);
            // Initialize empty buckets if there's an error
            for (let level = 1; level <= 8; level++) {
                this.moveBuckets[level] = {};
            }
            this.counterStrategies = {};
            this.playerPatternDatabase = {};
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const settings = {
                learningEasePercentage: this.learningEasePercentage,
                learningEnabled: this.learningEnabled,
                thoughtBalloonsEnabled: this.thoughtBalloonsEnabled,
                bookstyleLearningEnabled: this.bookstyleLearningEnabled
            };

            localStorage.setItem('chessTutelage_learningEaseSettings', JSON.stringify(settings));
        } catch (error) {
            console.error("Error saving learning ease settings:", error);
        }
    }

    /**
     * Save move buckets to localStorage
     */
    saveMoveBuckets() {
        try {
            // Save move buckets for each difficulty level
            for (let level = 1; level <= 8; level++) {
                if (this.moveBuckets[level]) {
                    localStorage.setItem(`chessTutelage_moveBucket_${level}`, JSON.stringify(this.moveBuckets[level]));
                }
            }

            // Save counter-strategies
            localStorage.setItem('chessTutelage_counterStrategies', JSON.stringify(this.counterStrategies));

            // Save player pattern database
            localStorage.setItem('chessTutelage_playerPatterns', JSON.stringify(this.playerPatternDatabase));

        } catch (error) {
            console.error("Error saving move buckets:", error);
        }
    }
    /**
     * Detect the current game phase (opening, middlegame, endgame)
     * @returns {string} The current game phase
     */
    detectGamePhase() {
        // Count material to determine game phase
        let totalMaterial = 0;
        let pieceCount = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.chessGame.board[row][col];
                if (piece && piece.type !== 'king') {
                    totalMaterial += this.chessGame.pieceValues[piece.type];
                    pieceCount++;
                }
            }
        }

        // Determine game phase based on material and move count
        if (this.chessGame.moveCount < 10 || totalMaterial > 6000) {
            return 'opening';
        } else if (pieceCount < 10 || totalMaterial < 3000) {
            return 'endgame';
        } else {
            return 'middlegame';
        }
    }

    /**
     * Evaluate the success of a counter strategy based on position change
     * @param {string} initialPosition - The position FEN before the counter move
     * @param {string} currentPosition - The current position FEN
     * @returns {number} Success score (-1 to 1, higher is better for AI)
     */
    evaluateCounterStrategySuccess(initialPosition, currentPosition) {
        // If we don't have both positions, can't evaluate
        if (!initialPosition || !currentPosition) return 0;

        // Get evaluations for both positions
        const initialEval = this.chessGame.evaluatePosition();

        // Calculate change in evaluation (from AI perspective)
        const evalChange = this.chessGame.aiColor === 'white' ?
            initialEval - this.chessGame.evaluatePosition() :
            this.chessGame.evaluatePosition() - initialEval;

        // Normalize to a -1 to 1 scale
        return Math.max(-1, Math.min(1, evalChange / 200));
    }

    /**
     * Analyze the strength of a detected player pattern
     * @param {string} pattern - The pattern signature
     * @returns {Object} Analysis results with strength score and suggested counters
     */
    analyzePatternStrength(pattern) {
        if (!this.counterStrategies[pattern]) {
            return { strength: 0, counters: [] };
        }

        // Calculate how consistently the player uses this pattern
        const patternData = this.playerPatternDatabase[pattern] || { count: 0 };
        const consistency = Math.min(1, patternData.count / 10); // Max out at 10 occurrences

        // Find the best counter moves
        const counters = [];
        let totalSuccess = 0;
        let totalAttempts = 0;

        for (const [move, data] of Object.entries(this.counterStrategies[pattern])) {
            if (data.attempts > 0) {
                const successRate = data.successes / data.attempts;
                counters.push({
                    move,
                    successRate,
                    attempts: data.attempts
                });

                totalSuccess += data.successes;
                totalAttempts += data.attempts;
            }
        }

        // Sort counters by success rate
        counters.sort((a, b) => b.successRate - a.successRate);

        // Calculate overall pattern strength (how dangerous it is)
        // Higher consistency and lower counter success rate means stronger pattern
        const overallSuccessRate = totalAttempts > 0 ? totalSuccess / totalAttempts : 0;
        const strength = consistency * (1 - overallSuccessRate);

        return {
            strength,
            counters: counters.slice(0, 3) // Top 3 counters
        };
    }

    /**
     * Clean up old or rarely used data to prevent storage bloat
     */
    cleanupOldData() {
        const now = Date.now();
        const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Clean up player pattern database
        for (const [pattern, data] of Object.entries(this.playerPatternDatabase)) {
            // Remove patterns not seen in the last month and used less than 3 times
            if (data.lastSeen < oneMonthAgo && data.count < 3) {
                delete this.playerPatternDatabase[pattern];
            }
        }

        // Clean up counter strategies for patterns that no longer exist
        for (const pattern in this.counterStrategies) {
            if (!this.playerPatternDatabase[pattern]) {
                delete this.counterStrategies[pattern];
            }
        }

        // Clean up move buckets (keep only positions seen multiple times)
        for (let level = 1; level <= 8; level++) {
            if (this.moveBuckets[level]) {
                for (const [position, moves] of Object.entries(this.moveBuckets[level])) {
                    // Calculate total occurrences of this position
                    let totalCount = 0;
                    for (const count of Object.values(moves)) {
                        totalCount += count;
                    }

                    // Remove positions seen only once
                    if (totalCount < 2) {
                        delete this.moveBuckets[level][position];
                    }
                }
            }
        }

        // Save the cleaned data
        this.saveMoveBuckets();
        console.log("Cleaned up old learning data");
    }

    /**
     * Export all learning data to a JSON string
     * @returns {string} JSON string containing all learning data
     */
    exportLearningData() {
        const exportData = {
            settings: {
                learningEasePercentage: this.learningEasePercentage,
                learningEnabled: this.learningEnabled,
                thoughtBalloonsEnabled: this.thoughtBalloonsEnabled,
                bookstyleLearningEnabled: this.bookstyleLearningEnabled
            },
            moveBuckets: this.moveBuckets,
            playerPatternDatabase: this.playerPatternDatabase,
            counterStrategies: this.counterStrategies
        };

        return JSON.stringify(exportData);
    }

    /**
     * Import learning data from a JSON string
     * @param {string} jsonData - JSON string containing learning data
     * @returns {boolean} True if import was successful
     */
    importLearningData(jsonData) {
        try {
            const importData = JSON.parse(jsonData);

            // Validate the data structure
            if (!importData.settings || !importData.moveBuckets) {
                console.error("Invalid learning data format");
                return false;
            }

            // Import settings
            this.learningEasePercentage = importData.settings.learningEasePercentage || 50.0;
            this.learningEnabled = importData.settings.learningEnabled !== undefined ?
                importData.settings.learningEnabled : true;
            this.thoughtBalloonsEnabled = importData.settings.thoughtBalloonsEnabled !== undefined ?
                importData.settings.thoughtBalloonsEnabled : true;
            this.bookstyleLearningEnabled = importData.settings.bookstyleLearningEnabled !== undefined ?
                importData.settings.bookstyleLearningEnabled : false;

            // Import data
            this.moveBuckets = importData.moveBuckets || {};
            this.playerPatternDatabase = importData.playerPatternDatabase || {};
            this.counterStrategies = importData.counterStrategies || {};

            // Update UI
            this.updateLevelText();
            this.updateBucketCount();
            this.updateLearningRate();

            // Save the imported data
            this.saveSettings();
            this.saveMoveBuckets();

            console.log("Successfully imported learning data");
            return true;
        } catch (error) {
            console.error("Error importing learning data:", error);
            return false;
        }
    }

    /**
     * Generate statistics about the learning system's performance
     * @returns {Object} Statistics about learning performance
     */
    getLearningStatistics() {
        // Count total positions learned
        let totalPositions = 0;
        let positionsByLevel = {};

        for (let level = 1; level <= 8; level++) {
            if (this.moveBuckets[level]) {
                const count = Object.keys(this.moveBuckets[level]).length;
                totalPositions += count;
                positionsByLevel[level] = count;
            } else {
                positionsByLevel[level] = 0;
            }
        }

        // Count patterns and counter strategies
        const patternCount = Object.keys(this.playerPatternDatabase).length;
        const counterStrategyCount = Object.keys(this.counterStrategies).length;

        // Calculate success rates for counter strategies
        let totalSuccesses = 0;
        let totalAttempts = 0;

        for (const pattern in this.counterStrategies) {
            for (const [move, data] of Object.entries(this.counterStrategies[pattern])) {
                totalSuccesses += data.successes || 0;
                totalAttempts += data.attempts || 0;
            }
        }

        const overallSuccessRate = totalAttempts > 0 ?
            (totalSuccesses / totalAttempts) * 100 : 0;

        return {
            totalPositionsLearned: totalPositions,
            positionsByLevel,
            patternCount,
            counterStrategyCount,
            counterStrategySuccessRate: overallSuccessRate.toFixed(1) + '%',
            counterStrategyAttempts: totalAttempts,
            learningLevel: this.getLearningLevel(),
            bookstyleLearningEnabled: this.bookstyleLearningEnabled
        };
    }

    /**
     * Update the statistics display in the UI
     */
    updateStatisticsDisplay() {
        const stats = this.getLearningStatistics();

        // Update bucket count
        const bucketCountElement = document.getElementById('bucket-count');
        if (bucketCountElement) {
            bucketCountElement.textContent = stats.totalPositionsLearned;
        }

        // If we have a statistics panel, update it
        const statsPanel = document.getElementById('learning-stats-panel');
        if (statsPanel) {
            statsPanel.innerHTML = `
            <h5>Learning Statistics</h5>
            <div class="stats-row">
                <span>Total Positions:</span>
                <span>${stats.totalPositionsLearned}</span>
            </div>
            <div class="stats-row">
                <span>Patterns Detected:</span>
                <span>${stats.patternCount}</span>
            </div>
            <div class="stats-row">
                <span>Counter Strategies:</span>
                <span>${stats.counterStrategyCount}</span>
            </div>
            <div class="stats-row">
                <span>Success Rate:</span>
                <span>${stats.counterStrategySuccessRate}</span>
            </div>
            <div class="stats-row">
                <span>Learning Level:</span>
                <span>${this.getDifficultyName(stats.learningLevel)}</span>
            </div>
        `;
        }
    }

    /**
     * Create the UI elements for controlling learning ease
     */
    createLearningEaseUI() {

        // Check if the learning ease section already exists to avoid duplicates
        if (document.querySelector('.learning-ease-section')) {
            console.log("Learning ease UI already exists, skipping creation");
            return;
        }
        // Find the tutelage panel to add our controls
        const tutelagePanel = document.getElementById('tutelage-panel');
        if (!tutelagePanel) return;

        // Create learning ease section
        const learningEaseSection = document.createElement('div');
        learningEaseSection.className = 'learning-ease-section';
        learningEaseSection.innerHTML = `
            <h5>Learning Ease</h5>
            <div class="learning-ease-controls">
                <label class="toggle-switch">
                    <input type="checkbox" id="learning-ease-toggle" ${this.learningEnabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Enable Learning</span>
                </label>
                <div class="slider-container">
                    <input type="range" id="learning-ease-slider" min="0" max="100" step="1" value="${this.learningEasePercentage}">
                    <div class="slider-value" id="learning-ease-value">${this.learningEasePercentage.toFixed(1)}%</div>
                </div>
                <div class="learning-ease-level">
                    <span>Difficulty: </span>
                    <span id="learning-ease-level-text">Moderate</span>
                </div>
                <div class="bookstyle-learning-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" id="bookstyle-learning-toggle" ${this.bookstyleLearningEnabled ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">Bookstyle Learning</span>
                        <span class="tooltip-icon" title="When enabled, AI will develop deeper counter-strategies based on your play patterns across games">ⓘ</span>
                    </label>
                </div>
            </div>
            <div class="thought-balloon-toggle">
                <label>
                    <input type="checkbox" id="thought-balloon-toggle" ${this.thoughtBalloonsEnabled ? 'checked' : ''}>
                    Show AI Thoughts
                </label>
            </div>
            <div class="bucket-stats" id="bucket-stats">
                <span>Learned positions: <span id="bucket-count">0</span></span>
                <button id="view-buckets-btn" class="small-button">View Data</button>
            </div>
        `;

        // Add custom styles
        const style = document.createElement('style');
        style.textContent = `
            .learning-ease-section {
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid #ddd;
            }
            
            .learning-ease-controls {
                margin-top: 10px;
            }
            
            .toggle-switch {
                position: relative;
                display: inline-block;
                margin-bottom: 10px;
                cursor: pointer;
            }
            
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: relative;
                display: inline-block;
                width: 40px;
                height: 20px;
                background-color: #ccc;
                border-radius: 20px;
                transition: .4s;
                margin-right: 8px;
                vertical-align: middle;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                border-radius: 50%;
                transition: .4s;
            }
            
            .toggle-label {
                vertical-align: middle;
            }
            
            input:checked + .toggle-slider {
                background-color: #2196F3;
            }
            
            input:checked + .toggle-slider:before {
                transform: translateX(20px);
            }
            
            .slider-container {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .slider-container input {
                flex-grow: 1;
                margin-right: 10px;
            }
            
            .slider-value {
                min-width: 45px;
                text-align: right;
                font-weight: bold;
            }
            
            .learning-ease-level {
                font-size: 0.9em;
                margin-bottom: 10px;
            }
            
            #learning-ease-level-text {
                font-weight: bold;
                color: #2196F3;
            }
            
            .thought-balloon-toggle {
                margin-top: 10px;
                font-size: 0.9em;
            }
            
            .bookstyle-learning-toggle {
                margin-top: 10px;
                margin-bottom: 10px;
            }
            
            .tooltip-icon {
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background-color: #2196F3;
                color: white;
                text-align: center;
                font-size: 12px;
                line-height: 16px;
                margin-left: 5px;
                cursor: help;
            }
            
            .bucket-stats {
                margin-top: 10px;
                font-size: 0.9em;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .small-button {
                padding: 2px 8px;
                font-size: 0.8em;
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .small-button:hover {
                background-color: #e0e0e0;
            }
            
            /* Thought balloon styles */
            .thought-balloon {
                position: absolute;
                background-color: #fff;
                border: 2px solid #333;
                border-radius: 15px;
                padding: 10px 15px;
                max-width: 250px;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
                pointer-events: none;
            }
            
            .thought-balloon:before {
                content: '';
                position: absolute;
                bottom: -20px;
                left: 30px;
                border: 10px solid transparent;
                border-top-color: #333;
            }
            
            .thought-balloon:after {
                content: '';
                position: absolute;
                bottom: -16px;
                left: 32px;
                border: 8px solid transparent;
                border-top-color: #fff;
            }
            
            .thought-balloon.active {
                opacity: 1;
            }
            
            .thought-balloon.thinking {
                background-color: #f0f8ff;
                border-color: #4682b4;
            }
            
            .thought-balloon.learning {
                background-color: #f0fff0;
                border-color: #228b22;
            }
            
            .thought-balloon.confused {
                background-color: #fff0f0;
                border-color: #b22222;
            }
            
            .thought-balloon.bookstyle {
                background-color: #f8f0ff;
                border-color: #9932cc;
            }
            
            /* Modal styles for viewing buckets */
            .bucket-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 1001;
                overflow: auto;
            }
            
            .bucket-modal-content {
                background-color: #fff;
                margin: 5% auto;
                padding: 20px;
                width: 80%;
                max-width: 800px;
                border-radius: 5px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .bucket-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
            }
            
            .bucket-modal-close {
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
            }
            
            .bucket-tabs {
                display: flex;
                border-bottom: 1px solid #ddd;
                margin-bottom: 15px;
            }
            
            .bucket-tab {
                padding: 8px 15px;
                cursor: pointer;
                background-color: #f0f0f0;
                border: 1px solid #ddd;
                border-bottom: none;
                margin-right: 5px;
                border-radius: 5px 5px 0 0;
            }
            
            .bucket-tab.active {
                background-color: #fff;
                border-bottom: 1px solid #fff;
                margin-bottom: -1px;
            }
            
            .bucket-content {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .bucket-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .bucket-table th, .bucket-table td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            
            .bucket-table th {
                background-color: #f2f2f2;
            }
            
            .bucket-table tr:hover {
                background-color: #f5f5f5;
            }
        `;

        document.head.appendChild(style);
        tutelagePanel.appendChild(learningEaseSection);

        // Update the level text based on initial value
        this.updateLevelText();

        // Update bucket count
        this.updateBucketCount();

        // Create modal for viewing buckets
        this.createBucketModal();
    }

    /**
     * Create modal for viewing bucket data
     */
    createBucketModal() {
        // Create modal element if it doesn't exist
        if (!document.getElementById('bucket-modal')) {
            const modal = document.createElement('div');
            modal.id = 'bucket-modal';
            modal.className = 'bucket-modal';

            modal.innerHTML = `
                <div class="bucket-modal-content">
                    <div class="bucket-modal-header">
                        <h3>Learning Database</h3>
                        <span class="bucket-modal-close">×</span>
                    </div>
                    <div class="bucket-tabs">
                        <div class="bucket-tab active" data-tab="positions">Learned Positions</div>
                        <div class="bucket-tab" data-tab="patterns">Player Patterns</div>
                        <div class="bucket-tab" data-tab="counters">Counter Strategies</div>
                    </div>
                    <div class="bucket-content" id="positions-content">
                        <table class="bucket-table">
                            <thead>
                                <tr>
                                    <th>Difficulty</th>
                                    <th>Position</th>
                                    <th>Best Move</th>
                                    <th>Times Seen</th>
                                </tr>
                            </thead>
                            <tbody id="positions-table-body">
                                <!-- Positions will be added here -->
                            </tbody>
                        </table>
                    </div>
                    <div class="bucket-content" id="patterns-content" style="display: none;">
                        <table class="bucket-table">
                            <thead>
                                <tr>
                                    <th>Pattern</th>
                                    <th>Times Observed</th>
                                    <th>Last Seen</th>
                                </tr>
                            </thead>
                            <tbody id="patterns-table-body">
                                <!-- Patterns will be added here -->
                            </tbody>
                        </table>
                    </div>
                    <div class="bucket-content" id="counters-content" style="display: none;">
                        <table class="bucket-table">
                            <thead>
                                <tr>
                                    <th>Player Pattern</th>
                                    <th>Counter Move</th>
                                    <th>Success Rate</th>
                                </tr>
                            </thead>
                            <tbody id="counters-table-body">
                                <!-- Counter strategies will be added here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners for modal
            const closeBtn = modal.querySelector('.bucket-modal-close');
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Close modal when clicking outside
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });

            // Tab switching
            const tabs = modal.querySelectorAll('.bucket-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Hide all content
                    const contents = modal.querySelectorAll('.bucket-content');
                    contents.forEach(content => {
                        content.style.display = 'none';
                    });

                    // Deactivate all tabs
                    tabs.forEach(t => {
                        t.classList.remove('active');
                    });

                    // Activate clicked tab
                    tab.classList.add('active');

                    // Show corresponding content
                    const contentId = `${tab.dataset.tab}-content`;
                    document.getElementById(contentId).style.display = 'block';
                });
            });
        }
    }

    /**
     * Update the bucket count display
     */
    updateBucketCount() {
        const bucketCountElement = document.getElementById('bucket-count');
        if (!bucketCountElement) return;

        // Count total positions across all difficulty levels
        let totalPositions = 0;
        for (let level = 1; level <= 8; level++) {
            if (this.moveBuckets[level]) {
                totalPositions += Object.keys(this.moveBuckets[level]).length;
            }
        }

        bucketCountElement.textContent = totalPositions;
    }

    /**
     * Show the bucket data modal
     */
    showBucketModal() {
        const modal = document.getElementById('bucket-modal');
        if (!modal) return;

        // Update positions table
        this.updatePositionsTable();

        // Update patterns table
        this.updatePatternsTable();

        // Update counters table
        this.updateCountersTable();

        // Show the modal
        modal.style.display = 'block';
    }

    /**
     * Update the positions table in the modal
     */
    updatePositionsTable() {
        const tableBody = document.getElementById('positions-table-body');
        if (!tableBody) return;

        // Clear existing rows
        tableBody.innerHTML = '';

        // Add rows for each position in each difficulty level
        for (let level = 1; level <= 8; level++) {
            const bucket = this.moveBuckets[level];
            if (!bucket) continue;

            for (const [position, moves] of Object.entries(bucket)) {
                // Find the most common move for this position
                let bestMove = null;
                let maxCount = 0;

                for (const [move, count] of Object.entries(moves)) {
                    if (count > maxCount) {
                        bestMove = move;
                        maxCount = count;
                    }
                }

                if (bestMove && maxCount > 0) {
                    // Create a new row
                    const row = document.createElement('tr');

                    // Truncate position FEN for display
                    const shortPosition = position.length > 20 ?
                        position.substring(0, 20) + '...' : position;

                    row.innerHTML = `
                        <td>${level} (${this.getDifficultyName(level)})</td>
                        <td title="${position}">${shortPosition}</td>
                        <td>${bestMove}</td>
                        <td>${maxCount}</td>
                    `;

                    tableBody.appendChild(row);
                }
            }
        }

        // If no positions, show a message
        if (tableBody.children.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" style="text-align: center;">No learned positions yet</td>
            `;
            tableBody.appendChild(row);
        }
    }

    /**
     * Update the patterns table in the modal
     */
    updatePatternsTable() {
        const tableBody = document.getElementById('patterns-table-body');
        if (!tableBody) return;

        // Clear existing rows
        tableBody.innerHTML = '';

        // Add rows for each pattern
        for (const [pattern, data] of Object.entries(this.playerPatternDatabase)) {
            // Create a new row
            const row = document.createElement('tr');

            // Format the last seen date
            const lastSeen = new Date(data.lastSeen);
            const formattedDate = lastSeen.toLocaleDateString() + ' ' +
                lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Truncate pattern for display
            const shortPattern = pattern.length > 30 ?
                pattern.substring(0, 30) + '...' : pattern;

            row.innerHTML = `
                <td title="${pattern}">${shortPattern}</td>
                <td>${data.count}</td>
                <td>${formattedDate}</td>
            `;

            tableBody.appendChild(row);
        }

        // If no patterns, show a message
        if (tableBody.children.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="3" style="text-align: center;">No player patterns detected yet</td>
            `;
            tableBody.appendChild(row);
        }
    }

    /**
     * Update the counters table in the modal
     */
    updateCountersTable() {
        const tableBody = document.getElementById('counters-table-body');
        if (!tableBody) return;

        // Clear existing rows
        tableBody.innerHTML = '';

        // Add rows for each counter strategy
        for (const [pattern, responses] of Object.entries(this.counterStrategies)) {
            // Find the best counter move
            let bestCounter = null;
            let bestSuccessRate = 0;
            let totalAttempts = 0;

            for (const [move, data] of Object.entries(responses)) {
                totalAttempts += data.attempts;
                const successRate = data.attempts > 0 ? data.successes / data.attempts : 0;

                if (successRate > bestSuccessRate) {
                    bestCounter = move;
                    bestSuccessRate = successRate;
                }
            }

            if (bestCounter && totalAttempts > 0) {
                // Create a new row
                const row = document.createElement('tr');

                // Truncate pattern for display
                const shortPattern = pattern.length > 30 ?
                    pattern.substring(0, 30) + '...' : pattern;

                // Format success rate as percentage
                const successPercentage = (bestSuccessRate * 100).toFixed(1) + '%';

                row.innerHTML = `
                    <td title="${pattern}">${shortPattern}</td>
                    <td>${bestCounter}</td>
                    <td>${successPercentage} (${responses[bestCounter].successes}/${responses[bestCounter].attempts})</td>
                `;

                tableBody.appendChild(row);
            }
        }

        // If no counter strategies, show a message
        if (tableBody.children.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="3" style="text-align: center;">No counter strategies developed yet</td>
            `;
            tableBody.appendChild(row);
        }
    }

    /**
     * Get the difficulty name for a level
     * @param {number} level - The difficulty level (1-8)
     * @returns {string} The name of the difficulty level
     */
    getDifficultyName(level) {
        const names = [
            'Very Easy',
            'Easy',
            'Moderate',
            'Standard',
            'Challenging',
            'Difficult',
            'Very Difficult',
            'Extreme'
        ];

        return names[level - 1] || 'Unknown';
    }

    /**
     * Create the thought balloon element
     */
    createThoughtBalloonElement() {
        // Create the thought balloon element if it doesn't exist
        if (!document.getElementById('ai-thought-balloon')) {
            const balloon = document.createElement('div');
            balloon.id = 'ai-thought-balloon';
            balloon.className = 'thought-balloon';
            document.body.appendChild(balloon);
        }
    }

    /**
     * Set up event listeners for the UI controls
     */
    setupEventListeners() {
        // Learning ease toggle
        const learningToggle = document.getElementById('learning-ease-toggle');
        if (learningToggle) {
            learningToggle.addEventListener('change', (e) => {
                this.learningEnabled = e.target.checked;
                this.tutelageSystem.learningEnabled = e.target.checked;
                this.updateLearningRate();
                this.saveSettings();
            });
        }

        // Learning ease slider
        const learningSlider = document.getElementById('learning-ease-slider');
        if (learningSlider) {
            learningSlider.addEventListener('input', (e) => {
                this.setLearningEasePercentage(parseFloat(e.target.value));
            });

            // Save settings when slider interaction ends
            learningSlider.addEventListener('change', () => {
                this.saveSettings();
            });
        }

        // Thought balloon toggle
        const thoughtToggle = document.getElementById('thought-balloon-toggle');
        if (thoughtToggle) {
            thoughtToggle.addEventListener('change', (e) => {
                this.thoughtBalloonsEnabled = e.target.checked;
                this.thoughtBalloonActive = e.target.checked;
                if (!this.thoughtBalloonActive) {
                    this.hideThoughtBalloon();
                }
                this.saveSettings();
            });
        }

        // Bookstyle learning toggle
        const bookstyleToggle = document.getElementById('bookstyle-learning-toggle');
        if (bookstyleToggle) {
            bookstyleToggle.addEventListener('change', (e) => {
                this.bookstyleLearningEnabled = e.target.checked;
                this.saveSettings();

                // Show notification about the change
                if (this.bookstyleLearningEnabled) {
                    this.showThoughtBalloon(
                        "Bookstyle learning activated. I'll develop deeper counter-strategies based on your play patterns.",
                        'bookstyle'
                    );
                } else {
                    this.showThoughtBalloon(
                        "Bookstyle learning deactivated. I'll use standard learning methods.",
                        'thinking'
                    );
                }
            });
        }

        // View buckets button
        const viewBucketsBtn = document.getElementById('view-buckets-btn');
        if (viewBucketsBtn) {
            viewBucketsBtn.addEventListener('click', () => {
                this.showBucketModal();
            });
        }

        // Listen for difficulty changes
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', () => {
                this.currentDifficultyLevel = parseInt(difficultySelect.value);
                this.updateLevelText();
                this.updateLearningRate();
            });
        }

        // Listen for moves to show thought balloons and record player patterns
        const originalMakeMove = this.chessGame.makeMove;
        this.chessGame.makeMove = (fromRow, fromCol, toRow, toCol) => {
            // Record the player's move before executing it
            const positionFEN = this.chessGame.getPositionFEN();
            const moveNotation = this.getMoveNotation(fromRow, fromCol, toRow, toCol);

            // Execute the original move
            originalMakeMove.call(this.chessGame, fromRow, fromCol, toRow, toCol);

            // Record player pattern if learning is enabled
            if (this.learningEnabled) {
                this.recordPlayerMove(positionFEN, moveNotation, fromRow, fromCol, toRow, toCol);
            }

            // Show thought balloon for player move
            if (this.thoughtBalloonActive) {
                this.showThoughtForPlayerMove(fromRow, fromCol, toRow, toCol, positionFEN);
            }
        };

        // Listen for AI moves
        const originalExecuteAIMove = this.chessGame.executeAIMove;
        this.chessGame.executeAIMove = (move) => {
            // Record the position before the AI makes its move
            const positionFEN = this.chessGame.getPositionFEN();

            // Check if we should use a bookstyle counter move
            let bookstyleMove = null;
            if (this.bookstyleLearningEnabled) {
                bookstyleMove = this.getBookstyleCounterMove();
            }

            // If we have a bookstyle move, use it instead
            if (bookstyleMove) {
                console.log("Using bookstyle counter move:", bookstyleMove);
                move = bookstyleMove;
            }

            // Execute the AI move
            originalExecuteAIMove.call(this.chessGame, move);

            // Record the move in the appropriate bucket if learning is enabled
            if (this.learningEnabled) {
                this.recordAIMove(positionFEN, move);
            }

            // Show thought balloon for AI move
            if (this.thoughtBalloonActive) {
                this.showThoughtForAIMove(move, bookstyleMove !== null);
            }
        };

        // Hook into the tutelage system's saveToLocalStorage method to ensure our settings are saved
        const originalSaveToLocalStorage = this.tutelageSystem.saveToLocalStorage;
        this.tutelageSystem.saveToLocalStorage = () => {
            originalSaveToLocalStorage.call(this.tutelageSystem);
            this.saveSettings();
            this.saveMoveBuckets();
        };

        // Hook into the tutelage system's resetLearningData method
        const originalResetLearningData = this.tutelageSystem.resetLearningData;
        this.tutelageSystem.resetLearningData = () => {
            if (confirm('Are you sure you want to reset all learning data? This cannot be undone.')) {
                originalResetLearningData.call(this.tutelageSystem);

                // Reset our settings and buckets as well
                this.learningEasePercentage = 50.0;
                this.moveBuckets = {};
                for (let level = 1; level <= 8; level++) {
                    this.moveBuckets[level] = {};
                }
                this.counterStrategies = {};
                this.playerPatternDatabase = {};
                this.playerMoveHistory = [];

                this.updateLearningRate();
                this.updateLevelText();
                this.updateBucketCount();
                this.saveSettings();
                this.saveMoveBuckets();

                // Show notification
                this.showThoughtBalloon("All learning data has been reset.", "thinking");
            }
        };

        // Set up auto-save for move buckets
        setInterval(() => {
            if (this.learningEnabled) {
                this.saveMoveBuckets();
            }
        }, 60000); // Save every minute
    }

    /**
     * Record a player's move for pattern recognition
     * @param {string} positionFEN - The position FEN before the move
     * @param {string} moveNotation - The move in notation form
     * @param {number} fromRow - Starting row of the move
     * @param {number} fromCol - Starting column of the move
     * @param {number} toRow - Ending row of the move
     * @param {number} toCol - Ending column of the move
     */
    recordPlayerMove(positionFEN, moveNotation, fromRow, fromCol, toRow, toCol) {
        // Add to player move history (keep last 5 moves)
        this.playerMoveHistory.push({
            position: positionFEN,
            move: moveNotation,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol }
        });

        // Limit history to last 5 moves
        if (this.playerMoveHistory.length > 5) {
            this.playerMoveHistory.shift();
        }

        // Record this position-move pair in the player pattern database
        if (!this.playerPatternDatabase[positionFEN]) {
            this.playerPatternDatabase[positionFEN] = {
                moves: {},
                count: 0,
                lastSeen: Date.now()
            };
        }

        // Update the pattern database
        const patternData = this.playerPatternDatabase[positionFEN];
        patternData.count++;
        patternData.lastSeen = Date.now();

        if (!patternData.moves[moveNotation]) {
            patternData.moves[moveNotation] = 1;
        } else {
            patternData.moves[moveNotation]++;
        }

        // If bookstyle learning is enabled, analyze for patterns across multiple moves
        if (this.bookstyleLearningEnabled && this.playerMoveHistory.length >= 3) {
            this.analyzePlayerPatterns();
        }
    }

    /**
     * Record an AI move in the appropriate bucket
     * @param {string} positionFEN - The position FEN before the move
     * @param {Object} move - The move object
     */
    recordAIMove(positionFEN, move) {
        // Get the current difficulty level
        const level = this.currentDifficultyLevel;

        // Ensure the bucket for this level exists
        if (!this.moveBuckets[level]) {
            this.moveBuckets[level] = {};
        }

        // Convert move to notation
        const moveNotation = this.getMoveNotation(move.from.row, move.from.col, move.to.row, move.to.col);

        // Record the move in the bucket
        if (!this.moveBuckets[level][positionFEN]) {
            this.moveBuckets[level][positionFEN] = {};
        }

        if (!this.moveBuckets[level][positionFEN][moveNotation]) {
            this.moveBuckets[level][positionFEN][moveNotation] = 1;
        } else {
            this.moveBuckets[level][positionFEN][moveNotation]++;
        }

        // Update the bucket count display
        this.updateBucketCount();

        // If this was a counter-strategy move, record its success/failure later
        if (this.lastCounterStrategyUsed) {
            this.lastCounterStrategyUsed.moveUsed = moveNotation;
            this.lastCounterStrategyUsed.position = positionFEN;

            // We'll evaluate success when we see the player's response
            // or at the end of the game
        }
    }

    /**
     * Analyze player's move patterns to develop counter-strategies
     */
    analyzePlayerPatterns() {
        // Need at least 3 moves to analyze patterns
        if (this.playerMoveHistory.length < 3) return;

        // Create a pattern signature from the last 3 moves
        const pattern = this.playerMoveHistory.slice(-3).map(move => move.move).join('-');

        // Check if we've seen this pattern before
        if (!this.counterStrategies[pattern]) {
            this.counterStrategies[pattern] = {};
        }

        // If we're in a game and this is a pattern we've seen before,
        // we might want to use a counter-strategy next move
        if (Object.keys(this.counterStrategies[pattern]).length > 0) {
            // Remember this pattern for the next AI move
            this.currentPlayerPattern = pattern;
        }
    }

    /**
     * Get a bookstyle counter move based on player patterns
     * @returns {Object|null} A move object or null if no counter move is available
     */
    getBookstyleCounterMove() {
        // If bookstyle learning is disabled or we don't have a current pattern, return null
        if (!this.bookstyleLearningEnabled || !this.currentPlayerPattern) {
            return null;
        }

        const pattern = this.currentPlayerPattern;
        this.currentPlayerPattern = null; // Reset for next time

        // Check if we have counter-strategies for this pattern
        if (!this.counterStrategies[pattern] || Object.keys(this.counterStrategies[pattern]).length === 0) {
            return null;
        }

        // Find the best counter move based on success rate
        let bestMove = null;
        let bestSuccessRate = -1;
        let bestMoveData = null;

        for (const [move, data] of Object.entries(this.counterStrategies[pattern])) {
            // Calculate success rate (default to 0 if no attempts)
            const successRate = data.attempts > 0 ? data.successes / data.attempts : 0;

            // Add some randomness to avoid always using the same counter
            const randomFactor = Math.random() * 0.2; // 0-0.2 random factor
            const adjustedRate = successRate + randomFactor;

            // Update best move if this one is better
            if (adjustedRate > bestSuccessRate) {
                bestSuccessRate = adjustedRate;
                bestMove = move;
                bestMoveData = data;
            }
        }

        // Only use counter moves that have been somewhat successful (>30% success rate)
        // or haven't been tried enough times yet (less than 5 attempts)
        if (bestMove && (bestSuccessRate > 0.3 || bestMoveData.attempts < 5)) {
            // Parse the move notation into a move object
            const moveObj = this.parseMoveNotation(bestMove);
            if (moveObj) {
                // Record that we're using this counter strategy
                this.lastCounterStrategyUsed = {
                    pattern: pattern,
                    move: bestMove,
                    timestamp: Date.now()
                };

                return moveObj;
            }
        }

        return null;
    }

    /**
     * Parse move notation into a move object
     * @param {string} notation - The move notation (e.g., "e2e4")
     * @returns {Object|null} A move object or null if parsing fails
     */
    parseMoveNotation(notation) {
        // Simple parsing for "e2e4" style notation
        if (notation.length !== 4) return null;

        const files = 'abcdefgh';
        const fromCol = files.indexOf(notation[0]);
        const fromRow = 8 - parseInt(notation[1]);
        const toCol = files.indexOf(notation[2]);
        const toRow = 8 - parseInt(notation[3]);

        // Validate coordinates
        if (fromCol < 0 || fromCol > 7 || fromRow < 0 || fromRow > 7 ||
            toCol < 0 || toCol > 7 || toRow < 0 || toRow > 7) {
            return null;
        }

        // Get the piece at the from position
        const piece = this.chessGame.board[fromRow][fromCol];
        if (!piece) return null;

        return {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece
        };
    }

    /**
     * Get move notation for a move
     * @param {number} fromRow - Starting row
     * @param {number} fromCol - Starting column
     * @param {number} toRow - Ending row
     * @param {number} toCol - Ending column
     * @returns {string} The move notation
     */
    getMoveNotation(fromRow, fromCol, toRow, toCol) {
        const files = 'abcdefgh';
        const fromFile = files[fromCol];
        const fromRank = 8 - fromRow;
        const toFile = files[toCol];
        const toRank = 8 - toRow;

        return `${fromFile}${fromRank}${toFile}${toRank}`;
    }

    /**
     * Update the success/failure of a counter strategy based on game outcome
     * @param {string} outcome - The game outcome ('win', 'loss', 'draw')
     */
    updateCounterStrategySuccess(outcome) {
        // If we didn't use a counter strategy in this game, do nothing
        if (!this.lastCounterStrategyUsed) return;

        const { pattern, move } = this.lastCounterStrategyUsed;

        // Initialize the counter strategy data if needed
        if (!this.counterStrategies[pattern][move]) {
            this.counterStrategies[pattern][move] = {
                attempts: 0,
                successes: 0
            };
        }

        // Update attempts
        this.counterStrategies[pattern][move].attempts++;

        // Update successes based on outcome
        if (outcome === 'win') {
            this.counterStrategies[pattern][move].successes++;
        }

        // Reset the last counter strategy used
        this.lastCounterStrategyUsed = null;

        // Save the updated counter strategies
        this.saveMoveBuckets();
    }

    /**
     * Set the learning ease percentage with validation
     * @param {number} percentage - The learning ease percentage (0-100)
     */
    setLearningEasePercentage(percentage) {
        // Validate the percentage is within range
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        this.learningEasePercentage = percentage;

        // Update the UI
        const sliderValue = document.getElementById('learning-ease-value');
        if (sliderValue) {
            sliderValue.textContent = `${percentage.toFixed(1)}%`;
        }

        // Update the level text
        this.updateLevelText();

        // Update the actual learning rate
        this.updateLearningRate();
    }

    /**
     * Update the learning level text based on the current percentage and difficulty
     */
    updateLevelText() {
        const levelText = document.getElementById('learning-ease-level-text');
        if (!levelText) return;

        // Get the learning level (1-8) based on percentage and difficulty
        const level = this.getLearningLevel();

        // Set text based on level
        let text = '';
        let color = '';

        switch (level) {
            case 1:
                text = 'Very Easy';
                color = '#4CAF50'; // Green
                break;
            case 2:
                text = 'Easy';
                color = '#8BC34A'; // Light Green
                break;
            case 3:
                text = 'Moderate';
                color = '#2196F3'; // Blue
                break;
            case 4:
                text = 'Standard';
                color = '#03A9F4'; // Light Blue
                break;
            case 5:
                text = 'Challenging';
                color = '#FF9800'; // Orange
                break;
            case 6:
                text = 'Difficult';
                color = '#FF5722'; // Deep Orange
                break;
            case 7:
                text = 'Very Difficult';
                color = '#F44336'; // Red
                break;
            case 8:
                text = 'Extreme';
                color = '#9C27B0'; // Purple
                break;
        }

        levelText.textContent = text;
        levelText.style.color = color;
    }

    /**
     * Get the learning level (1-8) based on percentage and difficulty
     * @returns {number} The learning level from 1-8
     */
    getLearningLevel() {
        // Adjust the learning level based on both percentage and current difficulty
        // Higher difficulty makes learning harder, lower percentage makes learning easier

        // Base level from percentage (1-8)
        const baseLevel = Math.ceil(this.learningEasePercentage / 12.5);

        // Adjust based on difficulty (higher difficulty increases level)
        const difficultyAdjustment = (this.currentDifficultyLevel - 4) / 2;

        // Calculate final level (clamped between 1-8)
        let finalLevel = Math.round(baseLevel + difficultyAdjustment);
        if (finalLevel < 1) finalLevel = 1;
        if (finalLevel > 8) finalLevel = 8;

        return finalLevel;
    }

    /**
     * Update the actual learning rate in the tutelage system
     */
    updateLearningRate() {
        if (!this.learningEnabled) {
            this.tutelageSystem.learningEnabled = false;
            return;
        }

        this.tutelageSystem.learningEnabled = true;

        // Get the learning level
        const level = this.getLearningLevel();

        // Set learning rate based on level (inverse relationship - higher level = lower learning rate)
        // Level 1 (easiest) = 0.5 learning rate
        // Level 8 (hardest) = 0.05 learning rate
        const learningRates = {
            1: 0.5,   // Very Easy - learns very quickly
            2: 0.4,   // Easy
            3: 0.3,   // Moderate
            4: 0.2,   // Standard (default)
            5: 0.15,  // Challenging
            6: 0.1,   // Difficult
            7: 0.075, // Very Difficult
            8: 0.05   // Extreme - learns very slowly
        };

        // Update the learning rate in the tutelage system
        this.tutelageSystem.learningRate = learningRates[level];

        // Also adjust exploration rate (how often AI uses learned moves)
        const explorationRates = {
            1: 0.4,   // Very Easy - uses learned moves very often
            2: 0.35,  // Easy
            3: 0.3,   // Moderate
            4: 0.25,  // Standard
            5: 0.2,   // Challenging
            6: 0.15,  // Difficult
            7: 0.1,   // Very Difficult
            8: 0.05   // Extreme - rarely uses learned moves
        };

        this.tutelageSystem.explorationRate = explorationRates[level];

        console.log(`Learning ease set to level ${level} (${this.learningEasePercentage}%)`);
        console.log(`Learning rate: ${this.tutelageSystem.learningRate}, Exploration rate: ${this.tutelageSystem.explorationRate}`);
    }

    /**
     * Initialize the quip templates for thought balloons
     */
    initializeQuipTemplates() {
        // Matrix of quips categorized by context and learning level
        this.quipTemplates = {
            // When AI is learning from player moves
            learning: {
                easy: [
                    "I see what you did there! Taking notes...",
                    "That's a clever move! I'll remember that.",
                    "Learning this pattern quickly!",
                    "I'm picking this up fast!",
                    "Adding this to my playbook!"
                ],
                medium: [
                    "Interesting move. Let me study that.",
                    "I should remember this position.",
                    "Taking some mental notes here.",
                    "This pattern seems useful.",
                    "I'll try to incorporate this strategy."
                ],
                hard: [
                    "Hmm, complex move. This might take time to learn.",
                    "I'm struggling to see the pattern here...",
                    "This is challenging to internalize.",
                    "Slowly understanding your strategy.",
                    "This will take practice to master."
                ]
            },

            // When AI recognizes a pattern
            recognition: {
                easy: [
                    "I've seen this before! I know what to do.",
                    "This pattern looks familiar!",
                    "I remember this position from earlier!",
                    "Aha! I recognize this setup.",
                    "I know this one!"
                ],
                medium: [
                    "This position seems familiar.",
                    "I think I've encountered something similar.",
                    "This reminds me of a previous game.",
                    "I might have seen this pattern before.",
                    "This setup rings a bell."
                ],
                hard: [
                    "Is this similar to something I've seen?",
                    "This vaguely reminds me of something...",
                    "There's something familiar here, but I can't quite place it.",
                    "Have I seen this before? Not sure...",
                    "This pattern is testing my memory."
                ]
            },

            // When AI is thinking about its move
            thinking: {
                easy: [
                    "Let me think... this move looks good!",
                    "I think I know what to do here.",
                    "This should be a strong response.",
                    "I feel confident about this move!",
                    "This is clearly the best option."
                ],
                medium: [
                    "Analyzing the position...",
                    "Considering my options carefully.",
                    "What's the best response here?",
                    "Evaluating several possibilities.",
                    "This position requires some thought."
                ],
                hard: [
                    "This is a complex position...",
                    "I need to calculate this carefully.",
                    "So many possibilities to consider.",
                    "This requires deep analysis.",
                    "The best move is not obvious here."
                ]
            },

            // When AI is confused or surprised
            confused: {
                easy: [
                    "That's unexpected! Adjusting my strategy.",
                    "Wow, I didn't see that coming!",
                    "That's a surprise move!",
                    "You caught me off guard there!",
                    "That's not what I anticipated!"
                ],
                medium: [
                    "Hmm, that's not what I expected.",
                    "I need to reconsider my approach.",
                    "That move changes things.",
                    "I didn't account for that possibility.",
                    "Time to adapt my strategy."
                ],
                hard: [
                    "That move complicates things significantly.",
                    "I'm not sure how to respond to that.",
                    "This is a challenging position now.",
                    "Your move has created a complex situation.",
                    "I need to reassess everything now."
                ]
            },

            // When AI makes a tactical move
            tactical: {
                easy: [
                    "Check this tactic out!",
                    "I see a nice combination here!",
                    "Watch this tactical sequence!",
                    "This move should be effective!",
                    "Here comes a tactical strike!"
                ],
                medium: [
                    "I think this tactic works.",
                    "This combination looks promising.",
                    "Let's try this tactical approach.",
                    "This move creates tactical opportunities.",
                    "This should lead to a tactical advantage."
                ],
                hard: [
                    "This tactic is complex but might work.",
                    "I'm calculating this combination carefully.",
                    "This tactical idea is worth trying.",
                    "The tactics here are not straightforward.",
                    "This position allows for interesting tactics."
                ]
            },

            // When AI makes a positional move
            positional: {
                easy: [
                    "Improving my piece positions!",
                    "Strengthening my structure!",
                    "Taking control of key squares!",
                    "Building a solid position!",
                    "Developing with a plan!"
                ],
                medium: [
                    "This move improves my position.",
                    "Working on my pawn structure.",
                    "Trying to secure positional advantages.",
                    "This should give me better piece coordination.",
                    "Focusing on long-term positional play."
                ],
                hard: [
                    "The positional nuances here are subtle.",
                    "This move has long-term positional implications.",
                    "Balancing multiple positional factors.",
                    "The position requires careful maneuvering.",
                    "Working on incremental positional improvements."
                ]
            },

            // When AI uses a bookstyle counter move
            bookstyle: {
                easy: [
                    "I recognize your pattern! Here's my counter!",
                    "I've prepared for this sequence!",
                    "I know exactly how to respond to this!",
                    "This is a known pattern to me now!",
                    "My book knowledge is paying off!"
                ],
                medium: [
                    "I've studied this pattern before.",
                    "This counter move should be effective.",
                    "I've developed a response to this setup.",
                    "My pattern recognition is helping here.",
                    "This move counters your strategy."
                ],
                hard: [
                    "I've analyzed this pattern in depth.",
                    "This counter move is based on careful study.",
                    "I've prepared for this strategic approach.",
                    "This response targets a weakness in your pattern.",
                    "My bookstyle learning suggests this counter."
                ]
            }
        };
    }

    /**
     * Show a thought balloon with a quip
     * @param {string} quip - The text to display
     * @param {string} type - The type of thought (thinking, learning, confused, etc.)
     * @param {Object} position - Position to show the balloon (optional)
     */
    showThoughtBalloon(quip, type = 'thinking', position = null) {
        // If thought balloons are disabled, don't show anything
        if (!this.thoughtBalloonActive) return;

        // Clear any existing timeout
        if (this.thoughtBalloonTimeout) {
            clearTimeout(this.thoughtBalloonTimeout);
        }

        const balloon = document.getElementById('ai-thought-balloon');
        if (!balloon) return;

        // Set the content
        balloon.textContent = quip;

        // Set the type class
        balloon.className = 'thought-balloon active';
        if (type) {
            balloon.classList.add(type);
        }

        // Position the balloon
        if (position) {
            balloon.style.left = `${position.x}px`;
            balloon.style.top = `${position.y}px`;
        } else {
            // Default position near the AI profile
            const aiProfile = document.querySelector('.ai-profile-panel');
            if (aiProfile) {
                const rect = aiProfile.getBoundingClientRect();
                balloon.style.left = `${rect.left - 100}px`;
                balloon.style.top = `${rect.top + 50}px`;
            } else {
                // Fallback position
                balloon.style.left = '100px';
                balloon.style.top = '100px';
            }
        }

        // Hide after a delay
        this.thoughtBalloonTimeout = setTimeout(() => {
            this.hideThoughtBalloon();
        }, 4000);
    }

    /**
     * Hide the thought balloon
     */
    hideThoughtBalloon() {
        const balloon = document.getElementById('ai-thought-balloon');
        if (balloon) {
            balloon.classList.remove('active');
        }
    }

    /**
     * Show a thought balloon for a player move
     * @param {number} fromRow - Starting row of the move
     * @param {number} fromCol - Starting column of the move
     * @param {number} toRow - Ending row of the move
     * @param {number} toCol - Ending column of the move
     * @param {string} positionFEN - The position FEN before the move
     */
    showThoughtForPlayerMove(fromRow, fromCol, toRow, toCol, positionFEN) {
        // Determine if this is a move the AI recognizes
        const isRecognized = this.tutelageSystem.learnedMoves.has(positionFEN);

        // Check if this is a position in our bucket for the current difficulty
        const isInBucket = this.moveBuckets[this.currentDifficultyLevel] &&
            this.moveBuckets[this.currentDifficultyLevel][positionFEN];

        // Get the learning level category (easy, medium, hard)
        const levelCategory = this.getLevelCategory();

        // Choose the appropriate quip category
        let category = 'learning';
        let type = 'learning';

        if (isRecognized || isInBucket) {
            category = 'recognition';
            type = 'thinking';
        } else if (this.isInterestingMove(fromRow, fromCol, toRow, toCol)) {
            category = 'confused';
            type = 'confused';
        }

        // Get a random quip from the appropriate category and level
        const quip = this.getRandomQuip(category, levelCategory);

        // Calculate position for the thought balloon
        const position = this.getPositionForThoughtBalloon(toRow, toCol);

        // Show the thought balloon
        this.showThoughtBalloon(quip, type, position);
    }

    /**
     * Show a thought balloon for an AI move
     * @param {Object} move - The AI move object
     * @param {boolean} isBookstyleMove - Whether this is a bookstyle counter move
     */
    showThoughtForAIMove(move, isBookstyleMove = false) {
        // Get the learning level category
        const levelCategory = this.getLevelCategory();

        // Choose the appropriate quip category
        let category, type;

        if (isBookstyleMove) {
            category = 'bookstyle';
            type = 'bookstyle';
        } else {
            // Determine if this is a tactical or positional move
            const isTactical = this.isTacticalMove(move);
            category = isTactical ? 'tactical' : 'positional';
            type = 'thinking';
        }

        // Get a random quip
        const quip = this.getRandomQuip(category, levelCategory);

        // Calculate position for the thought balloon
        const position = this.getPositionForThoughtBalloon(move.to.row, move.to.col);

        // Show the thought balloon
        this.showThoughtBalloon(quip, type, position);
    }

    /**
     * Get a random quip from the specified category and level
     * @param {string} category - The category of quip
     * @param {string} level - The difficulty level (easy, medium, hard)
     * @returns {string} A random quip
     */
    getRandomQuip(category, level) {
        // Default to thinking/medium if category or level doesn't exist
        if (!this.quipTemplates[category]) {
            category = 'thinking';
        }

        if (!this.quipTemplates[category][level]) {
            level = 'medium';
        }

        const quips = this.quipTemplates[category][level];
        const randomIndex = Math.floor(Math.random() * quips.length);
        return quips[randomIndex];
    }

    /**
     * Get the level category based on the current learning level
     * @returns {string} The level category (easy, medium, hard)
     */
    getLevelCategory() {
        const level = this.getLearningLevel();

        if (level <= 3) {
            return 'easy';
        } else if (level <= 6) {
            return 'medium';
        } else {
            return 'hard';
        }
    }

    /**
     * Check if a move is "interesting" (unexpected or significant)
     * @param {number} fromRow - Starting row of the move
     * @param {number} fromCol - Starting column of the move
     * @param {number} toRow - Ending row of the move
     * @param {number} toCol - Ending column of the move
     * @returns {boolean} True if the move is interesting
     */
    isInterestingMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.chessGame.board[fromRow][fromCol];
        if (!piece) return false;

        // Check if it's a capture
        const targetPiece = this.chessGame.board[toRow][toCol];
        const isCapture = targetPiece !== null;

        // Check if it's a check
        const opponentColor = piece.color === 'white' ? 'black' : 'white';

        // Make temporary move to check if it results in check
        const originalTarget = this.chessGame.board[toRow][toCol];
        this.chessGame.board[toRow][toCol] = piece;
        this.chessGame.board[fromRow][fromCol] = null;

        const isCheck = this.chessGame.isInCheck(opponentColor);

        // Restore board
        this.chessGame.board[fromRow][fromCol] = piece;
        this.chessGame.board[toRow][toCol] = originalTarget;

        // Check if it's a long move (knight or queen moving far)
        const isLongMove = (piece.type === 'knight' || piece.type === 'queen') &&
            (Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol) >= 4);

        // Check if it's a pawn promotion
        const isPawnPromotion = piece.type === 'pawn' &&
            ((piece.color === 'white' && toRow === 0) ||
                (piece.color === 'black' && toRow === 7));

        return isCapture || isCheck || isLongMove || isPawnPromotion;
    }

    /**
     * Check if a move is tactical (captures, checks, threats)
     * @param {Object} move - The move object
     * @returns {boolean} True if the move is tactical
     */
    isTacticalMove(move) {
        // Get the piece that's moving
        const piece = this.chessGame.board[move.from.row][move.from.col];
        if (!piece) return false;

        // Check if it's a capture
        const targetPiece = this.chessGame.board[move.to.row][move.to.col];
        const isCapture = targetPiece !== null;

        // Check if it's a check
        const opponentColor = piece.color === 'white' ? 'black' : 'white';

        // Make temporary move to check if it results in check
        const originalTarget = this.chessGame.board[move.to.row][move.to.col];
        this.chessGame.board[move.to.row][move.to.col] = piece;
        this.chessGame.board[move.from.row][move.from.col] = null;

        const isCheck = this.chessGame.isInCheck(opponentColor);

        // Restore board
        this.chessGame.board[move.from.row][move.from.col] = piece;
        this.chessGame.board[move.to.row][move.to.col] = originalTarget;

        // Check if it's a fork or pin (simplified check)
        const isFork = this.couldBeFork(move);
        const isPin = this.couldBePin(move);

        return isCapture || isCheck || isFork || isPin;
    }

    /**
     * Simple check if a move could create a fork
     * @param {Object} move - The move object
     * @returns {boolean} True if the move might create a fork
     */
    couldBeFork(move) {
        // This is a simplified check - in a real implementation,
        // you would do more thorough analysis
        const piece = this.chessGame.board[move.from.row][move.from.col];
        if (!piece) return false;

        // Knights and queens are common forking pieces
        return (piece.type === 'knight' || piece.type === 'queen');
    }

    /**
     * Simple check if a move could create a pin
     * @param {Object} move - The move object
     * @returns {boolean} True if the move might create a pin
     */
    couldBePin(move) {
        // This is a simplified check - in a real implementation,
        // you would do more thorough analysis
        const piece = this.chessGame.board[move.from.row][move.from.col];
        if (!piece) return false;

        // Long-range pieces can create pins
        return (piece.type === 'queen' || piece.type === 'rook' || piece.type === 'bishop');
    }

    /**
     * Calculate the position for the thought balloon based on a board position
     * @param {number} row - Board row
     * @param {number} col - Board column
     * @returns {Object} Position object with x and y coordinates
     */
    getPositionForThoughtBalloon(row, col) {
        // Get the chess board element
        const board = document.getElementById('chessBoard');
        if (!board) {
            return { x: 100, y: 100 }; // Default fallback position
        }

        // Get board dimensions and position
        const boardRect = board.getBoundingClientRect();

        // Calculate square size
        const squareSize = boardRect.width / 8;

        // Calculate position based on row and column
        // Add scroll position to handle scrolled pages
        const x = boardRect.left + col * squareSize + window.scrollX;
        const y = boardRect.top + row * squareSize + window.scrollY;

        // Position the balloon above and to the right of the square
        return {
            x: x + squareSize * 0.75,
            y: y - 80 // Position above the square
        };
    }

    /**
     * Handle game end event to update counter strategy success
     * @param {string} result - The game result ('win', 'loss', 'draw')
     */
    handleGameEnd(result) {
        // Determine outcome from AI perspective
        let outcome;
        if (result === 'draw') {
            outcome = 'draw';
        } else if (
            (result === 'white' && this.chessGame.aiColor === 'white') ||
            (result === 'black' && this.chessGame.aiColor === 'black')
        ) {
            outcome = 'win';
        } else {
            outcome = 'loss';
        }

        // Update counter strategy success
        this.updateCounterStrategySuccess(outcome);

        // Save move buckets
        this.saveMoveBuckets();
    }
}


// Initialize counter moves manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.counterMovesManager = new CounterMovesManager();

    // Add a method to the global scope to record counter move success
    window.recordCounterMoveSuccess = (opponentMove, wasSuccessful) => {
        if (window.counterMovesManager) {
            window.counterMovesManager.recordCounterMoveSuccess(opponentMove, wasSuccessful);
        }
    };
});


/**
 * Initialize the Learning Ease Manager when the chess tutelage system is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the chess game and tutelage system to initialize
    setTimeout(() => {
        if (window.chessTutelage) {
            // Initialize the learning ease manager
            window.learningEaseManager = new LearningEaseManager(window.chessTutelage);
            console.log("Learning Ease Manager initialized with bookstyle learning");

            // Hook into game end events
            const originalShowGameOver = window.chessGame.showGameOver;
            window.chessGame.showGameOver = function (message) {
                // Call original method
                originalShowGameOver.call(this, message);

                // Determine game result
                let result;
                if (message.includes('Checkmate') || message.includes('captured')) {
                    if (message.includes('White') || message.includes('white')) {
                        result = 'white';
                    } else {
                        result = 'black';
                    }
                } else {
                    result = 'draw';
                }

                // Notify learning ease manager
                if (window.learningEaseManager) {
                    window.learningEaseManager.handleGameEnd(result);
                }
            };
        }
    }, 1500); // Wait a bit longer than the tutelage system to ensure it's fully loaded
});

/**
 * Initialize the Learning Ease Manager when the chess tutelage system is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the chess game and tutelage system to initialize
    setTimeout(() => {
        if (window.chessTutelage) {
            // Initialize the learning ease manager
            window.learningEaseManager = new LearningEaseManager(window.chessTutelage);
            console.log("Learning Ease Manager initialized");
        }
    }, 1500); // Wait a bit longer than the tutelage system to ensure it's fully loaded
});
