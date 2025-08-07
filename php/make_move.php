<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple validation
if (!isset($_POST['game_id']) || !isset($_POST['player_id']) || !isset($_POST['move'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

$gameId = $_POST['game_id'];
$playerId = $_POST['player_id'];
$move = $_POST['move'];

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

// Check if it's the player's turn
$playerColor = ($match['white'] === $playerId) ? 'white' : 'black';
$lastMove = null;

if (isset($match['moves']) && count($match['moves']) > 0) {
    $lastMove = $match['moves'][count($match['moves']) - 1];
}

$isPlayerTurn = true;
if ($lastMove) {
    $lastMovePlayerId = $lastMove['player_id'];
    $isPlayerTurn = ($lastMovePlayerId !== $playerId);
}

// If it's white's first move, check that the player is white
if (!$lastMove && $playerColor !== 'white') {
    $isPlayerTurn = false;
}

if (!$isPlayerTurn) {
    echo json_encode(['success' => false, 'message' => 'Not your turn']);
    exit;
}

// Add move to the game
$moveData = [
    'move' => $move,
    'player_id' => $playerId,
    'timestamp' => time()
];

if (!isset($matches[$gameId]['moves'])) {
    $matches[$gameId]['moves'] = [];
}

$matches[$gameId]['moves'][] = $moveData;

// Save updated match data
file_put_contents($matchesFile, json_encode($matches));

echo json_encode([
    'success' => true,
    'move_number' => count($matches[$gameId]['moves'])
]);
