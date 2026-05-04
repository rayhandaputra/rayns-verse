<?php

/**
 * Standardized Response Function
 * Format: { status: 200, error_message: null, data: { ... } }
 */
function respond($data, int $code = 200, ?string $errorMessage = null): void {
    if (ob_get_length()) ob_clean();

    header('Content-Type: application/json; charset=utf-8');
    http_response_code($code);

    $response = [
        'status' => $code,
        'error_message' => $errorMessage,
        'data' => $data
    ];

    echo json_encode($response);
    exit;
}

/**
 * Standardized List Response Function
 */
function respondList(array $items, int $totalItems, int $currentPage, int $size, int $code = 200): void {
    $totalPages = $size > 0 ? ceil($totalItems / $size) : 0;
    
    $data = [
        'total_items' => $totalItems,
        'items' => $items,
        'total_pages' => (int)$totalPages,
        'current_page' => $currentPage
    ];

    respond($data, $code);
}
