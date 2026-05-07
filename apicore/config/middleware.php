<?php
$config = require __DIR__ . '/index.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Authorization, Content-Type, x-auth-role, x-auth-token, x-api-key");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

if ("Bearer {$config['API_KEY']}" !== $authHeader) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
