// AI Personality Display System with Modal
export class AIPersonalityDisplay {
    constructor(chessGame) {
        this.chessGame = chessGame;

        // Initialize preset opponents
        this.initializePresetOpponents();

        // Personality quotes
        this.personalityQuotes = {
            aggressive: [
                "Attack is the best form of defense.",
                "I don't play for draws, I play to win.",
                "Every piece is a weapon waiting to strike.",
                "The best way to refute a gambit is to accept it."
            ],
            defensive: [
                "Patience is the foundation of lasting success.",
                "A good defense creates the opportunity for offense.",
                "Solid foundations lead to stable victories.",
                "The strongest position is one that cannot be attacked."
            ],
            positional: [
                "Chess is 99% tactics. If you see a good move, look for a better one.",
                "The pawns are the soul of chess.",
                "Control the center, control the game.",
                "A knight on the rim is dim."
            ],
            tactical: [
                "Tactics flow from a superior position.",
                "Chess is a fairy tale of 1001 blunders.",
                "Combinations have always been the poetry of chess.",
                "Chess is life in miniature. Chess is struggle, chess is battles."
            ],
            balanced: [
                "Every move should have a purpose.",
                "Balance in all things leads to victory.",
                "Adaptability is the key to survival.",
                "The middle path often leads to the strongest position."
            ],
            hypermodern: [
                "Control the center from a distance.",
                "Challenge conventional wisdom at every turn.",
                "The flank attack is the modern way.",
                "Innovation is more valuable than tradition."
            ],
            dynamic: [
                "Chess is constant change, constant evolution.",
                "Create imbalance to find opportunity.",
                "The beauty of chess lies in its fluid nature.",
                "Embrace chaos, for in chaos lies opportunity."
            ]
        };

        this.createModal();
        this.setupEventListeners();
    }

    // Initialize preset opponents with consistent profiles
    initializePresetOpponents() {
        this.presetOpponents = [
            {
                id: 'beginner_balanced',
                name: 'Rookie Riley',
                personality: 'balanced',
                level: 1,
                bio: 'A beginner chess enthusiast who plays balanced but basic chess.',
                quote: 'I\'m still learning the ropes, but I love this game!'
            },
            {
                id: 'novice_aggressive',
                name: 'Attacking Annie',
                personality: 'aggressive',
                level: 2,
                bio: 'A novice player who loves to attack at every opportunity.',
                quote: 'The best defense is a good offense!'
            },
            {
                id: 'amateur_defensive',
                name: 'Defensive Dave',
                personality: 'defensive',
                level: 3,
                bio: 'An amateur who prefers solid, defensive play.',
                quote: 'Patience is the foundation of lasting success.'
            },
            {
                id: 'intermediate_tactical',
                name: 'Tactical Tim',
                personality: 'tactical',
                level: 4,
                bio: 'An intermediate player with a sharp eye for tactics.',
                quote: 'I see combinations in my sleep.'
            },
            {
                id: 'advanced_positional',
                name: 'Positional Paula',
                personality: 'positional',
                level: 5,
                bio: 'An advanced player who excels at positional understanding.',
                quote: 'Control the center, control the game.'
            },
            {
                id: 'expert_hypermodern',
                name: 'Modern Mike',
                personality: 'hypermodern',
                level: 6,
                bio: 'An expert who favors hypermodern approaches to chess.',
                quote: 'Why control the center directly when you can attack it from afar?'
            },
            {
                id: 'grandmaster_dynamic',
                name: 'Dynamic Diana',
                personality: 'dynamic',
                level: 7,
                bio: 'A grandmaster who thrives in dynamic, complex positions.',
                quote: 'Chess is constant change, constant evolution.'
            },
            {
                id: 'supergm_aggressive',
                name: 'Grandmaster Gabriel',
                personality: 'aggressive',
                level: 8,
                bio: 'A super GM with an aggressive, attacking style.',
                quote: 'Attack, always attack!'
            },
            {
                id: 'beginner_tactical',
                name: 'Tricky Terry',
                personality: 'tactical',
                level: 1,
                bio: 'A beginner who loves setting up simple tactics.',
                quote: 'I may be new, but I know a fork when I see one!'
            },
            {
                id: 'novice_positional',
                name: 'Pawn Structure Pete',
                personality: 'positional',
                level: 2,
                bio: 'A novice focused on learning proper piece placement.',
                quote: 'A knight on the rim is dim.'
            },
            {
                id: 'amateur_hypermodern',
                name: 'Flank Fiona',
                personality: 'hypermodern',
                level: 3,
                bio: 'An amateur experimenting with hypermodern openings.',
                quote: 'Why fight for the center immediately?'
            },
            {
                id: 'intermediate_balanced',
                name: 'Balanced Blake',
                personality: 'balanced',
                level: 4,
                bio: 'An intermediate player with a well-rounded approach.',
                quote: 'Every move should have a purpose.'
            },
            {
                id: 'advanced_aggressive',
                name: 'Attacking Alex',
                personality: 'aggressive',
                level: 5,
                bio: 'An advanced player who loves sacrificial attacks.',
                quote: 'Sacrifice is the essence of chess.'
            },
            {
                id: 'expert_defensive',
                name: 'Fortress Fran',
                personality: 'defensive',
                level: 6,
                bio: 'An expert in defensive chess and counterattacking.',
                quote: 'Build a fortress, then strike when they overextend.'
            },
            {
                id: 'grandmaster_positional',
                name: 'Strategic Stella',
                personality: 'positional',
                level: 7,
                bio: 'A grandmaster with exceptional positional understanding.',
                quote: 'Chess is 99% tactics, but the 1% strategy is everything.'
            },
            {
                id: 'supergm_tactical',
                name: 'Calculation Carlos',
                personality: 'tactical',
                level: 8,
                bio: 'A super GM who calculates variations with incredible depth.',
                quote: 'I see 20 moves ahead in critical positions.'
            }
        ];

        // Track which opponents have been used in this session
        this.usedOpponents = new Set();

        // Set current opponent
        this.currentOpponent = null;
    }

