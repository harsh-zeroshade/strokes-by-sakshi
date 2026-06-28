<?php

namespace App\Support;

class MediaUrl
{
    /**
     * Normalize stored media URLs so production responses never point at localhost.
     */
    public static function normalize(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        if (str_contains($url, 'cloudinary.com') || str_contains($url, 'picsum.photos')) {
            return $url;
        }

        $appUrl = rtrim(config('app.url'), '/');

        if (str_starts_with($url, '/storage/')) {
            return $appUrl . $url;
        }

        if (preg_match('#^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?(/.*)?$#', $url, $matches)) {
            return $appUrl . ($matches[1] ?? '');
        }

        if (str_starts_with($url, 'storage/')) {
            return $appUrl . '/' . $url;
        }

        return $url;
    }
}
