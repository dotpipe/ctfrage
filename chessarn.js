class ChessARN {
  constructor(options = {}) {
    this.options = {
      jsonConfigPath: 'data/chess-paths.json',
      logLevel: 'info', // 'debug', 'info', 'warn', 'error', or 'none'
      logToConsole: true,
      logToElement: null, // ID of HTML element to log to
      maxLogEntries: 1000,
      ...options
    };
    
    this.data = null;
    this.currentPathId = null;
    this.currentMoveIndex = 0;
    this.activeBranch = null;
    this.initialized = false;
    
    // Initialize logging
    this.logEntries = [];
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      none: 4
    };
  }
  
  // Logging methods
  log(level, message, data = null) {
    // Check if we should log this level
    if (this.logLevels[level] < this.logLevels[this.options.logLevel]) {
      return;
    }
    
    const timestamp = new Date();
    const entry = {
      timestamp,
      level,
      message,
      data,
      position: this.initialized ? {
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        branch: this.activeBranch,
        fen: this.initialized ? this.getCurrentFEN() : null
      } : null
    };
    
    // Add to log entries
    this.logEntries.push(entry);
    
    // Trim log if needed
    if (this.logEntries.length > this.options.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.options.maxLogEntries);
    }
    
    // Log to console if enabled
    if (this.options.logToConsole) {
      const formattedTime = timestamp.toISOString().replace('T', ' ').substr(0, 19);
      const prefix = `[${formattedTime}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'debug':
          console.debug(prefix, message, data || '');
          break;
        case 'info':
          console.info(prefix, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, message, data || '');
          break;
        case 'error':
          console.error(prefix, message, data || '');
          break;
      }
    }
    
    // Log to HTML element if specified
    if (this.options.logToElement) {
      this.updateLogElement();
    }
    
    return entry;
  }
  
  // Convenience logging methods
  debug(message, data = null) {
    return this.log('debug', message, data);
  }
  
  info(message, data = null) {
    return this.log('info', message, data);
  }
  
  warn(message, data = null) {
    return this.log('warn', message, data);
  }
  
  error(message, data = null) {
    return this.log('error', message, data);
  }
  
  // Update the HTML log element
  updateLogElement() {
    if (!this.options.logToElement) {
      return;
    }
    
    const element = document.getElementById(this.options.logToElement);
    if (!element) {
      console.warn(`Log element with ID ${this.options.logToElement} not found`);
      return;
    }
    
    // Clear the element
    element.innerHTML = '';
    
    // Create a container for the logs
    const logContainer = document.createElement('div');
    logContainer.className = 'chess-arn-log';
    
    // Add each log entry
    for (const entry of this.logEntries) {
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry log-${entry.level}`;
      
      const time = entry.timestamp.toISOString().replace('T', ' ').substr(11, 8);
      
      logEntry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-level ${entry.level}">${entry.level.toUpperCase()}</span>
        <span class="log-message">${entry.message}</span>
      `;
      
      if (entry.data) {
        const dataElement = document.createElement('pre');
        dataElement.className = 'log-data';
        dataElement.textContent = typeof entry.data === 'object' 
          ? JSON.stringify(entry.data, null, 2) 
          : entry.data.toString();
        logEntry.appendChild(dataElement);
      }
      
      logContainer.appendChild(logEntry);
    }
    
    element.appendChild(logContainer);
    
    // Scroll to bottom
    element.scrollTop = element.scrollHeight;
  }
  
  // Get log entries
  getLogs(level = null, limit = null) {
    if (!level) {
      return limit ? this.logEntries.slice(-limit) : [...this.logEntries];
    }
    
    const filtered = this.logEntries.filter(entry => entry.level === level);
    return limit ? filtered.slice(-limit) : filtered;
  }
  
  // Clear logs
  clearLogs() {
    this.logEntries = [];
    if (this.options.logToElement) {
      this.updateLogElement();
    }
    this.debug('Logs cleared');
  }
  
  // Set log level
  setLogLevel(level) {
    if (!this.logLevels.hasOwnProperty(level)) {
      this.warn(`Invalid log level: ${level}`);
      return false;
    }
    
    this.options.logLevel = level;
    this.info(`Log level set to ${level}`);
    return true;
  }
  
  // Export logs to JSON
  exportLogs() {
    return JSON.stringify(this.logEntries, null, 2);
  }
  
  // Initialize the ChessARN system
  async initialize() {
    try {
      this.debug('Initializing ChessARN');
      
      // Load the JSON move tree
      const response = await fetch(this.options.jsonConfigPath);
      if (!response.ok) {
        throw new Error(`Failed to load move data: ${response.status} ${response.statusText}`);
      }
      
      this.data = await response.json();
      this.currentPathId = Object.keys(this.data.paths)[0]; // Default to first path
      this.currentMoveIndex = 0;
      this.activeBranch = null;
      this.initialized = true;
      
      this.info('ChessARN initialized successfully', {
        configPath: this.options.jsonConfigPath,
        pathsLoaded: Object.keys(this.data.paths).length
      });
      
      return true;
    } catch (error) {
      this.error('Error initializing ChessARN', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }
  
  // Load a different move data JSON file
  async loadMoveData(jsonPath) {
    this.info(`Loading move data from ${jsonPath}`);
    this.options.jsonConfigPath = jsonPath;
    this.initialized = false;
    return await this.initialize();
  }
  
  // Get all available paths
  getPaths() {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    this.debug('Getting available paths');
    
    const paths = Object.entries(this.data.paths).map(([id, path]) => ({
      id,
      name: path.name,
      evaluation: path.evaluation,
      firstMove: path.moves[0]
    }));
    
    this.debug('Paths retrieved', { count: paths.length });
    return paths;
  }
  
  // Switch to a specific path
  switchPath(pathId) {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    if (!this.data.paths[pathId]) {
      this.error(`Path ${pathId} not found`);
      throw new Error(`Path ${pathId} not found`);
    }
    
    this.info(`Switching to path: ${pathId}`, {
      from: this.currentPathId,
      to: pathId
    });
    
    this.currentPathId = pathId;
    this.currentMoveIndex = 0;
    this.activeBranch = null;
    
    const position = this.getCurrentPosition();
    this.debug('Switched to new path', {
      pathId,
      position: position
    });
    
    return position;
  }
  
  // Get the current position
  getCurrentPosition() {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    const path = this.data.paths[this.currentPathId];
    
    try {
      if (this.activeBranch) {
        // We're in a branch
        const [branchStartIndex, branchMove] = this.activeBranch;
        const branch = path.branches[branchStartIndex][branchMove];
        
        // Calculate the effective index within the branch
        const branchIndex = this.currentMoveIndex - branchStartIndex;
        
        if (branchIndex >= 0 && branchIndex < branch.positions.length) {
          this.debug('Getting position from branch', {
            pathId: this.currentPathId,
            branchStartIndex,
            branchMove,
            branchIndex,
            moveIndex: this.currentMoveIndex
          });
          return branch.positions[branchIndex];
        }
      } else {
        // We're in the main line
        if (this.currentMoveIndex >= 0 && this.currentMoveIndex < path.positions.length) {
          this.debug('Getting position from main line', {
            pathId: this.currentPathId,
            moveIndex: this.currentMoveIndex
          });
          return path.positions[this.currentMoveIndex];
        }
      }
      
      this.error('Invalid position index', {
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        branch: this.activeBranch
      });
      throw new Error('Invalid position index');
    } catch (error) {
      this.error('Error getting current position', {
        error: error.message,
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        branch: this.activeBranch
      });
      throw error;
    }
  }
  
  // Get the current FEN
  getCurrentFEN() {
    try {
      const position = this.getCurrentPosition();
      return position.fen;
    } catch (error) {
      this.error('Error getting current FEN', { error: error.message });
      return null;
    }
  }
  
  // Move forward one move in the current path
  moveForward() {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    const path = this.data.paths[this.currentPathId];
    let result = null;
    
    try {
      if (this.activeBranch) {
        // We're in a branch
        const [branchStartIndex, branchMove] = this.activeBranch;
        const branch = path.branches[branchStartIndex][branchMove];
        
        // Calculate the effective index within the branch
        const branchIndex = this.currentMoveIndex - branchStartIndex;
        
        if (branchIndex + 1 < branch.positions.length) {
          this.currentMoveIndex++;
          result = this.getCurrentPosition();
          
          this.info('Moved forward in branch', {
            pathId: this.currentPathId,
            branch: this.activeBranch,
            moveIndex: this.currentMoveIndex,
            move: branch.moves[branchIndex]
          });
        } else {
          this.warn('Cannot move forward - end of branch reached', {
            pathId: this.currentPathId,
            branch: this.activeBranch,
            moveIndex: this.currentMoveIndex
          });
        }
      } else {
        // We're in the main line
        if (this.currentMoveIndex + 1 < path.positions.length) {
          this.currentMoveIndex++;
          result = this.getCurrentPosition();
          
          this.info('Moved forward in main line', {
            pathId: this.currentPathId,
            moveIndex: this.currentMoveIndex,
            move: path.moves[this.currentMoveIndex - 1]
          });
        } else {
          this.warn('Cannot move forward - end of path reached', {
            pathId: this.currentPathId,
            moveIndex: this.currentMoveIndex
          });
        }
      }
      
      return result;
    } catch (error) {
      this.error('Error moving forward', {
        error: error.message,
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        branch: this.activeBranch
      });
      throw error;
    }
  }
  
  // Move backward one move in the current path
  moveBackward() {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    try {
      if (this.currentMoveIndex > 0) {
        this.currentMoveIndex--;
        
        // If we're at the branch start point and in a branch, exit the branch
        if (this.activeBranch && this.currentMoveIndex === this.activeBranch[0]) {
          const branch = this.activeBranch;
          this.activeBranch = null;
          
          this.info('Exited branch while moving backward', {
            pathId: this.currentPathId,
            branch,
            moveIndex: this.currentMoveIndex
          });
        } else {
          this.info('Moved backward', {
            pathId: this.currentPathId,
            moveIndex: this.currentMoveIndex,
            inBranch: this.activeBranch !== null
          });
        }
        
        return this.getCurrentPosition();
      } else {
        this.warn('Cannot move backward - at start of path', {
          pathId: this.currentPathId,
          moveIndex: this.currentMoveIndex
        });
        return null;
      }
    } catch (error) {
      this.error('Error moving backward', {
        error: error.message,
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        branch: this.activeBranch
      });
      throw error;
    }
  }
  
  // Get available branches at the current position
  getAvailableBranches() {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    const path = this.data.paths[this.currentPathId];
    
    try {
      // If we're already in a branch, there are no sub-branches (for simplicity)
      if (this.activeBranch) {
        this.debug('No branches available while in a branch');
        return [];
      }
      
      // Check if there are branches at the current index
      if (path.branches && path.branches[this.currentMoveIndex]) {
        const branches = Object.entries(path.branches[this.currentMoveIndex]).map(([move, branch]) => ({
          move,
          name: branch.name,
          evaluation: branch.evaluation
        }));
        
        this.debug('Found branches at current position', {
          count: branches.length,
          branches: branches.map(b => b.move)
        });
        
        return branches;
      }
      
      this.debug('No branches at current position');
      return [];
    } catch (error) {
      this.error('Error getting available branches', {
        error: error.message,
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex
      });
      throw error;
    }
  }
  
  // Enter a branch at the current position
  enterBranch(move) {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    const path = this.data.paths[this.currentPathId];
    
    try {
      // Check if the branch exists
      if (path.branches && 
          path.branches[this.currentMoveIndex] && 
          path.branches[this.currentMoveIndex][move]) {
        
        this.info(`Entering branch with move ${move}`, {
          pathId: this.currentPathId,
          moveIndex: this.currentMoveIndex,
          move
        });
        
        this.activeBranch = [this.currentMoveIndex, move];
        // We're now at the first move of the branch
        this.currentMoveIndex++;
        
        return this.getCurrentPosition();
      }
      
      this.error(`Branch with move ${move} not found at current position`, {
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        availableBranches: path.branches && path.branches[this.currentMoveIndex] 
          ? Object.keys(path.branches[this.currentMoveIndex]) 
          : []
      });
      
      throw new Error(`Branch with move ${move} not found at current position`);
    } catch (error) {
      this.error('Error entering branch', {
        error: error.message,
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        move
      });
      throw error;
    }
  }
  
  // Exit the current branch and return to the main line
  exitBranch() {
    if (!this.initialized || !this.activeBranch) {
      this.error('Not in a branch');
      throw new Error('Not in a branch');
    }
    
    try {
      const branch = this.activeBranch;
      
      // Return to the position where the branch started
      this.currentMoveIndex = this.activeBranch[0];
      this.activeBranch = null;
      
      this.info('Exited branch', {
        pathId: this.currentPathId,
        branch,
        moveIndex: this.currentMoveIndex
      });
      
      return this.getCurrentPosition();
    } catch (error) {
      this.error('Error exiting branch', {
        error: error.message,
        pathId: this.currentPathId,
        branch: this.activeBranch
      });
      throw error;
    }
  }
  
  // Generate a report about the current position
  generateReport() {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    try {
      const position = this.getCurrentPosition();
      const pathSummary = this.getPathSummary();
      const currentMove = this.getCurrentMove();
      const nextMove = this.getNextMove();
      const branches = this.getAvailableBranches();
      
      let report = '';
      
      if (pathSummary.inBranch) {
        report += `Position in ${pathSummary.branchInfo.name} (branch of ${pathSummary.name})\n`;
      } else {
        report += `Position in ${pathSummary.name}\n`;
      }
      
      report += `FEN: ${position.fen}\n`;
      report += `Evaluation: ${position.evaluation > 0 ? '+' : ''}${position.evaluation}\n`;
      
      if (position.comment) {
        report += `Comment: ${position.comment}\n`;
      }
      
      if (currentMove) {
        report += `Last move: ${currentMove}\n`;
      }
      
      if (nextMove) {
        report += `Next move: ${nextMove}\n`;
      }
      
      if (branches.length > 0) {
        report += '\nAvailable branches:\n';
        branches.forEach(branch => {
          report += `- ${branch.move} (${branch.name}): ${branch.evaluation > 0 ? '+' : ''}${branch.evaluation}\n`;
        });
      }
      
      this.debug('Generated position report');
      return report;
    } catch (error) {
      this.error('Error generating report', {
        error: error.message,
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        branch: this.activeBranch
      });
      throw error;
    }
  }
  
  // Get the current move
  getCurrentMove() {
    if (!this.initialized || this.currentMoveIndex === 0) {
      return null; // No move at the starting position
    }
    
    try {
      const path = this.data.paths[this.currentPathId];
      
      if (this.activeBranch) {
        // We're in a branch
        const [branchStartIndex, branchMove] = this.activeBranch;
        const branch = path.branches[branchStartIndex][branchMove];
        
        // Calculate the effective index within the branch
        const branchIndex = this.currentMoveIndex - branchStartIndex - 1;
        
        if (branchIndex >= 0 && branchIndex < branch.moves.length) {
          return branch.moves[branchIndex];
        } else if (branchIndex === -1) {
          // We're at the first position of the branch, so the move is the branch name
          return branchMove;
        }
      } else {
        // We're in the main line
        if (this.currentMoveIndex > 0 && this.currentMoveIndex <= path.moves.length) {
          return path.moves[this.currentMoveIndex - 1];
        }
      }
      
      return null;
    } catch (error) {
      this.error('Error getting current move', {
        error: error.message,
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        branch: this.activeBranch
      });
      return null;
    }
  }
  
  // Get the next move in the current path
  getNextMove() {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    try {
      const path = this.data.paths[this.currentPathId];
      
      if (this.activeBranch) {
        // We're in a branch
        const [branchStartIndex, branchMove] = this.activeBranch;
        const branch = path.branches[branchStartIndex][branchMove];
        
        // Calculate the effective index within the branch
        const branchIndex = this.currentMoveIndex - branchStartIndex;
        
        if (branchIndex < branch.moves.length - 1) {
          return branch.moves[branchIndex + 1];
        }
      } else {
        // We're in the main line
        if (this.currentMoveIndex < path.moves.length - 1) {
          return path.moves[this.currentMoveIndex + 1];
        }
      }
      
      return null; // No next move
    } catch (error) {
      this.error('Error getting next move', {
        error: error.message,
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        branch: this.activeBranch
      });
      return null;
    }
  }
  
  // Get a summary of the current path
  getPathSummary() {
    if (!this.initialized) {
      this.error('ChessARN not initialized');
      throw new Error('ChessARN not initialized');
    }
    
    try {
      const path = this.data.paths[this.currentPathId];
      
      return {
        id: this.currentPathId,
        name: path.name,
        evaluation: path.evaluation,
        moves: path.moves,
        currentMove: this.currentMoveIndex,
        inBranch: this.activeBranch !== null,
        branchInfo: this.activeBranch ? {
          startIndex: this.activeBranch[0],
          move: this.activeBranch[1],
          name: path.branches[this.activeBranch[0]][this.activeBranch[1]].name
        } : null
      };
    } catch (error) {
      this.error('Error getting path summary', {
        error: error.message,
        pathId: this.currentPathId,
        moveIndex: this.currentMoveIndex,
        branch: this.activeBranch
      });
      throw error;
    }
  }
}
