<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class CloudinaryService
{
    private string $cloudName;
    private string $apiKey;
    private string $apiSecret;

    public function __construct()
    {
        $this->cloudName = env('CLOUDINARY_CLOUD_NAME', 'ddeakoucl');
        $this->apiKey    = env('CLOUDINARY_API_KEY', '225348543345839');
        $this->apiSecret = env('CLOUDINARY_API_SECRET', 'R5Jd-EuIqpohSp_ciOgIOjyIyEU');
    }

    /**
     * Upload a file to Cloudinary and return the secure URL.
     * Signature is generated per Cloudinary docs:
     * https://cloudinary.com/documentation/authentication#generating_signatures
     */
    public function upload(UploadedFile $file, string $folder = 'strokes-by-sakshi'): string
    {
        $timestamp = time();

        // Parameters must be sorted alphabetically before signing
        $params = [
            'folder'    => $folder,
            'timestamp' => $timestamp,
        ];
        ksort($params);

        // Build signature string: key=value&key=value + secret
        $sigString = '';
        foreach ($params as $k => $v) {
            $sigString .= ($sigString ? '&' : '') . "{$k}={$v}";
        }
        $signature = sha1($sigString . $this->apiSecret);

        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/upload";

        $postFields = [
            'file'      => new \CURLFile(
                $file->getRealPath(),
                $file->getMimeType() ?: 'image/jpeg',
                $file->getClientOriginalName() ?: 'upload.jpg'
            ),
            'api_key'   => $this->apiKey,
            'timestamp' => $timestamp,
            'folder'    => $folder,
            'signature' => $signature,
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $postFields,
            CURLOPT_TIMEOUT        => 60,
        ]);

        $response = curl_exec($ch);
        $error    = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            throw new \RuntimeException("Cloudinary cURL error: {$error}");
        }

        $data = json_decode($response, true);

        if (!isset($data['secure_url'])) {
            $msg = $data['error']['message'] ?? $response;
            throw new \RuntimeException("Cloudinary error: {$msg}");
        }

        return $data['secure_url'];
    }

    /**
     * Delete an image from Cloudinary by its public_id.
     */
    public function destroy(string $publicId): void
    {
        $timestamp = time();
        $sigString = "public_id={$publicId}&timestamp={$timestamp}";
        $signature = sha1($sigString . $this->apiSecret);

        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/destroy";

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'public_id' => $publicId,
                'api_key'   => $this->apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
            ]),
        ]);

        curl_exec($ch);
        curl_close($ch);
    }

    /**
     * Extract Cloudinary public_id from a secure URL.
     */
    public function getPublicId(string $url): ?string
    {
        if (!str_contains($url, 'cloudinary.com')) {
            return null;
        }
        preg_match('/\/v\d+\/(.+)\.[a-z]+$/i', $url, $matches);
        return $matches[1] ?? null;
    }
}
