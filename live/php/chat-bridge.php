<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Create data directory if it doesn't exist
$dataDir = '../data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}

// Handle different operations
$operation = isset($_GET['op']) ? $_GET['op'] : '';

// Chat file path
$gameId = isset($_GET['game_id']) ? $_GET['game_id'] : (isset($_POST['game_id']) ? $_POST['game_id'] : '');
if (empty($gameId)) {
    echo json_encode(['success' => false, 'message' => 'Game ID is required']);
    exit;
}

$chatFile = "{$dataDir}/chat_{$gameId}.json";

switch ($operation) {
    case 'send':
        // Send a message
        $playerId = isset($_POST['player_id']) ? $_POST['player_id'] : '';
        $message = isset($_POST['message']) ? $_POST['message'] : '';
        
        if (empty($playerId) || empty($message)) {
            echo json_encode(['success' => false, 'message' => 'Player ID and message are required']);
            exit;
        }
        
        // Load existing messages
        $messages = [];
        if (file_exists($chatFile)) {
            $content = file_get_contents($chatFile);
            $messages = json_decode($content, true) ?: [];
        }
        
        // Add new message
        $messages[] = [
            'player_id' => $playerId,
            'message' => $message,
            'timestamp' => time()
        ];
        
        // Save messages
        file_put_contents($chatFile, json_encode($messages));
        
        echo json_encode(['success' => true]);
        break;
        
    case 'get':
        // Get messages
        $playerId = isset($_GET['player_id']) ? $_GET['player_id'] : '';
        $since = isset($_GET['since']) ? intval($_GET['since']) : 0;
        
        if (empty($playerId)) {
            echo json_encode(['success' => false, 'message' => 'Player ID is required']);
            exit;
        }
        
        // Load messages
        $messages = [];
        if (file_exists($chatFile)) {
            $content = file_get_contents($chatFile);
            $allMessages = json_decode($content, true) ?: [];
            
            // Filter messages: only return messages from other players that are newer than 'since'
            foreach ($allMessages as $msg) {
                if ($msg['player_id'] !== $playerId && $msg['timestamp'] > $since) {
                    $messages[] = $msg;
                }
            }
        }
        
        echo json_encode(['success' => true, 'messages' => $messages]);
        break;
        
    case 'debug':
        // Debug: get all messages
        if (file_exists($chatFile)) {
            $content = file_get_contents($chatFile);
            $messages = json_decode($content, true) ?: [];
            echo json_encode(['success' => true, 'messages' => $messages]);
        } else {
            echo json_encode(['success' => true, 'messages' => []]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid operation']);
}
