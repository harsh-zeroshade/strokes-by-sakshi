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
     */
    public function upload(UploadedFile $file, string $folder = 'strokes-by-sakshi'): string
    {
        $timestamp  = time();
        $params     = "folder={$folder}&timestamp={$timestamp}";
        $signature  = sha1($params . $this->apiSecret);

        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/upload";

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => [
                'file'      => new \CURLFile($file->getRealPath(), $file->getMimeType(), $file->getClientOriginalName()),
                'api_key'   => $this->apiKey,
                'timestamp' => $timestamp,
                'folder'    => $folder,
                'signature' => $signature,
            ],
        ]);

        $response = curl_exec($ch);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \RuntimeException("Cloudinary upload failed: {$error}");
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
        $params    = "public_id={$publicId}&timestamp={$timestamp}";
        $signature = sha1($params . $this->apiSecret);

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
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<ver>/<public_id>.<ext>
        preg_match('/\/v\d+\/(.+)\.[a-z]+$/i', $url, $matches);
        return $matches[1] ?? null;
    }
}
