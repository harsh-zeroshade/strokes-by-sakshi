<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // IMPORTANT:
        // Use the actual Origin for credentialed requests.
        // '*' with Allow-Credentials=true will be rejected by browsers.
        $origin = $request->headers->get('Origin');
        if (!empty($origin)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Vary', 'Origin');
        } else {
            $response->headers->set('Access-Control-Allow-Origin', '*');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Session-ID');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Expose-Headers', 'X-Session-ID');

        // Always answer preflight.
        if ($request->getMethod() === 'OPTIONS') {
            return response()->json([], 200, $response->headers->all());
        }

        return $response;
    }
}