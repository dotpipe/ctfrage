<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple validation
if (!isset($_POST['player_id']) || empty($_POST['player_id'])) {
    echo json_encode(['success' => false, 'message' => 'Player ID is required']);
    exit;
}

$playerId = $_POST['player_id'];

// Load current queue
$queueFile = '../data/queue_data.json';

if (file_exists($queueFile)) {
    $queueData = file_get_contents($queueFile);
    $queue = json_decode($queueData, true) ?: [];
    
    // Remove player from queue
    if (isset($queue[$playerId])) {
        unset($queue[$playerId]);
        file_put_contents($queueFile, json_encode($queue));
    }
}

echo json_encode(['success' => true]);
