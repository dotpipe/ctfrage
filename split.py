import json
import os
import math
from collections import defaultdict

def load_chess_knowledge(file_path):
    """Load the chess knowledge JSON file exported by OptimizedChessARN"""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        print(f"Successfully loaded knowledge file with {count_moves(data['moveTree']['root'])} total moves")
        return data
    except Exception as e:
        print(f"Error loading knowledge file: {e}")
        return None

def count_moves(node):
    """Count the total number of moves in a node and its children"""
    count = len(node.get('moves', {}))
    for move in node.get('moves', {}).values():
        count += count_moves(move)
    return count

def parse_fen_from_position(position):
    """Extract piece positions from a FEN string or position representation"""
    # If position is a full FEN, extract just the piece placement part
    if isinstance(position, str) and ' ' in position:
        position = position.split(' ')[0]
    return position

def count_pieces(fen):
    """Count pieces in a FEN position"""
    if not fen or not isinstance(fen, str):
        return {'P': 0, 'N': 0, 'B': 0, 'R': 0, 'Q': 0, 'K': 0, 
                'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0, 'k': 0}
    
    piece_counts = {'P': 0, 'N': 0, 'B': 0, 'R': 0, 'Q': 0, 'K': 0, 
                   'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0, 'k': 0}
    
    for char in fen:
        if char in piece_counts:
            piece_counts[char] += 1
    
    return piece_counts

def determine_game_phase(piece_counts):
    """Determine game phase based on piece counts"""
    # Calculate material value (excluding kings)
    white_material = (piece_counts['P'] * 1 + 
                     piece_counts['N'] * 3 + 
                     piece_counts['B'] * 3 + 
                     piece_counts['R'] * 5 + 
                     piece_counts['Q'] * 9)
    
    black_material = (piece_counts['p'] * 1 + 
                     piece_counts['n'] * 3 + 
                     piece_counts['b'] * 3 + 
                     piece_counts['r'] * 5 + 
                     piece_counts['q'] * 9)
    
    total_material = white_material + black_material
    
    # Count total pieces (excluding pawns)
    total_pieces = (piece_counts['N'] + piece_counts['B'] + piece_counts['R'] + piece_counts['Q'] +
                   piece_counts['n'] + piece_counts['b'] + piece_counts['r'] + piece_counts['q'])
    
    # Determine phase
    if total_pieces >= 12 and piece_counts['Q'] >= 1 and piece_counts['q'] >= 1:
        return "opening", 0.0  # Early game
    elif total_material >= 30:
        return "opening", min(1.0, (40 - total_material) / 10)  # Late opening
    elif total_material >= 20:
        return "middlegame", (30 - total_material) / 10  # Middlegame
    elif total_material >= 10:
        return "endgame", (20 - total_material) / 10  # Early endgame
    else:
        return "endgame", 1.0  # Late endgame

def calculate_position_complexity(piece_counts, fen=None):
    """Calculate position complexity based on piece configuration"""
    # Base complexity on number of pieces and their interactions
    minor_pieces = (piece_counts['N'] + piece_counts['B'] + 
                   piece_counts['n'] + piece_counts['b'])
    
    major_pieces = (piece_counts['R'] + piece_counts['Q'] + 
                   piece_counts['r'] + piece_counts['q'])
    
    pawns = piece_counts['P'] + piece_counts['p']
    
    # More pieces generally means more complex positions
    piece_complexity = (minor_pieces * 0.7 + major_pieces * 1.2 + pawns * 0.4) / 20
    
    # Imbalanced material often creates more complex positions
    white_material = (piece_counts['P'] * 1 + piece_counts['N'] * 3 + 
                     piece_counts['B'] * 3 + piece_counts['R'] * 5 + 
                     piece_counts['Q'] * 9)
    
    black_material = (piece_counts['p'] * 1 + piece_counts['n'] * 3 + 
                     piece_counts['b'] * 3 + piece_counts['r'] * 5 + 
                     piece_counts['q'] * 9)
    
    material_imbalance = abs(white_material - black_material) / 32  # Normalize
    
    # Positions with queens are generally more complex
    queen_factor = 0.2 if (piece_counts['Q'] > 0 or piece_counts['q'] > 0) else 0
    
    # Combine factors
    complexity = (piece_complexity * 0.6 + 
                 (1 - material_imbalance) * 0.2 +  # Less imbalance can mean more complex
                 queen_factor)
    
    return min(1.0, complexity)

def extract_position_from_path(node, path):
    """Try to extract position information by following a path through the tree"""
    current_node = node
    position_info = None
    
    # Try to find position data by traversing the path
    for move in path:
        if move in current_node.get('moves', {}):
            current_node = current_node['moves'][move]
            # Check if this node has position information
            if 'position' in current_node:
                position_info = current_node['position']
            elif 'stats' in current_node and 'position' in current_node['stats']:
                position_info = current_node['stats']['position']
    
    return position_info

def analyze_move_difficulty(node, current_depth=0, path=None, position=None, move_sequence=None):
    """Analyze moves and assign difficulty ratings based on various factors including position"""
    if path is None:
        path = []
    if move_sequence is None:
        move_sequence = []
    
    moves_with_difficulty = []
    
    # Try to determine position from node data
    position_info = position
    if not position_info:
        if 'position' in node:
            position_info = node['position']
        elif 'stats' in node and 'position' in node['stats']:
            position_info = node['stats']['position']
    
    # Parse FEN if available
    fen = parse_fen_from_position(position_info) if position_info else None
    piece_counts = count_pieces(fen) if fen else None
    
    # Determine game phase and position complexity if we have piece information
    game_phase = ("unknown", 0.5)
    position_complexity = 0.5
    if piece_counts:
        game_phase = determine_game_phase(piece_counts)
        position_complexity = calculate_position_complexity(piece_counts, fen)
    
    for move_notation, move_data in node.get('moves', {}).items():
        stats = move_data.get('stats', {})
        
        # Try to get position after this move
        next_position = None
        if 'position' in move_data:
            next_position = move_data['position']
        elif 'stats' in move_data and 'position' in move_data['stats']:
            next_position = move_data['stats']['position']
        
        # Calculate difficulty based on multiple factors
        difficulty_score = calculate_difficulty_score(
            rating=stats.get('rating', 1200),
            times_played=stats.get('timesPlayed', 0),
            win_rate=calculate_win_rate(stats),
            depth=current_depth,
            has_children=bool(move_data.get('moves', {})),
            game_phase=game_phase,
            position_complexity=position_complexity,
            move_sequence=move_sequence + [move_notation],
            is_capture='capture' in stats.get('type', '').lower() if 'type' in stats else False,
            is_check='check' in stats.get('type', '').lower() if 'type' in stats else False
        )
        
        # Store move with its difficulty score and metadata
        moves_with_difficulty.append({
            'move': move_notation,
            'path': path.copy(),
            'difficulty': difficulty_score,
            'rating': stats.get('rating', 1200),
            'times_played': stats.get('timesPlayed', 0),
            'win_rate': calculate_win_rate(stats),
            'depth': current_depth,
            'game_phase': game_phase[0],
            'phase_progress': game_phase[1],
            'position_complexity': position_complexity,
            'move_data': move_data,
            'move_sequence': move_sequence + [move_notation]
        })
        
        # Recursively analyze child moves
        child_path = path.copy()
        child_path.append(move_notation)
        child_sequence = move_sequence + [move_notation]
        moves_with_difficulty.extend(
            analyze_move_difficulty(
                move_data, 
                current_depth + 1, 
                child_path, 
                next_position,
                child_sequence
            )
        )
    
    return moves_with_difficulty

def calculate_win_rate(stats):
    """Calculate win rate from move statistics"""
    wins = stats.get('wins', 0)
    losses = stats.get('losses', 0)
    draws = stats.get('draws', 0)
    total = wins + losses + draws
    
    if total == 0:
        return 0.5  # Default win rate
    
    return (wins + (draws * 0.5)) / total

def is_tactical_move(move_notation, move_data):
    """Determine if a move is tactical (capture, check, etc.)"""
    # Check if we have explicit information
    stats = move_data.get('stats', {})
    if 'type' in stats:
        move_type = stats['type'].lower()
        return 'capture' in move_type or 'check' in move_type or 'mate' in move_type
    
    # Try to infer from notation
    if 'x' in move_notation or '+' in move_notation or '#' in move_notation:
        return True
    
    return False

def is_opening_theory(move_sequence, depth):
    """Determine if a move is likely part of opening theory"""
    # Simple heuristic: early moves are more likely to be opening theory
    if depth <= 10:
        return True, max(0, 1.0 - (depth / 10))
    return False, 0.0

def calculate_difficulty_score(rating, times_played, win_rate, depth, has_children, 
                              game_phase, position_complexity, move_sequence, 
                              is_capture=False, is_check=False):
    """Calculate a difficulty score based on multiple factors including position and game phase"""
    # Base difficulty from rating
    difficulty = (rating - 800) / 2000  # Normalize ratings from ~800-2800
    
    # Phase-specific adjustments
    phase_name, phase_progress = game_phase
    if phase_name == "opening":
        # Opening theory knowledge is more important than calculation
        is_theory, theory_strength = is_opening_theory(move_sequence, depth)
        if is_theory:
            # Opening theory moves get adjusted based on their popularity and depth
            theory_factor = 0.7 + 0.3 * theory_strength
            difficulty = difficulty * theory_factor
            
            # Popular opening moves are easier for beginners
            if times_played > 10:
                difficulty *= 0.9
    
    elif phase_name == "middlegame":
        # Middlegame is often the most complex phase
        difficulty *= 1.1
        
        # Tactical moves in middlegame can be very complex
        if is_capture or is_check:
            difficulty *= 1.15
    
    elif phase_name == "endgame":
        # Endgames require specific knowledge
        if phase_progress > 0.7:  # Late endgame
            # Basic endgames are easier, but technical endgames are hard
            piece_count = sum(1 for c in move_sequence[-1] if c.isalpha())
            if piece_count <= 3:  # Few pieces left
                difficulty *= 0.9 + position_complexity * 0.5
            else:
                difficulty *= 1.2  # Complex endgames are hard
    
    # Adjust for position complexity
    difficulty *= (0.7 + 0.6 * position_complexity)
    
    # Adjust for depth (deeper moves are more complex)
    depth_factor = 1.0 + (depth * 0.03)
    difficulty *= depth_factor
    
    # Adjust for frequency (less played moves might be more specialized/difficult)
    if times_played > 0:
        frequency_factor = 1.0 - (0.2 / (1 + 0.05 * times_played))
        difficulty *= frequency_factor
    
    # Adjust for win rate (moves with balanced win rates are more complex)
    win_rate_complexity = 1.0 - abs(win_rate - 0.5) * 0.4
    difficulty *= (0.8 + 0.2 * win_rate_complexity)
    
    # Bonus for moves that have follow-ups
    if has_children:
        difficulty *= 1.05
    
    # Tactical moves adjustment
    if is_capture or is_check:
        # Captures and checks can be easier to spot but harder to calculate
        calculation_factor = 1.1 if depth > 2 else 0.95
        difficulty *= calculation_factor
    
    return max(0.0, min(1.0, difficulty))  # Clamp between 0 and 1

def categorize_moves_by_difficulty(moves_with_difficulty, num_levels=8):
    """Split moves into difficulty levels with more sophisticated distribution"""
    # Sort moves by difficulty
    sorted_moves = sorted(moves_with_difficulty, key=lambda x: x['difficulty'])
    total_moves = len(sorted_moves)
    
    if total_moves == 0:
        return [[] for _ in range(num_levels)]
    
    # Create difficulty levels with non-linear distribution
    # This gives more moves to intermediate levels and fewer to extreme levels
    difficulty_levels = [[] for _ in range(num_levels)]
    
    # Define distribution percentages for each level (should sum to 100)
    level_percentages = [5, 10, 15, 20, 20, 15, 10, 5]
    
    start_idx = 0
    for level, percentage in enumerate(level_percentages):
        moves_in_level = int((percentage / 100) * total_moves)
        end_idx = start_idx + moves_in_level
        
        # Ensure we don't exceed array bounds
        end_idx = min(end_idx, total_moves)
        
        difficulty_levels[level] = sorted_moves[start_idx:end_idx]
        start_idx = end_idx
    
    # Assign any remaining moves to the last level
    if start_idx < total_moves:
        difficulty_levels[-1].extend(sorted_moves[start_idx:])
    
    return difficulty_levels

def create_level_knowledge_tree(level_moves):
    """Create a knowledge tree containing only moves from a specific level"""
    root = {'moves': {}, 'stats': {'timesVisited': 0, 'firstSeen': 0}}
    
    for move_info in level_moves:
        path = move_info['path']
        move = move_info['move']
        move_data = move_info['move_data']
        
        # Navigate to the correct position in the tree
        current_node = root
        for path_move in path:
            if path_move not in current_node['moves']:
                current_node['moves'][path_move] = {'moves': {}, 'stats': {'timesVisited': 0}}
            current_node = current_node['moves'][path_move]
        
        # Add the move to this position
        current_node['moves'][move] = move_data
    
    return root

def save_difficulty_levels(difficulty_levels, original_data, output_dir):
    """Save each difficulty level as a separate JSON file with enhanced metadata"""
    level_names = [
        "Beginner",
        "Novice",
        "Intermediate",
        "Advanced",
        "Expert",
        "Master",
        "Grandmaster",
        "World_Champion"
    ]
    
    # Approximate ELO ranges for each level
    elo_ranges = [
        (800, 1000),    # Beginner
        (1000, 1200),   # Novice
        (1200, 1400),   # Intermediate
        (1400, 1600),   # Advanced
        (1600, 1900),   # Expert
        (1900, 2200),   # Master
        (2200, 2500),   # Grandmaster
        (2500, 2800)    # World Champion
    ]
    
    os.makedirs(output_dir, exist_ok=True)
    
    for i, (level_name, level_moves) in enumerate(zip(level_names, difficulty_levels)):
        if not level_moves:
            print(f"Warning: No moves for {level_name} level. Skipping.")
            continue
            
        # Create a new knowledge tree with only moves from this level
        level_tree = create_level_knowledge_tree(level_moves)
        
        # Calculate phase distribution
        phase_counts = {
            "opening": 0,
            "middlegame": 0,
            "endgame": 0,
            "unknown": 0
        }
        
        for move in level_moves:
            phase = move.get('game_phase', 'unknown')
            phase_counts[phase] += 1
        
        total_phase_moves = sum(phase_counts.values())
        phase_distribution = {
            phase: count / total_phase_moves if total_phase_moves > 0 else 0
            for phase, count in phase_counts.items()
        }
        
        # Calculate average complexity
        avg_complexity = sum(m.get('position_complexity', 0.5) for m in level_moves) / len(level_moves)
        
        # Create output data structure with enhanced metadata
        output_data = {
            'version': original_data.get('version', '2.0'),
            'timestamp': original_data.get('timestamp', 0),
            'moveTree': {'root': level_tree},
            'stats': {
                'whiteWins': 0,
                'blackWins': 0,
                'draws': 0,
                'discoveries': [],
                'uniqueMoves': len(level_moves),
                'uniquePositions': 0,
                'explorationMilestones': []
            },
            'difficulty_level': {
                'name': level_name,
                'level': i + 1,
                'move_count': len(level_moves),
                'average_rating': sum(m['rating'] for m in level_moves) / len(level_moves),
                'min_difficulty': min(m['difficulty'] for m in level_moves),
                'max_difficulty': max(m['difficulty'] for m in level_moves),
                'approximate_elo_range': elo_ranges[i],
                'phase_distribution': phase_distribution,
                'average_complexity': avg_complexity,
                'description': get_level_description(level_name, elo_ranges[i])
            }
        }
        
        # Save to file
        output_file = os.path.join(output_dir, f"chess_knowledge_level_{i+1}_{level_name}.json")
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"Saved {level_name} level with {len(level_moves)} moves to {output_file}")
        print(f"  - ELO range: {elo_ranges[i][0]}-{elo_ranges[i][1]}")
        print(f"  - Phase distribution: {', '.join(f'{k}: {v:.1%}' for k, v in phase_distribution.items() if v > 0)}")
        print(f"  - Average complexity: {avg_complexity:.2f}")

def get_level_description(level_name, elo_range):
    """Generate a description for each difficulty level"""
    descriptions = {
        "Beginner": f"Basic chess moves and simple tactics for players rated {elo_range[0]}-{elo_range[1]}. "
                   "Focuses on avoiding blunders and understanding piece movement.",
        
        "Novice": f"Fundamental principles and common patterns for players rated {elo_range[0]}-{elo_range[1]}. "
                 "Introduces basic opening principles and simple tactical motifs.",
        
        "Intermediate": f"Standard tactics and positional concepts for players rated {elo_range[0]}-{elo_range[1]}. "
                       "Includes common opening lines and basic endgame techniques.",
        
        "Advanced": f"More sophisticated tactical and strategic ideas for players rated {elo_range[0]}-{elo_range[1]}. "
                   "Features deeper opening preparation and more complex middlegame positions.",
        
        "Expert": f"Advanced positional understanding and calculation for players rated {elo_range[0]}-{elo_range[1]}. "
                 "Includes complex sacrifices and long-term strategic planning.",
        
        "Master": f"Master-level concepts and deep calculation for players rated {elo_range[0]}-{elo_range[1]}. "
                 "Features sophisticated opening theory and technical endgame precision.",
        
        "Grandmaster": f"Grandmaster-level strategy and subtle positional nuances for players rated {elo_range[0]}-{elo_range[1]}. "
                      "Includes critical theoretical variations and complex evaluations.",
        
        "World_Champion": f"Elite chess understanding at the highest level for players rated {elo_range[0]}-{elo_range[1]}. "
                         "Features cutting-edge theory and profound strategic concepts used by world champions."
    }
    
    return descriptions.get(level_name, f"Chess knowledge for {level_name} level players.")

def analyze_opening_moves(moves_with_difficulty):
    """Analyze opening moves to identify common openings"""
    opening_sequences = defaultdict(int)
    
    for move in moves_with_difficulty:
        if move.get('depth', 0) < 10 and move.get('game_phase') == 'opening':
            sequence = ' '.join(move.get('move_sequence', []))
            opening_sequences[sequence] += 1
    
    # Return the most common opening sequences
    return sorted(opening_sequences.items(), key=lambda x: x[1], reverse=True)[:20]

def save_to_local_storage(data, key):
    """Save data to browser's localStorage (simulation for Python)"""
    print(f"[Simulation] Saving data to localStorage with key: {key}")
    # In a real browser context, this would use localStorage.setItem(key, JSON.stringify(data))
    # For Python simulation, we'll just save to a file
    with open(f"{key}.json", 'w') as f:
        json.dump(data, f, indent=2)

def main():
    # Get input file from user
    input_file = input("Enter the path to the chess knowledge JSON file: ")
    
    # Load the knowledge
    chess_knowledge = load_chess_knowledge(input_file)
    if not chess_knowledge:
        print("Failed to load chess knowledge. Exiting.")
        return
    
    # Analyze move difficulty with enhanced position analysis
    print("Analyzing move difficulty with position and game phase analysis...")
    moves_with_difficulty = analyze_move_difficulty(chess_knowledge['moveTree']['root'])
    print(f"Analyzed {len(moves_with_difficulty)} moves")
    
    # Analyze opening moves
    print("Analyzing opening sequences...")
    common_openings = analyze_opening_moves(moves_with_difficulty)
    print(f"Found {len(common_openings)} common opening sequences")
    for i, (sequence, count) in enumerate(common_openings[:5]):
        print(f"  {i+1}. {sequence} (played {count} times)")
    
    # Categorize moves into difficulty levels
    print("Categorizing moves into difficulty levels...")
    difficulty_levels = categorize_moves_by_difficulty(moves_with_difficulty, num_levels=8)
    
    # Save each difficulty level
    output_dir = input("Enter output directory for difficulty levels (default: 'chess_levels'): ") or "chess_levels"
    save_difficulty_levels(difficulty_levels, chess_knowledge, output_dir)
    
    # Save summary information
    summary = {
        "total_moves": len(moves_with_difficulty),
        "level_counts": [len(level) for level in difficulty_levels],
        "common_openings": common_openings[:10],
        "timestamp": chess_knowledge.get('timestamp', 0),
        "version": chess_knowledge.get('version', '2.0')
    }
    
    summary_file = os.path.join(output_dir, "difficulty_summary.json")
    with open(summary_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"Successfully split chess knowledge into 8 difficulty levels in {output_dir}")
    print(f"Summary information saved to {summary_file}")

if __name__ == "__main__":
    main()
