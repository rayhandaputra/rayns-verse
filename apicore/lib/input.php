<?php

function getInput(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $json = json_decode(file_get_contents('php://input'), true);
        return is_array($json) ? $json : [];
    }

    if (stripos($contentType, 'multipart/form-data') !== false) {
        return $_POST;
    }

    return $_REQUEST;
}
