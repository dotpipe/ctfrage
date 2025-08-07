<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple validation
if (!isset($_POST['game_id']) || !isset($_POST['player_id']) || !isset($_POST['message'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

$gameId = $_POST['game_id'];
$playerId = $_POST['player_id'];
$message = $_POST['message'];

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

// Add chat message to the game
$chatMessage = [
    'message' => $message,
    'player_id' => $playerId,
    'timestamp' => time()
];

if (!isset($matches[$gameId]['chat'])) {
    $matches[$gameId]['chat'] = [];
}

$matches[$gameId]['chat'][] = $chatMessage;

// Save updated match data
file_put_contents($matchesFile, json_encode($matches));

echo json_encode([
    'success' => true
]);
