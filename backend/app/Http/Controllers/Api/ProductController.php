<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['primaryImage', 'category', 'collection'])
            ->active()
            ->when($request->category, fn($q, $v) => $q->whereHas('category', fn($q) => $q->where('slug', $v)))
            ->when($request->collection, fn($q, $v) => $q->whereHas('collection', fn($q) => $q->where('slug', $v)))
            ->when($request->type, fn($q, $v) => $q->byType($v))
            ->when($request->min_price, fn($q, $v) => $q->where('price', '>=', $v))
            ->when($request->max_price, fn($q, $v) => $q->where('price', '<=', $v))
            ->when($request->medium, fn($q, $v) => $q->where('medium', $v))
            ->when($request->orientation, fn($q, $v) => $q->where('orientation', $v))
            ->when($request->featured, fn($q) => $q->featured())
            ->when($request->search, fn($q, $v) => $q->where(function($q) use ($v) {
                $q->where('name', 'like', "%{$v}%")
                  ->orWhere('description', 'like', "%{$v}%")
                  ->orWhere('tags', 'like', "%{$v}%");
            }));

        $sort = match ($request->sort) {
            'price_asc' => ['price', 'asc'],
            'price_desc' => ['price', 'desc'],
            'newest' => ['created_at', 'desc'],
            'oldest' => ['created_at', 'asc'],
            'name' => ['name', 'asc'],
            default => ['created_at', 'desc'],
        };

        $products = $query->orderBy(...$sort)->paginate($request->per_page ?? 12);

        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::with(['images', 'variants', 'category', 'collection', 'reviews' => function($q) {
            $q->approved()->with('user');
        }])
            ->where('slug', $slug)
            ->firstOrFail();

        $related = Product::with('primaryImage')
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->active()
            ->take(4)
            ->get();

        return response()->json([
            'product' => $product,
            'related' => $related,
        ]);
    }

    public function featured(): JsonResponse
    {
        $products = Product::with('primaryImage')
            ->featured()
            ->active()
            ->inStock()
            ->take(8)
            ->get();

        return response()->json($products);
    }

    public function bestSellers(): JsonResponse
    {
        $products = Product::with('primaryImage')
            ->active()
            ->inStock()
            ->take(8)
            ->get();

        return response()->json($products);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::active()->with('children')->orderBy('sort_order')->get();
        return response()->json($categories);
    }

    public function collections(): JsonResponse
    {
        $collections = Collection::active()->withCount('products')->orderBy('sort_order')->get();
        return response()->json($collections);
    }

    public function mediums(): JsonResponse
    {
        $mediums = Product::active()->select('medium')->distinct()->whereNotNull('medium')->pluck('medium');
        return response()->json($mediums);
    }
}