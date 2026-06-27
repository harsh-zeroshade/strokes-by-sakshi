<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReviewController extends Controller
{
    /** GET /reviews/{product} — public, paginated approved reviews */
    public function index(Product $product): JsonResponse
    {
        $reviews = $product->reviews()
            ->approved()
            ->with('user:id,name,avatar_url')
            ->latest()
            ->paginate(10);

        return response()->json([
            'reviews'        => $reviews,
            'average_rating' => round($product->reviews()->approved()->avg('rating') ?? 0, 1),
            'total_reviews'  => $product->reviews()->approved()->count(),
            'rating_breakdown' => collect([5,4,3,2,1])->mapWithKeys(function ($star) use ($product) {
                return [$star => $product->reviews()->approved()->where('rating', $star)->count()];
            }),
        ]);
    }

    /**
     * GET /reviews/{product}/can-review — checks if the authenticated user
     * has purchased the product and has NOT already reviewed it.
     */
    public function canReview(Request $request, Product $product): JsonResponse
    {
        if (! $request->user()) {
            return response()->json(['can_review' => false, 'reason' => 'unauthenticated']);
        }

        $userId = $request->user()->id;

        // Check if the user already left a review for this product
        $alreadyReviewed = Review::where('product_id', $product->id)
            ->where('user_id', $userId)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json(['can_review' => false, 'reason' => 'already_reviewed']);
        }

        // Check if the user has a delivered/completed order containing this product
        $hasPurchased = Order::where('user_id', $userId)
            ->whereIn('status', ['delivered', 'completed'])
            ->whereHas('items', function ($q) use ($product) {
                $q->where('product_id', $product->id);
            })
            ->exists();

        if (! $hasPurchased) {
            return response()->json(['can_review' => false, 'reason' => 'not_purchased']);
        }

        // Get the eligible order id (most recent delivered order with this product)
        $order = Order::where('user_id', $userId)
            ->whereIn('status', ['delivered', 'completed'])
            ->whereHas('items', function ($q) use ($product) {
                $q->where('product_id', $product->id);
            })
            ->latest()
            ->first();

        return response()->json([
            'can_review' => true,
            'order_id'   => $order?->id,
        ]);
    }

    /** POST /reviews — auth required */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'order_id'   => 'nullable|exists:orders,id',
            'rating'     => 'required|integer|min:1|max:5',
            'title'      => 'nullable|string|max:255',
            'body'       => 'nullable|string|max:5000',
            'image'      => 'nullable|image|mimes:jpeg,png,webp,jpg|max:4096',
        ]);

        $userId = $request->user()->id;

        // Prevent duplicate reviews
        if (Review::where('product_id', $validated['product_id'])->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'You have already reviewed this product.'], 422);
        }

        // Verify purchase (only if order_id provided or enforce it)
        $hasPurchased = Order::where('user_id', $userId)
            ->whereIn('status', ['delivered', 'completed'])
            ->whereHas('items', function ($q) use ($validated) {
                $q->where('product_id', $validated['product_id']);
            })
            ->exists();

        if (! $hasPurchased) {
            return response()->json(['message' => 'You can only review products you have purchased.'], 403);
        }

        // Upload review image if provided
        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path     = $request->file('image')->store('reviews', 'public');
            $imageUrl = Storage::url($path);
        }

        $review = Review::create([
            'product_id' => $validated['product_id'],
            'user_id'    => $userId,
            'order_id'   => $validated['order_id'] ?? null,
            'rating'     => $validated['rating'],
            'title'      => $validated['title'] ?? null,
            'body'       => $validated['body'] ?? null,
            'image_url'  => $imageUrl,
        ]);

        return response()->json([
            'message' => 'Review submitted and pending approval.',
            'review'  => $review->load('user:id,name,avatar_url'),
        ], 201);
    }
}
