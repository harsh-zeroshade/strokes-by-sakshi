<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    // CORS is handled by Laravel's built-in HandleCors middleware via config/cors.php
    // This middleware is kept only as a named alias but does nothing itself
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }
}