    // Select an opponent matching a specific level
    selectOpponentByLevel(level) {
        // Initialize preset opponents if not done yet
        if (!this.presetOpponents) {
            this.initializePresetOpponents();
        }

        // Get current opponent ID to avoid repeating
        const currentOpponentId = this.currentOpponent ? this.currentOpponent.id : null;

        // Filter opponents by the requested level
        let levelOpponents = this.presetOpponents.filter(opponent =>
            opponent.level === level && opponent.id !== currentOpponentId
        );

        // If no opponents at this level (or only the current one), create a dynamic one
        if (levelOpponents.length === 0) {
            // Get all personality types
            const personalities = Object.keys(this.chessGame.aiPersonalities);
            const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];

            // Create a dynamic opponent for this level
            const dynamicOpponent = {
                id: `dynamic_${randomPersonality}_${level}`,
                name: this.generateNameForPersonality(randomPersonality, level),
                personality: randomPersonality,
                level: level,
                bio: `A ${this.chessGame.skillLevels[level].name.toLowerCase()} player with a ${randomPersonality} style.`,
                quote: this.getRandomQuoteForPersonality(randomPersonality)
            };

            return dynamicOpponent;
        }

        // Select a random opponent from the matching level
        return levelOpponents[Math.floor(Math.random() * levelOpponents.length)];
    }

    // Generate a name for a personality and level
    generateNameForPersonality(personality, level) {
        // Level-appropriate prefixes
        const levelPrefixes = {
            1: ['Beginner', 'Novice', 'Rookie', 'Starter'],
            2: ['Casual', 'Amateur', 'Learning', 'Developing'],
            3: ['Improving', 'Progressing', 'Aspiring', 'Dedicated'],
            4: ['Intermediate', 'Competent', 'Skilled', 'Practiced'],
            5: ['Advanced', 'Proficient', 'Accomplished', 'Seasoned'],
            6: ['Expert', 'Master', 'Adept', 'Elite'],
            7: ['Grandmaster', 'Virtuoso', 'Maestro', 'Champion'],
            8: ['Super GM', 'Legendary', 'World-Class', 'Prodigy']
        };

        // Personality-based names
        const personalityNames = {
            aggressive: ['Attacker', 'Striker', 'Blitzer', 'Aggressor'],
            defensive: ['Defender', 'Guardian', 'Protector', 'Sentinel'],
            positional: ['Strategist', 'Architect', 'Planner', 'Structuralist'],
            tactical: ['Tactician', 'Calculator', 'Combinator', 'Trickster'],
            balanced: ['Harmonizer', 'Balancer', 'All-Rounder', 'Versatile'],
            hypermodern: ['Innovator', 'Modernist', 'Revolutionary', 'Reformer'],
            dynamic: ['Dynamo', 'Transformer', 'Shifter', 'Adaptor']
        };

        // Get random components
        const prefix = levelPrefixes[level][Math.floor(Math.random() * levelPrefixes[level].length)];
        const name = personalityNames[personality][Math.floor(Math.random() * personalityNames[personality].length)];

        // Generate a random first name initial
        const initials = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const initial = initials[Math.floor(Math.random() * initials.length)];

        // Combine into a name
        return `${prefix} ${name} ${initial}.`;
    }

    // Get a random quote for a personality
    getRandomQuoteForPersonality(personality) {
        const quotes = this.personalityQuotes[personality] || this.personalityQuotes.balanced;
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    // Create modal structure
    createModal() {
        // Add event listener to close modal
        const modalCloseBtn = document.querySelector('.modal-close');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const modalCloseFooterBtn = document.getElementById('modal-close-btn');
        if (modalCloseFooterBtn) {
            modalCloseFooterBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Close modal when clicking outside
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    this.closeModal();
                }
            });
        }
    }

    // Set up event listeners for expand button
    setupEventListeners() {
        // Add expand button to profile panel if it doesn't exist
        const profilePanel = document.querySelector('.ai-profile-panel');
        if (profilePanel && !document.querySelector('.expand-profile')) {
            const expandButton = document.createElement('button');
            expandButton.className = 'expand-profile';
            expandButton.innerHTML = '<i class="fas fa-expand-alt"></i>';
            expandButton.title = 'View full profile';
            expandButton.addEventListener('click', () => {
                this.openModal();
            });
            profilePanel.appendChild(expandButton);
        }
    }

    // Open modal with full profile
    openModal() {
        const modal = document.getElementById('profile-modal');
        if (!modal) return;

        // Update modal content with current AI data
        this.updateModalContent();

        // Show modal
        modal.classList.add('active');

        // Animate skill bars
        setTimeout(() => {
            this.animateModalSkillBars();
        }, 300);
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('profile-modal');
        if (!modal) return;

        modal.classList.remove('active');
    }

    // Update modal content
    updateModalContent() {
        const personality = this.chessGame.aiPersonality;
        if (!personality) return;

        const personalityType = personality.name.toLowerCase();

        // Update name and personality
        document.getElementById('modal-name').textContent = document.getElementById('ai-name').textContent;
        document.getElementById('modal-personality-name').textContent = personality.name;

        // Update personality icon
        const iconElement = document.getElementById('modal-personality-icon');
        iconElement.className = document.getElementById('personality-icon').className;
        iconElement.style.color = document.getElementById('personality-icon').style.color;

        // Update description
        document.getElementById('modal-personality-description').innerHTML = document.getElementById('ai-personality').innerHTML;

        // Update quote
        const quotes = this.personalityQuotes[personalityType] || this.personalityQuotes.balanced;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        document.getElementById('modal-personality-quote').textContent = randomQuote;

        // Update strengths and weaknesses
        const strengthsList = document.getElementById('modal-strengths');
        const weaknessesList = document.getElementById('modal-weaknesses');

        strengthsList.innerHTML = document.getElementById('ai-strengths').innerHTML;
        weaknessesList.innerHTML = document.getElementById('ai-weaknesses').innerHTML;

        // Update favorite openings
        document.getElementById('modal-favorite-openings').innerHTML = document.getElementById('favorite-openings').innerHTML;

        // Update playing history (simulated data)
        document.getElementById('modal-games-played').textContent = Math.floor(Math.random() * 100) + 50;
        document.getElementById('modal-win-rate').textContent = Math.floor(Math.random() * 30 + 40) + '%';
        document.getElementById('modal-avg-game-length').textContent = Math.floor(Math.random() * 20 + 30) + ' moves';

        // Set modal header style based on personality
        const modalHeader = document.querySelector('.modal-content .modal-header');
        modalHeader.className = 'modal-header'; // Reset
        modalHeader.classList.add(personalityType);

        // Set modal content style based on personality
        const modalContent = document.querySelector('.modal-content');
        modalContent.className = 'modal-content'; // Reset
        modalContent.classList.add(personalityType);
    }

    // Animate skill bars in modal
    animateModalSkillBars() {
        const personality = this.chessGame.aiPersonality;
        if (!personality) return;

        const personalityType = personality.name.toLowerCase();

        // Calculate skill levels based on personality and AI level
        const aiLevel = this.chessGame.aiLevel;

        // Base skill percentages (adjusted by AI level)
        const basePercentage = (aiLevel / 8) * 100;

        // Skill modifiers based on personality
        const skillModifiers = {
            aggressive: {
                opening: 0,
                middlegame: +10,
                endgame: -15,
                tactics: +15,
                strategy: -10
            },
            defensive: {
                opening: -5,
                middlegame: 0,
                endgame: +15,
                tactics: -10,
                strategy: +10
            },
            positional: {
                opening: +5,
                middlegame: +10,
                endgame: +5,
                tactics: -5,
                strategy: +15
            },
            tactical: {
                opening: -5,
                middlegame: +5,
                endgame: -5,
                tactics: +20,
                strategy: -5
            },
            balanced: {
                opening: +5,
                middlegame: +5,
                endgame: +5,
                tactics: +5,
                strategy: +5
            },
            hypermodern: {
                opening: +15,
                middlegame: +5,
                endgame: -5,
                tactics: 0,
                strategy: +10
            },
            dynamic: {
                opening: 0,
                middlegame: +15,
                endgame: -5,
                tactics: +10,
                strategy: +5
            }
        };

        // Get modifiers for this personality
        const modifiers = skillModifiers[personalityType] || skillModifiers.balanced;

        // Animate each skill bar
        this.animateSkillBar('modal-opening-skill', basePercentage + modifiers.opening);
        this.animateSkillBar('modal-middlegame-skill', basePercentage + modifiers.middlegame);
        this.animateSkillBar('modal-endgame-skill', basePercentage + modifiers.endgame);
        this.animateSkillBar('modal-tactics-skill', basePercentage + modifiers.tactics);
        this.animateSkillBar('modal-strategy-skill', basePercentage + modifiers.strategy);
    }

    // Animate a single skill bar
    animateSkillBar(elementId, percentage) {
        const barElement = document.getElementById(elementId);
        if (!barElement) return;

        // Ensure percentage is within bounds
        const clampedPercentage = Math.min(100, Math.max(10, percentage));

        // Set target width as CSS variable
        barElement.style.setProperty('--target-width', `${clampedPercentage}%`);

        // Add animation class
        barElement.classList.add('animate');

        // Color based on skill level
        if (clampedPercentage >= 80) {
            barElement.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
        } else if (clampedPercentage >= 60) {
            barElement.style.background = 'linear-gradient(90deg, #2980b9, #3498db)';
        } else if (clampedPercentage >= 40) {
            barElement.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
        } else {
            barElement.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
        }
    }

    // Method to generate a completely new opponent
    generateNewOpponent() {
        // Initialize preset opponents if not done yet
        if (!this.presetOpponents) {
            this.initializePresetOpponents();
        }

        // Show loading indicator
        this.showLoadingIndicator();

        // Get current opponent ID to avoid repeating
        const currentOpponentId = this.currentOpponent ? this.currentOpponent.id : null;

        // Filter out the current opponent and get available opponents
        let availableOpponents = this.presetOpponents.filter(opponent =>
            opponent.id !== currentOpponentId
        );

        // If we've used too many opponents, reset the used list
        if (this.usedOpponents.size > this.presetOpponents.length / 2) {
            this.usedOpponents.clear();
        }

        // Further filter to prefer opponents we haven't used recently
        const freshOpponents = availableOpponents.filter(opponent =>
            !this.usedOpponents.has(opponent.id)
        );

        // Use fresh opponents if available, otherwise use any available
        const opponentPool = freshOpponents.length > 0 ? freshOpponents : availableOpponents;

        // Select a random opponent from the pool
        const newOpponent = opponentPool[Math.floor(Math.random() * opponentPool.length)];

        // Mark this opponent as used
        this.usedOpponents.add(newOpponent.id);

        // Store as current opponent
        this.currentOpponent = newOpponent;

        // Apply the opponent's personality and level to the chess game
        this.chessGame.preferredPersonality = newOpponent.personality;
        this.chessGame.aiLevel = newOpponent.level;

        // Update difficulty selector in UI
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.value = newOpponent.level;
            // Trigger change event to update skill description
            const event = new Event('change');
            difficultySelect.dispatchEvent(event);
        }

        // Add animation class for transition
        const profilePanel = document.querySelector('.ai-profile-panel');
        if (profilePanel) {
            profilePanel.classList.add('changing');

            // Wait for the fade-out part of the animation to complete before updating content
            setTimeout(() => {
                // Force the chess game to update its personality
                if (this.chessGame.setPreferredPersonality) {
                    this.chessGame.setPreferredPersonality(newOpponent.personality);
                } else {
                    this.chessGame.aiPersonality = this.chessGame.aiPersonalities[newOpponent.personality];
                    // Initialize opening repertoire based on new personality
                    if (this.chessGame.initializeOpeningRepertoire) {
                        this.chessGame.initializeOpeningRepertoire();
                    }
                }

                // Update the profile display
                this.updateOpponentProfile(newOpponent);

                // Remove animation class after content is updated
                setTimeout(() => {
                    profilePanel.classList.remove('changing');
                }, 50);
            }, 300); // This timing should match the midpoint of the animation
        }

        // Hide loading indicator after a short delay
        setTimeout(() => {
            this.hideLoadingIndicator();

            // Show notification about new opponent
            this.showNewOpponentNotification(newOpponent);
        }, 800);

        console.log(`New opponent generated: ${newOpponent.name} (${newOpponent.personality} at level ${newOpponent.level})`);
        return newOpponent;
    }

    // Update the profile display with a specific opponent
    updateOpponentProfile(opponent) {
        // Set the opponent's name
        const nameElement = document.getElementById('ai-name');
        if (nameElement) {
            nameElement.textContent = opponent.name;
        }

        // Update personality badge
        this.updatePersonalityBadge(this.chessGame.aiPersonality);

        // Update personality description
        this.updatePersonalityDescription(this.chessGame.aiPersonality);

        // Update strengths and weaknesses
        this.updateStrengthsWeaknesses(this.chessGame.aiPersonality);

        // Update skill bars
        this.updateSkillBars(this.chessGame.aiPersonality);

        // Update favorite openings
        this.updateFavoriteOpenings();

        // Set the opponent's custom quote if available
        if (opponent.quote) {
            const quoteElement = document.querySelector('.personality-quote');
            if (quoteElement) {
                quoteElement.textContent = opponent.quote;
            }
        } else {
            // Otherwise use a random quote for the personality
            this.updatePersonalityQuote(opponent.personality);
        }

        // Update profile panel class based on personality
        const profilePanel = document.querySelector('.ai-profile-panel');
        if (profilePanel) {
            // Remove all personality classes
            profilePanel.classList.remove(
                'aggressive', 'defensive', 'positional',
                'tactical', 'balanced', 'hypermodern', 'dynamic'
            );

            // Add current personality class
            profilePanel.classList.add(opponent.personality);
        }
    }

    // Show notification about new opponent
    showNewOpponentNotification(opponent) {
        // Create notification if it doesn't exist
        if (!document.querySelector('.opponent-notification')) {
            const notification = document.createElement('div');
            notification.className = 'opponent-notification';

            // Get personality name with proper capitalization
            const personalityName = this.chessGame.aiPersonalities[opponent.personality].name;

            // Get difficulty level name
            const difficultyName = this.chessGame.skillLevels[opponent.level].name;

            notification.innerHTML = `
                <div class="notification-content">
                    <i class="${document.getElementById('personality-icon').className}"></i>
                    <div class="notification-text">
                        <strong>New Opponent:</strong> ${opponent.name}
                        <div class="notification-details">
                            ${personalityName} style • ${difficultyName} level
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(notification);

            // Add active class after a small delay (for animation)
            setTimeout(() => {
                notification.classList.add('active');
            }, 10);

            // Remove notification after a delay
            setTimeout(() => {
                notification.classList.remove('active');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }, 4000);
        }
    }

    // Show loading indicator
    showLoadingIndicator() {
        // Create loading overlay if it doesn't exist
        if (!document.querySelector('.opponent-loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'opponent-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Finding new opponent...</div>
            `;

            const profilePanel = document.querySelector('.ai-profile-panel');
            if (profilePanel) {
                profilePanel.appendChild(overlay);
            }
        }
    }

    // Hide loading indicator
    hideLoadingIndicator() {
        const overlay = document.querySelector('.opponent-loading-overlay');
        if (overlay && overlay.parentNode) {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }
    }

    // Update the display with the current AI personality
    updateDisplay() {
        const personality = this.chessGame.aiPersonality;
        if (!personality) return;

        const personalityType = personality.name.toLowerCase();

        // Update profile panel class based on personality
        const profilePanel = document.querySelector('.ai-profile-panel');
        if (profilePanel) {
            // Remove all personality classes
            profilePanel.classList.remove(
                'aggressive', 'defensive', 'positional',
                'tactical', 'balanced', 'hypermodern', 'dynamic'
            );

            // Add current personality class
            profilePanel.classList.add(personalityType);
        }

        // Update name if we have a current opponent
        if (this.currentOpponent) {
            const nameElement = document.getElementById('ai-name');
            if (nameElement) {
                nameElement.textContent = this.currentOpponent.name;
            }
        }

        // Update personality badge
        this.updatePersonalityBadge(personality);

        // Update personality description
        this.updatePersonalityDescription(personality);

        // Update strengths and weaknesses
        this.updateStrengthsWeaknesses(personality);

        // Update skill bars
        this.updateSkillBars(personality);

        // Update favorite openings
        this.updateFavoriteOpenings();

        // Add a personality quote
        this.updatePersonalityQuote(personalityType);
    }

    // Update personality badge
    updatePersonalityBadge(personality) {
        const iconElement = document.getElementById('personality-icon');
        const nameElement = document.getElementById('personality-name');

        if (!iconElement || !nameElement) return;

        // Set icon based on personality
        let iconClass = 'fas ';
        switch (personality.name) {
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
        nameElement.textContent = personality.name;
    }

    // Update personality description
    updatePersonalityDescription(personality) {
        const descElement = document.getElementById('ai-personality');
        if (!descElement) return;

        descElement.innerHTML = this.chessGame.createPersonalityProfile();
    }

    // Update personality quote
    updatePersonalityQuote(personalityType) {
        // Get quote element
        const quoteElement = document.querySelector('.personality-quote');
        if (!quoteElement) return;

        // If we have a current opponent with a custom quote, use that
        if (this.currentOpponent && this.currentOpponent.quote) {
            quoteElement.textContent = this.currentOpponent.quote;
            return;
        }

        // Otherwise get random quote for this personality
        const quotes = this.personalityQuotes[personalityType] || this.personalityQuotes.balanced;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        quoteElement.textContent = randomQuote;
    }

    // Update strengths and weaknesses
    updateStrengthsWeaknesses(personality) {
        const strengthsElement = document.getElementById('ai-strengths');
        const weaknessesElement = document.getElementById('ai-weaknesses');

        if (!strengthsElement || !weaknessesElement) return;

        // Clear existing lists
        strengthsElement.innerHTML = '';
        weaknessesElement.innerHTML = '';

        // Define strengths and weaknesses based on personality
        const traits = {
            aggressive: {
                strengths: [
                    'Quick attacks and pressure',
                    'Excellent at exploiting weaknesses',
                    'Strong tactical vision',
                    'Willing to sacrifice for initiative'
                ],
                weaknesses: [
                    'May overextend in attacks',
                    'Can neglect defensive needs',
                    'Sometimes overlooks long-term strategy',
                    'Impatient in closed positions'
                ]
            },
            defensive: {
                strengths: [
                    'Excellent defensive technique',
                    'Patient and careful play',
                    'Strong pawn structure management',
                    'Good at neutralizing attacks'
                ],
                weaknesses: [
                    'Can be too passive',
                    'Misses attacking opportunities',
                    'Slow development in openings',
                    'Struggles with initiative'
                ]
            },
            positional: {
                strengths: [
                    'Superior piece placement',
                    'Strong pawn structure awareness',
                    'Excellent planning ability',
                    'Controls key squares effectively'
                ],
                weaknesses: [
                    'May miss tactical opportunities',
                    'Can be too methodical',
                    'Sometimes avoids necessary complications',
                    'Struggles in chaotic positions'
                ]
            },
            tactical: {
                strengths: [
                    'Excellent calculation ability',
                    'Spots combinations quickly',
                    'Strong at exploiting weaknesses',
                    'Thrives in complex positions'
                ],
                weaknesses: [
                    'Can overlook positional factors',
                    'Sometimes forces tactics when not available',
                    'May sacrifice too much for attack',
                    'Struggles in quiet positions'
                ]
            },
            balanced: {
                strengths: [
                    'Well-rounded play style',
                    'Adapts to different positions',
                    'Balanced between attack and defense',
                    'Few exploitable weaknesses'
                ],
                weaknesses: [
                    'Jack of all trades, master of none',
                    'May lack specialized knowledge',
                    'Sometimes indecisive in critical positions',
                    'Can be predictable'
                ]
            },
            hypermodern: {
                strengths: [
                    'Creative opening approaches',
                    'Strong flank control',
                    'Excellent fianchetto usage',
                    'Indirect center control'
                ],
                weaknesses: [
                    'Can be vulnerable in early game',
                    'Sometimes too complex for own good',
                    'May give up too much space initially',
                    'Struggles against direct approaches'
                ]
            },
            dynamic: {
                strengths: [
                    'Thrives in fluid positions',
                    'Excellent piece activity',
                    'Creates imbalances effectively',
                    'Comfortable with tension'
                ],
                weaknesses: [
                    'Can create unnecessary complications',
                    'Sometimes overlooks stable advantages',
                    'May take excessive risks',
                    'Inconsistent performance'
                ]
            }
        };

        // Get traits for this personality
        const personalityType = personality.name.toLowerCase();
        const personalityTraits = traits[personalityType] || traits.balanced;

        // Add strengths
        personalityTraits.strengths.forEach(strength => {
            const li = document.createElement('li');
            li.textContent = strength;
            strengthsElement.appendChild(li);
        });

        // Add weaknesses
        personalityTraits.weaknesses.forEach(weakness => {
            const li = document.createElement('li');
            li.textContent = weakness;
            weaknessesElement.appendChild(li);
        });
    }

    // Update skill bars
    updateSkillBars(personality) {
        // Calculate skill levels based on personality and AI level
        const aiLevel = this.chessGame.aiLevel;
        const personalityType = personality.name.toLowerCase();

        // Base skill percentages (adjusted by AI level)
        const basePercentage = (aiLevel / 8) * 100;

        // Skill modifiers based on personality
        const skillModifiers = {
            aggressive: {
                opening: 0,
                middlegame: +10,
                endgame: -15,
                tactics: +15,
                strategy: -10
            },
            defensive: {
                opening: -5,
                middlegame: 0,
                endgame: +15,
                tactics: -10,
                strategy: +10
            },
            positional: {
                opening: +5,
                middlegame: +10,
                endgame: +5,
                tactics: -5,
                strategy: +15
            },
            tactical: {
                opening: -5,
                middlegame: +5,
                endgame: -5,
                tactics: +20,
                strategy: -5
            },
            balanced: {
                opening: +5,
                middlegame: +5,
                endgame: +5,
                tactics: +5,
                strategy: +5
            },
            hypermodern: {
                opening: +15,
                middlegame: +5,
                endgame: -5,
                tactics: 0,
                strategy: +10
            },
            dynamic: {
                opening: 0,
                middlegame: +15,
                endgame: -5,
                tactics: +10,
                strategy: +5
            }
        };

        // Get modifiers for this personality
        const modifiers = skillModifiers[personalityType] || skillModifiers.balanced;

        // Update each skill bar
        this.updateSkillBar('opening-skill', basePercentage + modifiers.opening);
        this.updateSkillBar('middlegame-skill', basePercentage + modifiers.middlegame);
        this.updateSkillBar('endgame-skill', basePercentage + modifiers.endgame);
        this.updateSkillBar('tactics-skill', basePercentage + modifiers.tactics);
        this.updateSkillBar('strategy-skill', basePercentage + modifiers.strategy);
    }

    // Update a single skill bar
    updateSkillBar(elementId, percentage) {
        const barElement = document.getElementById(elementId);
        if (!barElement) return;

        // Ensure percentage is within bounds
        const clampedPercentage = Math.min(100, Math.max(10, percentage));

        // Animate the bar
        barElement.style.width = '0%';
        setTimeout(() => {
            barElement.style.width = `${clampedPercentage}%`;
        }, 100);
    }

    // Update favorite openings
    updateFavoriteOpenings() {
        const openingsElement = document.getElementById('favorite-openings');
        if (!openingsElement) return;

        // Clear existing openings
        openingsElement.innerHTML = '';

        // Get openings from repertoire
        const openings = this.chessGame.currentRepertoire || [];

        if (openings.length === 0) {
            openingsElement.textContent = 'No specific opening preferences';
            return;
        }

        // Add each opening as a tag
        openings.forEach(opening => {
            const tag = document.createElement('div');
            tag.className = 'opening-tag';
            tag.textContent = opening;
            openingsElement.appendChild(tag);
        });
    }
}

