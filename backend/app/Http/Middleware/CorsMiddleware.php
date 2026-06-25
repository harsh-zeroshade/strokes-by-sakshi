<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Handle preflight OPTIONS request FIRST
        if ($request->getMethod() === 'OPTIONS') {
            $response = new Response('', 200);
            return $this->addCorsHeaders($request, $response);
        }

        // Process the request
        $response = $next($request);

        // Add CORS headers to the response
        return $this->addCorsHeaders($request, $response);
    }

    private function addCorsHeaders(Request $request, Response $response): Response
    {
        $origin = $request->headers->get('Origin');
        
        // List of allowed origins
        $allowedOrigins = [
            'https://strokes-by-sakshi.netlify.app',
            'https://strokes-by-sakshi.zya.me',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];

        // Check if origin is allowed
        if (in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        } elseif (empty($origin)) {
            $response->headers->set('Access-Control-Allow-Origin', '*');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Session-ID, Origin');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Expose-Headers', 'X-Session-ID');
        $response->headers->set('Access-Control-Max-Age', '86400');
        
        if ($origin) {
            $response->headers->set('Vary', 'Origin');
        }

        return $response;
    }
}
