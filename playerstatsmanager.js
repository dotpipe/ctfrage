/**
 * PlayerStatsManager - Tracks player statistics, ranking, and performance
 * Uses localStorage for persistence with cookie fallback
 */
export class PlayerStatsManager {
    constructor() {
        // Player statistics
        this.stats = {
            games: {
                total: 0,
                wins: 0,
                losses: 0,
                draws: 0
            },
            rating: {
                current: 1200, // Starting ELO
                peak: 1200,
                history: []
            },
            mistakes: {
                total: 0,
                byGame: [],
                rate: 0.000 // 3 decimal places as requested
            },
            performance: {
                averageMovesPerGame: 0,
                totalMoves: 0,
                winStreak: 0,
                bestWinStreak: 0,
                lastGameDate: null,
                firstGameDate: null
            }
        };
        
        // Load existing stats
        this.loadStats();
    }
    
    /**
     * Load player statistics from localStorage or cookies
     */
    loadStats() {
        try {
            // Try localStorage first
            const savedStats = localStorage.getItem('chess_player_stats');
            if (savedStats) {
                this.stats = JSON.parse(savedStats);
                console.log("Player stats loaded from localStorage");
                return;
            }
            
            // Fall back to cookies if localStorage is not available
            const cookieStats = this.getCookie('chess_player_stats');
            if (cookieStats) {
                this.stats = JSON.parse(cookieStats);
                console.log("Player stats loaded from cookies");
                return;
            }
            
            console.log("No existing player stats found. Starting fresh.");
        } catch (error) {
            console.error("Error loading player stats:", error);
            // Reset stats if there was an error
            this.resetStats();
        }
    }
    
    /**
     * Save player statistics to localStorage and cookies
     */
    saveStats() {
        try {
            // Save to localStorage
            localStorage.setItem('chess_player_stats', JSON.stringify(this.stats));
            
            // Also save to cookies as backup
            this.setCookie('chess_player_stats', JSON.stringify(this.stats), 365); // 1 year expiry
            
            console.log("Player stats saved");
        } catch (error) {
            console.error("Error saving player stats:", error);
        }
    }
    
    /**
     * Record a game result and update statistics
     * @param {string} result - 'win', 'loss', or 'draw'
     * @param {number} moveCount - Number of moves in the game
     * @param {number} mistakeCount - Number of mistakes made by player
     * @param {Object} opponent - Opponent information including rating
     */
    recordGameResult(result, moveCount = 0, mistakeCount = 0, opponent = { rating: 1200 }) {
        // Update game counts
        this.stats.games.total++;
        
        // Set first game date if this is the first game
        if (!this.stats.performance.firstGameDate) {
            this.stats.performance.firstGameDate = Date.now();
        }
        
        // Update last game date
        this.stats.performance.lastGameDate = Date.now();
        
        // Update result-specific stats
        if (result === 'win') {
            this.stats.games.wins++;
            this.stats.performance.winStreak++;
            
            // Update best win streak
            if (this.stats.performance.winStreak > this.stats.performance.bestWinStreak) {
                this.stats.performance.bestWinStreak = this.stats.performance.winStreak;
            }
            
            // Update rating (gain points for winning)
            this.updateRating(result, opponent.rating);
        } 
        else if (result === 'loss') {
            this.stats.games.losses++;
            this.stats.performance.winStreak = 0;
            
            // Update rating (lose points for losing)
            this.updateRating(result, opponent.rating);
        } 
        else if (result === 'draw') {
            this.stats.games.draws++;
            this.stats.performance.winStreak = 0;
            
            // Update rating (small adjustment for draw)
            this.updateRating(result, opponent.rating);
        }
        
        // Update move statistics
        this.stats.performance.totalMoves += moveCount;
        this.stats.performance.averageMovesPerGame = 
            this.stats.performance.totalMoves / this.stats.games.total;
        
        // Update mistake statistics
        this.stats.mistakes.total += mistakeCount;
        this.stats.mistakes.byGame.push({
            date: Date.now(),
            count: mistakeCount,
            moves: moveCount
        });
        
        // Keep only the last 50 games for mistake tracking
        if (this.stats.mistakes.byGame.length > 50) {
            this.stats.mistakes.byGame.shift();
        }
        
        // Calculate mistake rate (3 decimal places)
        if (this.stats.performance.totalMoves > 0) {
            this.stats.mistakes.rate = parseFloat(
                (this.stats.mistakes.total / this.stats.performance.totalMoves).toFixed(3)
            );
        }
        
        // Save updated stats
        this.saveStats();
        
        // Return the updated rating for immediate use
        return this.stats.rating.current;
    }
    
