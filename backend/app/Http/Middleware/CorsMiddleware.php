<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // IMPORTANT:
        // Use the actual Origin for credentialed requests.
        // '*' with Allow-Credentials=true will be rejected by browsers.
        $origin = $request->headers->get('Origin');

        $headers = [
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-Session-ID',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Expose-Headers' => 'X-Session-ID',
        ];

        if (!empty($origin)) {
            $headers['Access-Control-Allow-Origin'] = $origin;
            $headers['Vary'] = 'Origin';
        } else {
            $headers['Access-Control-Allow-Origin'] = '*';
        }

        // Handle preflight immediately so upstream/server doesn't short-circuit
        // before we can attach CORS headers.
        if ($request->getMethod() === 'OPTIONS') {
            return response()->json([], 200, $headers);
        }

        $response = $next($request);

        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }

}