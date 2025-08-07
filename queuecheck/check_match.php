<?php
header('Content-Type: application/json');

// Simple validation
if (!isset($_GET['player_id']) || empty($_GET['player_id'])) {
    echo json_encode(['matched' => false, 'message' => 'Player ID is required']);
    exit;
}

$playerId = $_GET['player_id'];

// Load current matches
$matchesFile = 'matches_data.json';
$matches = [];

if (file_exists($matchesFile)) {
    $matchesData = file_get_contents($matchesFile);
    $matches = json_decode($matchesData, true) ?: [];
}

// Check if player is in a match
foreach ($matches as $gameId => $match) {
    if ($match['white'] === $playerId || $match['black'] === $playerId) {
        $opponentId = ($match['white'] === $playerId) ? $match['black'] : $match['white'];
        $color = ($match['white'] === $playerId) ? 'white' : 'black';
        
        echo json_encode([
            'matched' => true,
            'game_id' => $gameId,
            'opponent_id' => $opponentId,
            'color' => $color
        ]);
        exit;
    }
}

// If we're here, also try to create a match
$queueFile = 'queue_data.json';

if (file_exists($queueFile)) {
    $queueData = file_get_contents($queueFile);
    $queue = json_decode($queueData, true) ?: [];
    
    // Check if player is in queue
    if (isset($queue[$playerId])) {
        // Find another player in queue
        foreach ($queue as $otherPlayerId => $playerData) {
            if ($otherPlayerId !== $playerId) {
                // Create a match!
                $gameId = 'game_' . time() . '_' . substr(md5(rand()), 0, 6);
                
                // Randomly assign colors
                $isWhite = (rand(0, 1) === 1);
                
                $matches[$gameId] = [
                    'white' => $isWhite ? $playerId : $otherPlayerId,
                    'black' => $isWhite ? $otherPlayerId : $playerId,
                    'created_at' => time(),
                    'status' => 'active'
                ];
                
                // Save match data
                file_put_contents($matchesFile, json_encode($matches));
                
                // Remove both players from queue
                unset($queue[$playerId]);
                unset($queue[$otherPlayerId]);
                file_put_contents($queueFile, json_encode($queue));
                
                // Return match info
                echo json_encode([
                    'matched' => true,
                    'game_id' => $gameId,
                    'opponent_id' => $otherPlayerId,
                    'color' => $isWhite ? 'white' : 'black'
                ]);
                exit;
            }
        }
    }
}

// No match found
echo json_encode(['matched' => false]);