// Initialize the AI personality display when the game starts
document.addEventListener('DOMContentLoaded', () => {
    // Add Font Awesome for icons if not already included
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }

    // Wait for the chess game to initialize
    setTimeout(() => {
        if (window.chessGame) {
            window.aiDisplay = new AIPersonalityDisplay(window.chessGame);

            // Select initial opponent
            window.aiDisplay.generateNewOpponent();

            // Update display
            window.aiDisplay.updateDisplay();

            // Update display whenever AI personality changes
            const originalSelectPersonality = window.chessGame.selectAIPersonality;
            window.chessGame.selectAIPersonality = function () {
                const result = originalSelectPersonality.apply(this, arguments);
                if (window.aiDisplay) {
                    window.aiDisplay.updateDisplay();
                }
                return result;
            };

            // Hook into the new game button
            const newGameBtn = document.getElementById('new-game');
            if (newGameBtn) {
                // Store the original click handler
                const originalClickHandler = newGameBtn.onclick;

                // Replace with our new handler
                newGameBtn.onclick = function (e) {
                    // Generate new opponent first
                    if (window.aiDisplay) {
                        window.aiDisplay.generateNewOpponent();
                    }

                    // Then call the original handler after a short delay
                    setTimeout(() => {
                        if (typeof originalClickHandler === 'function') {
                            originalClickHandler.call(this, e);
                        } else if (window.chessGame && window.chessGame.setupBoard) {
                            // If no original handler, call setupBoard directly
                            window.chessGame.setupBoard();
                            window.chessGame.renderBoard();
                            window.chessGame.updateGameStatus();
                            window.chessGame.updateScoreDisplay();
                            window.chessGame.updateMoveHistory();

                            // Force a final update of the profile display
                            if (window.aiDisplay) {
                                window.aiDisplay.updateDisplay();
                            }
                        }
                    }, 600); // Longer delay to ensure profile animation completes
                };
            }

            // Hook into the difficulty selector
            const difficultySelect = document.getElementById('difficulty');
            if (difficultySelect) {
                difficultySelect.addEventListener('change', function () {
                    if (window.chessGame && window.aiDisplay) {
                        const newLevel = parseInt(this.value);
                        window.chessGame.aiLevel = newLevel;
                        window.chessGame.updateSkillDescription();

                        // Select an opponent matching this level
                        const levelOpponent = window.aiDisplay.selectOpponentByLevel(newLevel);

                        // Show loading indicator
                        window.aiDisplay.showLoadingIndicator();

                        // Add animation class for transition
                        const profilePanel = document.querySelector('.ai-profile-panel');
                        if (profilePanel) {
                            profilePanel.classList.add('changing');
                        }

                        // Update the opponent after a short delay (during animation)
                        setTimeout(() => {
                            // Store as current opponent
                            window.aiDisplay.currentOpponent = levelOpponent;

                            // Apply the opponent's personality to the chess game
                            if (window.chessGame.setPreferredPersonality) {
                                window.chessGame.setPreferredPersonality(levelOpponent.personality);
                            } else {
                                window.chessGame.aiPersonality = window.chessGame.aiPersonalities[levelOpponent.personality];
                                // Initialize opening repertoire based on new personality
                                if (window.chessGame.initializeOpeningRepertoire) {
                                    window.chessGame.initializeOpeningRepertoire();
                                }
                            }

                            // Update the profile display
                            window.aiDisplay.updateOpponentProfile(levelOpponent);

                            // Remove animation class after content is updated
                            setTimeout(() => {
                                if (profilePanel) {
                                    profilePanel.classList.remove('changing');
                                }
                            }, 50);

                            // Hide loading indicator
                            window.aiDisplay.hideLoadingIndicator();

                            // Show notification about new opponent
                            window.aiDisplay.showNewOpponentNotification(levelOpponent);
                        }, 300);
                    }
                });
            }
        }
    }, 500);
});
