<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple validation
if (!isset($_POST['game_id']) || !isset($_POST['player_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

$gameId = $_POST['game_id'];
$playerId = $_POST['player_id'];

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

// Update game status
$matches[$gameId]['status'] = 'ended';
$matches[$gameId]['result'] = ($match['white'] === $playerId) ? 'black_wins' : 'white_wins';
$matches[$gameId]['end_reason'] = 'resignation';
$matches[$gameId]['ended_at'] = time();

// Save updated match data
file_put_contents($matchesFile, json_encode($matches));

echo json_encode(['success' => true]);
