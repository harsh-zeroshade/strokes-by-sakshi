<?php
// Debug CORS headers
header('Content-Type: application/json');

$response = [
    'cors_headers_sent' => headers_sent(),
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
    'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'not set',
    'all_headers' => getallheaders(),
];

// Send test CORS headers
header('Access-Control-Allow-Origin: https://strokes-by-sakshi.netlify.app');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

echo json_encode($response, JSON_PRETTY_PRINT);