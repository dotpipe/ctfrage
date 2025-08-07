<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple validation
if (!isset($_GET['game_id']) || !isset($_GET['player_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

$gameId = $_GET['game_id'];
$playerId = $_GET['player_id'];

// Load current matches
$matchesFile = '../data/matches_data.json';

if (!file_exists($matchesFile)) {
    echo json_encode(['success' => false, 'message' => 'Game not found']);
    exit;
}

$matchesData = file_get_contents($matchesFile);
$matches = json_decode($matchesData, true) ?: [];

// Check if game exists
if (!isset($matches[$gameId])) {
    echo json_encode(['success' => false, 'message' => 'Game not found']);
    exit;
}

$match = $matches[$gameId];

// Check if player is in this game
if ($match['white'] !== $playerId && $match['black'] !== $playerId) {
    echo json_encode(['success' => false, 'message' => 'Player not in this game']);
    exit;
}

// Get opponent's moves
$opponentId = ($match['white'] === $playerId) ? $match['black'] : $match['white'];
$opponentMoves = [];

if (isset($match['moves']) && is_array($match['moves'])) {
    foreach ($match['moves'] as $moveData) {
        if ($moveData['player_id'] === $opponentId) {
            $opponentMoves[] = $moveData;
        }
    }
}

// Add debug info
$debug = [
    'player_id' => $playerId,
    'player_color' => ($match['white'] === $playerId) ? 'white' : 'black',
    'opponent_id' => $opponentId,
    'opponent_color' => ($match['white'] === $opponentId) ? 'white' : 'black',
    'total_moves' => isset($match['moves']) ? count($match['moves']) : 0,
    'opponent_moves' => count($opponentMoves)
];

echo json_encode([
    'success' => true,
    'moves' => $opponentMoves,
    'debug' => $debug
]);
