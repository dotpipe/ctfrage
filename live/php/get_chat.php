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
$lastTimestamp = isset($_GET['last_timestamp']) ? intval($_GET['last_timestamp']) / 1000 : 0;

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

// Get opponent's chat messages that are newer than lastTimestamp
$opponentId = ($match['white'] === $playerId) ? $match['black'] : $match['white'];
$newMessages = [];

if (isset($match['chat']) && is_array($match['chat'])) {
    foreach ($match['chat'] as $chatMessage) {
        if ($chatMessage['player_id'] === $opponentId && $chatMessage['timestamp'] > $lastTimestamp) {
            $newMessages[] = $chatMessage;
        }
    }
}

echo json_encode([
    'success' => true,
    'messages' => $newMessages
]);
