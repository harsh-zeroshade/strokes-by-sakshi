<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Strokes by Sakshi API',
        'version' => '1.0',
        'status' => 'running',
    ]);
});