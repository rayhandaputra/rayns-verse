<?php

$config = require __DIR__ . '/index.php';

$db = $config['DB'];

try {
    $pdo = new PDO(
        "mysql:host={$db['host']};dbname={$db['name']};charset={$db['charset']}",
        $db['user'],
        $db['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'DB connection failed',
        'details' => $e->getMessage()
    ]);
    exit;
}