    /**
     * Record a mistake made by the player
     */
    recordMistake() {
        this.stats.mistakes.total++;
        
        // Recalculate mistake rate
        if (this.stats.performance.totalMoves > 0) {
            this.stats.mistakes.rate = parseFloat(
                (this.stats.mistakes.total / this.stats.performance.totalMoves).toFixed(3)
            );
        }
    }
    
    /**
     * Update player's ELO rating based on game result
     * @param {string} result - 'win', 'loss', or 'draw'
     * @param {number} opponentRating - Opponent's ELO rating
     */
    updateRating(result, opponentRating) {
        const K = 32; // K-factor for rating adjustments
        
        // Calculate expected score
        const expectedScore = this.getExpectedScore(this.stats.rating.current, opponentRating);
        
        // Calculate actual score
        let actualScore;
        switch (result) {
            case 'win':
                actualScore = 1.0;
                break;
            case 'draw':
                actualScore = 0.5;
                break;
            case 'loss':
                actualScore = 0.0;
                break;
            default:
                actualScore = 0.5;
        }
        
        // Calculate new rating
        const newRating = Math.round(this.stats.rating.current + K * (actualScore - expectedScore));
        
        // Add to rating history
        this.stats.rating.history.push({
            date: Date.now(),
            rating: newRating,
            change: newRating - this.stats.rating.current,
            result: result,
            opponentRating: opponentRating
        });
        
        // Keep history at a reasonable size
        if (this.stats.rating.history.length > 100) {
            this.stats.rating.history.shift();
        }
        
        // Update current rating
        this.stats.rating.current = newRating;
        
        // Update peak rating if needed
        if (newRating > this.stats.rating.peak) {
            this.stats.rating.peak = newRating;
        }
    }
    
    /**
     * Calculate expected score based on ELO ratings
     * @param {number} playerRating - Player's rating
     * @param {number} opponentRating - Opponent's rating
     * @returns {number} Expected score (0-1)
     */
    getExpectedScore(playerRating, opponentRating) {
        return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    }
    
    /**
     * Get player's current rating
     * @returns {number} Current ELO rating
     */
    getCurrentRating() {
        return this.stats.rating.current;
    }
    
    /**
     * Get player's mistake rate (3 decimal places)
     * @returns {number} Mistake rate
     */
    getMistakeRate() {
        return this.stats.mistakes.rate;
    }
    
    /**
     * Get player's win rate
     * @returns {number} Win rate (0-1)
     */
    getWinRate() {
        if (this.stats.games.total === 0) return 0;
        return this.stats.games.wins / this.stats.games.total;
    }
    
    /**
     * Get complete player statistics
     * @returns {Object} Player statistics
     */
    getStats() {
        return this.stats;
    }
    
    /**
     * Reset player statistics
     */
    resetStats() {
        this.stats = {
            games: {
                total: 0,
                wins: 0,
                losses: 0,
                draws: 0
            },
            rating: {
                current: 1200,
                peak: 1200,
                history: []
            },
            mistakes: {
                total: 0,
                byGame: [],
                rate: 0.000
            },
            performance: {
                averageMovesPerGame: 0,
                totalMoves: 0,
                winStreak: 0,
                bestWinStreak: 0,
                lastGameDate: null,
                firstGameDate: null
            }
        };
        
        this.saveStats();
    }
    
    /**
     * Helper method to set a cookie
     */
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }
    
    /**
     * Helper method to get a cookie
     */
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
}
