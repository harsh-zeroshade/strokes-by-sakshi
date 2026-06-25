<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'description', 'short_description', 'story',
        'materials', 'care_instructions', 'price', 'compare_price', 'cost_price',
        'sku', 'product_type', 'medium', 'surface', 'orientation',
        'width_cm', 'height_cm', 'depth_cm', 'weight_kg',
        'stock_quantity', 'is_in_stock', 'is_featured', 'is_active',
        'category_id', 'collection_id', 'meta_title', 'meta_description', 'tags',
    ];

    protected $appends = ['thumbnail', 'average_rating', 'review_count'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'compare_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'width_cm' => 'decimal:2',
            'height_cm' => 'decimal:2',
            'depth_cm' => 'decimal:2',
            'weight_kg' => 'decimal:2',
            'is_in_stock' => 'boolean',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'tags' => 'array',
        ];
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function collection()
    {
        return $this->belongsTo(Collection::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class)->where('is_approved', true);
    }

    public function wishlistedBy()
    {
        return $this->belongsToMany(User::class, 'wishlists');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('is_in_stock', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('product_type', $type);
    }

    public function getThumbnailAttribute()
    {
        $image = $this->primaryImage;
        return $image ? $image->thumbnail_url : $this->images->first()->image_url ?? null;
    }

    public function getAverageRatingAttribute()
    {
        return $this->reviews()->avg('rating') ?? 0;
    }

    public function getReviewCountAttribute()
    {
        return $this->reviews()->count();
    }
}