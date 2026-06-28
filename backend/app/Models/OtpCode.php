<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    protected $fillable = [
        'email',
        'code',
        'type',
        'name',
        'password',
        'expires_at',
        'used_at',
    ];

    protected $hidden = [
        'code',
        'password',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function scopeValid($query, string $email, string $code, string $type)
    {
        return $query
            ->where('email', $email)
            ->where('code', $code)
            ->where('type', $type)
            ->whereNull('used_at')
            ->where('expires_at', '>', now());
    }
}