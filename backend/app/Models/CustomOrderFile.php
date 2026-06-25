<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomOrderFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'custom_order_id', 'file_path', 'original_name', 'mime_type', 'file_size', 'disk',
    ];

    public function customOrder()
    {
        return $this->belongsTo(CustomOrder::class);
    }
}