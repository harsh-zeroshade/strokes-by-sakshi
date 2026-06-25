<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Product $product): JsonResponse
    {
        $reviews = $product->reviews()
            ->approved()
            ->with('user:id,name,avatar_url')
            ->latest()
            ->paginate(10);

        return response()->json([
            'reviews' => $reviews,
            'average_rating' => $product->average_rating,
            'total_reviews' => $product->review_count,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'order_id' => 'nullable|exists:orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'body' => 'nullable|string|max:5000',
            'image_url' => 'nullable|url',
        ]);

        $review = Review::create([
            'product_id' => $validated['product_id'],
            'user_id' => $request->user()->id,
            'order_id' => $validated['order_id'] ?? null,
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?? null,
            'body' => $validated['body'] ?? null,
            'image_url' => $validated['image_url'] ?? null,
        ]);

        return response()->json($review, 201);
    }
}