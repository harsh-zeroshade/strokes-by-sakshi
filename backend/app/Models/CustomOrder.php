<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number', 'user_id', 'order_type', 'medium', 'size', 'orientation',
        'is_framed', 'frame_color', 'color_style', 'background_style', 'urgency',
        'estimated_price', 'final_price', 'customer_instructions', 'artist_notes',
        'is_gift', 'recipient_name', 'recipient_message', 'status',
        'due_date', 'quote_sent_at', 'quote_approved_at', 'started_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'estimated_price' => 'decimal:2',
            'final_price' => 'decimal:2',
            'is_framed' => 'boolean',
            'is_gift' => 'boolean',
            'due_date' => 'date',
            'quote_sent_at' => 'datetime',
            'quote_approved_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function files()
    {
        return $this->hasMany(CustomOrderFile::class);
    }

    public static function generateOrderNumber(): string
    {
        $prefix = 'CUS-';
        $date = now()->format('Ymd');
        $last = self::whereDate('created_at', today())->count();
        return $prefix . $date . '-' . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}