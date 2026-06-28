<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent MIME sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Block clickjacking
        $response->headers->set('X-Frame-Options', 'DENY');

        // Control referrer info
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Disable browser features not needed
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');

        // Disable legacy XSS filter (modern browsers use CSP instead)
        $response->headers->set('X-XSS-Protection', '0');

        // Content Security Policy — tight for API responses
        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'none'; frame-ancestors 'none';"
        );

        // HSTS — only over HTTPS
        if ($request->secure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // Remove server fingerprint headers
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        // Prevent caching of sensitive API responses
        if (str_starts_with($request->path(), 'api/')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
        }

        return $response;
    }
}
