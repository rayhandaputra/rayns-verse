<?php

function clean($value) { 
    return preg_replace('/[^a-zA-Z0-9_]/', '', $value);
}

function cleanColumns(array $cols) {
    if (empty($cols)) return ['*'];
    return array_map(fn($c) => clean($c), $cols);
}

function sendTelegram(string $message): void {
    $url = "https://api.telegram.org/bot5956888143:AAEtWhLDbdtc7U6LRTOY-m_ZyrvN6Poof0A/sendMessage";
    $payload = [
        'chat_id' => "-850044576", 
        'text' => "🚀 *API Core Alert*\n\n" . $message, 
        'parse_mode' => "Markdown"
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}

function logError(Throwable $e): void {
    $message = "❌ *Error Occurred*\n";
    $message .= "*Message:* " . $e->getMessage() . "\n";
    $message .= "*File:* " . $e->getFile() . "\n";
    $message .= "*Line:* " . $e->getLine() . "\n";
    $message .= "*Path:* " . $_SERVER['REQUEST_URI'];
    
    sendTelegram($message);
}

