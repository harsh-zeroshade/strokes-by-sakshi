<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number', 'user_id', 'status', 'subtotal', 'discount', 'tax', 'shipping',
        'total', 'paid_amount', 'coupon_code', 'notes', 'payment_method', 'payment_status',
        'transaction_id', 'shipping_address', 'billing_address', 'shipping_method',
        'tracking_number', 'estimated_delivery', 'shipped_at', 'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'shipping' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'estimated_delivery' => 'datetime',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public static function generateOrderNumber(): string
    {
        $prefix = 'SBS-';
        $date = now()->format('Ymd');
        $last = self::whereDate('created_at', today())->count();
        return $prefix . $date . '-' . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }
}