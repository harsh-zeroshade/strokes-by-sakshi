<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            'product_id' => 'required|integer|exists:products,id',
            'order_id'   => 'nullable|integer|exists:orders,id',
            'rating'     => 'required|integer|min:1|max:5',
            'title'      => 'nullable|string|max:120',
            'body'       => 'nullable|string|max:2000',
            'image'      => 'nullable|image|mimes:jpeg,png,webp,jpg|max:4096|dimensions:min_width=50,min_height=50',
        ]);

        $userId = $request->user()->id;

        // Prevent duplicate reviews
        if (Review::where('product_id', $validated['product_id'])->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'You have already reviewed this product.'], 422);
        }

        // Verify purchase server-side — cannot be bypassed from the frontend
        $hasPurchased = Order::where('user_id', $userId)
            ->whereIn('status', ['delivered', 'completed'])
            ->whereHas('items', function ($q) use ($validated) {
                $q->where('product_id', $validated['product_id']);
            })
            ->exists();

        if (! $hasPurchased) {
            return response()->json(['message' => 'You can only review products you have purchased and received.'], 403);
        }

        // Sanitise text inputs — strip HTML tags
        $title = isset($validated['title']) ? strip_tags($validated['title']) : null;
        $body  = isset($validated['body'])  ? strip_tags($validated['body'])  : null;

        // Upload review image to Cloudinary if provided
        $imageUrl = null;
        if ($request->hasFile('image')) {
            $file     = $request->file('image');
            $mimeType = $file->getMimeType();
            if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp'])) {
                return response()->json(['message' => 'Invalid image format.'], 422);
            }
            try {
                $cloudinary = new \App\Services\CloudinaryService();
                $imageUrl   = $cloudinary->upload($file, 'strokes-by-sakshi/reviews');
            } catch (\Exception $e) {
                // Proceed without image if upload fails — don't block review
            }
        }

        $review = Review::create([
            'product_id' => $validated['product_id'],
            'user_id'    => $userId,
            'order_id'   => $validated['order_id'] ?? null,
            'rating'     => $validated['rating'],
            'title'      => $title,
            'body'       => $body,
            'image_url'  => $imageUrl,
        ]);

        return response()->json([
            'message' => 'Review submitted and pending approval.',
            'review'  => $review->load('user:id,name,avatar_url'),
        ], 201);
    }
}
