<?php
require __DIR__ . '/config/middleware.php';
require __DIR__ . '/config/db.php';
require __DIR__ . '/lib/utils.php';
require __DIR__ . '/lib/input.php';
require __DIR__ . '/lib/response.php';

try {
    $routes = require __DIR__ . '/routes/index.php';

    $uri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $parts = explode('/', $uri);
    $endpoint = end($parts);
    $method = $_SERVER['REQUEST_METHOD'];

    if (!isset($routes[$method][$endpoint])) {
        respond(null, 404, 'Route not found');
    }

    [$controllerName, $methodName] = $routes[$method][$endpoint];
    $controllerFile = __DIR__ . "/controllers/{$controllerName}.php";

    if (!file_exists($controllerFile)) {
        respond(null, 500, "Controller {$controllerName} not found");
    }

    require_once $controllerFile;

    $controller = new $controllerName($pdo);
    $controller->$methodName(getInput());

} catch (Throwable $e) {
    // Log error to Telegram
    logError($e);

    // Standardized Error Response
    respond(null, 500, $e->getMessage());
}
