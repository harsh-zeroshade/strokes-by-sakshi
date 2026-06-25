<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{

    public function index(Request $request): JsonResponse
    {
        $products = $request->user()->wishlistProducts()
            ->with('primaryImage')
            ->paginate(20);

        return response()->json($products);
    }

    public function toggle(Request $request, Product $product): JsonResponse
    {
        $wishlist = $request->user()->wishlists()
            ->where('product_id', $product->id)
            ->first();

        if ($wishlist) {
            $wishlist->delete();
            $message = 'Removed from wishlist';
            $wishlisted = false;
        } else {
            $request->user()->wishlists()->create(['product_id' => $product->id]);
            $message = 'Added to wishlist';
            $wishlisted = true;
        }

        return response()->json([
            'message' => $message,
            'wishlisted' => $wishlisted,
        ]);
    }

    public function remove(Request $request, Product $product): JsonResponse
    {
        $request->user()->wishlists()
            ->where('product_id', $product->id)
            ->delete();

        return response()->json(['message' => 'Removed from wishlist']);
    }
}