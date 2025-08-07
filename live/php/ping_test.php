<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'success' => true,
    'timestamp' => time(),
    'message' => 'Server is responding correctly'
]);
