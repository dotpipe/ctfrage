<?php
header('Content-Type: application/json');

// Simple validation
if (!isset($_POST['player_id']) || empty($_POST['player_id'])) {
    echo json_encode(['success' => false, 'message' => 'Player ID is required']);
    exit;
}

$playerId = $_POST['player_id'];

// Load current queue
$queueFile = 'queue_data.json';
$queue = [];

if (file_exists($queueFile)) {
    $queueData = file_get_contents($queueFile);
    $queue = json_decode($queueData, true) ?: [];
}

// Add player to queue with timestamp
$queue[$playerId] = [
    'joined_at' => time(),
    'status' => 'waiting'
];

// Save updated queue
file_put_contents($queueFile, json_encode($queue));

echo json_encode(['success' => true]);
