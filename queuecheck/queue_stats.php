<?php
header('Content-Type: application/json');

// Load current queue
$queueFile = 'queue_data.json';
$queue = [];

if (file_exists($queueFile)) {
    $queueData = file_get_contents($queueFile);
    $queue = json_decode($queueData, true) ?: [];
}

echo json_encode([
    'count' => count($queue),
    'timestamp' => time()
]);
