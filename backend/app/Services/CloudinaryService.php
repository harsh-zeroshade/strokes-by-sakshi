<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class CloudinaryService
{
    private string $cloudName;
    private string $uploadPreset;

    public function __construct()
    {
        $this->cloudName    = env('CLOUDINARY_CLOUD_NAME', 'ddeakoucl');
        $this->uploadPreset = env('CLOUDINARY_UPLOAD_PRESET', 'dfllz22b');
    }

    /**
     * Upload a file to Cloudinary using an unsigned upload preset.
     */
    public function upload(UploadedFile $file, string $folder = 'strokes-by-sakshi'): string
    {
        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/upload";

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => [
                'file'          => new \CURLFile(
                    $file->getRealPath(),
                    $file->getMimeType() ?: 'image/jpeg',
                    $file->getClientOriginalName() ?: 'upload.jpg'
                ),
                'upload_preset' => $this->uploadPreset,
                'folder'        => $folder,
            ],
            CURLOPT_TIMEOUT        => 60,
        ]);

        $response = curl_exec($ch);
        $error    = curl_error($ch);
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

    /**
     * Delete an image from Cloudinary by its public_id.
     * Requires signed request — skipped if no API secret set.
     */
    public function destroy(string $publicId): void
    {
        $apiKey    = env('CLOUDINARY_API_KEY', '225348543345839');
        $apiSecret = env('CLOUDINARY_API_SECRET', 'R5Jd-EuIqpohSp_ciOgIOjyIyEU');

        $timestamp = time();
        $sigString = "public_id={$publicId}&timestamp={$timestamp}";
        $signature = sha1($sigString . $apiSecret);

        $url = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/destroy";

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'public_id' => $publicId,
                'api_key'   => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
            ]),
        ]);

        curl_exec($ch);
        curl_close($ch);
    }
}
