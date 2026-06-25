<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\CustomOrder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Review;
use App\Models\User;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'total_orders' => Order::count(),
            'total_revenue' => Order::where('payment_status', 'paid')->sum('total'),
            'total_custom_orders' => CustomOrder::count(),
            'pending_custom_orders' => CustomOrder::where('status', 'pending')->count(),
            'total_products' => Product::count(),
            'total_users' => User::count(),
            'recent_orders' => Order::with('user:id,name')->latest()->take(5)->get(),
            'recent_custom_orders' => CustomOrder::with('user:id,name')->latest()->take(5)->get(),
        ]);
    }

    public function orders(): JsonResponse
    {
        $orders = Order::with('user:id,name,email', 'items')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return response()->json($orders);
    }

    public function orderDetail(Order $order): JsonResponse
    {
        return response()->json($order->load('user', 'items.product', 'payments'));
    }

    public function updateOrderStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,processing,shipped,delivered,cancelled,refunded',
            'tracking_number' => 'nullable|string',
        ]);

        $order->update($validated);
        if ($validated['status'] === 'shipped') {
            $order->update(['shipped_at' => now()]);
        }
        if ($validated['status'] === 'delivered') {
            $order->update(['delivered_at' => now()]);
        }

        return response()->json($order);
    }

    public function customOrders(): JsonResponse
    {
        $orders = CustomOrder::with('user:id,name,email', 'files')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return response()->json($orders);
    }

    public function customOrderDetail(CustomOrder $order): JsonResponse
    {
        return response()->json($order->load('user', 'files'));
    }

    public function updateCustomOrderStatus(Request $request, CustomOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,pending,in_review,quote_sent,quote_approved,in_progress,shipped,delivered,cancelled',
        ]);

        $statusTimestamps = [
            'quote_sent' => 'quote_sent_at',
            'quote_approved' => 'quote_approved_at',
            'in_progress' => 'started_at',
            'delivered' => 'completed_at',
        ];

        $data = ['status' => $validated['status']];
        if (isset($statusTimestamps[$validated['status']])) {
            $data[$statusTimestamps[$validated['status']]] = now();
        }

        $order->update($data);
        return response()->json($order);
    }

    public function sendQuote(Request $request, CustomOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'final_price' => 'required|numeric|min:0',
            'artist_notes' => 'nullable|string|max:5000',
        ]);

        $order->update([
            'final_price' => $validated['final_price'],
            'artist_notes' => $validated['artist_notes'] ?? null,
            'status' => 'quote_sent',
            'quote_sent_at' => now(),
        ]);

        return response()->json($order);
    }

    // ──────────────────────────────────────────────────────────────────
    // Products
    // ──────────────────────────────────────────────────────────────────

    public function productIndex(): JsonResponse
    {
        $products = Product::with('primaryImage', 'category')
            ->withTrashed(false)
            ->orderBy('created_at', 'desc')
            ->paginate(30);
        return response()->json($products);
    }

    public function showProduct(Product $product): JsonResponse
    {
        return response()->json($product->load('images', 'category', 'variants'));
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:products,slug',
            'description' => 'required|string',
            'short_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'product_type' => 'required|in:original,print,commission,limited_edition',
            'category_id' => 'nullable|exists:categories,id',
            'collection_id' => 'nullable|exists:collections,id',
            'medium' => 'nullable|string',
            'orientation' => 'nullable|string',
            'width_cm' => 'nullable|numeric',
            'height_cm' => 'nullable|numeric',
            'stock_quantity' => 'integer|min:0',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'meta_title' => 'nullable|string',
            'meta_description' => 'nullable|string',
        ]);

        $product = Product::create($validated);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $file) {
                $path = $file->store('products/' . $product->id, 'public');
                $product->images()->create([
                    'image_url' => Storage::disk('public')->url($path),
                    'thumbnail_url' => Storage::disk('public')->url($path),
                    'alt_text' => $product->name,
                    'sort_order' => $index,
                    'is_primary' => $index === 0,
                ]);
            }
        }

        return response()->json($product->load('images', 'category'), 201);
    }

    public function updateProduct(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'slug'              => 'sometimes|string|unique:products,slug,' . $product->id,
            'description'       => 'sometimes|string',
            'short_description' => 'sometimes|nullable|string',
            'price'             => 'sometimes|numeric|min:0',
            'compare_price'     => 'sometimes|nullable|numeric|min:0',
            'product_type'      => 'sometimes|in:original,print,commission,limited_edition',
            'category_id'       => 'sometimes|nullable|exists:categories,id',
            'collection_id'     => 'sometimes|nullable|exists:collections,id',
            'medium'            => 'sometimes|nullable|string',
            'orientation'       => 'sometimes|nullable|string',
            'width_cm'          => 'sometimes|nullable|numeric',
            'height_cm'         => 'sometimes|nullable|numeric',
            'stock_quantity'    => 'sometimes|integer|min:0',
            'is_featured'       => 'sometimes|boolean',
            'is_active'         => 'sometimes|boolean',
            'is_in_stock'       => 'sometimes|boolean',
            'replace_images'    => 'sometimes|boolean',
        ]);

        // Separate replace_images flag — not a product column
        $replaceImages = filter_var($request->input('replace_images', false), FILTER_VALIDATE_BOOLEAN);
        unset($validated['replace_images']);

        $product->update($validated);

        if ($request->hasFile('images')) {
            if ($replaceImages) {
                // Delete old image files from disk and remove DB records
                foreach ($product->images as $oldImage) {
                    // Extract relative path from full URL
                    $relativePath = str_replace(
                        Storage::disk('public')->url(''),
                        '',
                        $oldImage->image_url
                    );
                    Storage::disk('public')->delete(ltrim($relativePath, '/'));
                    $oldImage->delete();
                }
            }

            $existingCount = $product->images()->count(); // 0 if replaced, or original count

            foreach ($request->file('images') as $index => $file) {
                $path = $file->store('products/' . $product->id, 'public');
                $isPrimary = ($existingCount === 0 && $index === 0);

                // If making this the new primary, demote any existing primary first
                if ($isPrimary) {
                    $product->images()->where('is_primary', true)->update(['is_primary' => false]);
                }

                $product->images()->create([
                    'image_url'     => Storage::disk('public')->url($path),
                    'thumbnail_url' => Storage::disk('public')->url($path),
                    'alt_text'      => $product->name,
                    'sort_order'    => $existingCount + $index,
                    'is_primary'    => $isPrimary,
                ]);
            }
        }

        return response()->json($product->fresh()->load('images', 'category'));
    }

    public function destroyProduct(Product $product): JsonResponse
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }

    // ──────────────────────────────────────────────────────────────────
    // Categories
    // ──────────────────────────────────────────────────────────────────

    public function categoryIndex(): JsonResponse
    {
        return response()->json(Category::withCount('products')->orderBy('sort_order')->get());
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'required|string|unique:categories,slug',
            'description' => 'nullable|string',
            'sort_order'  => 'integer|min:0',
            'is_active'   => 'boolean',
        ]);

        $category = Category::create($validated);
        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'slug'        => 'sometimes|string|unique:categories,slug,' . $category->id,
            'description' => 'sometimes|nullable|string',
            'sort_order'  => 'sometimes|integer|min:0',
            'is_active'   => 'sometimes|boolean',
        ]);

        $category->update($validated);
        return response()->json($category);
    }

    public function destroyCategory(Category $category): JsonResponse
    {
        $category->delete();
        return response()->json(['message' => 'Category deleted']);
    }

    public function reviews(): JsonResponse
    {
        $reviews = Review::with('user:id,name', 'product:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return response()->json($reviews);
    }

    public function approveReview(Review $review): JsonResponse
    {
        $review->update(['is_approved' => true]);
        return response()->json($review);
    }

    public function users(): JsonResponse
    {
        return response()->json(User::withCount('orders', 'customOrders')->paginate(20));
    }

    public function analytics(): JsonResponse
    {
        $ordersByMonth = Order::selectRaw('MONTH(created_at) as month, YEAR(created_at) as year, COUNT(*) as count, SUM(total) as revenue')
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->take(12)
            ->get();

        $productsByType = Product::selectRaw('product_type, COUNT(*) as count')
            ->groupBy('product_type')
            ->get();

        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        return response()->json([
            'orders_by_month' => $ordersByMonth,
            'products_by_type' => $productsByType,
            'orders_by_status' => $ordersByStatus,
            'total_users' => User::count(),
            'total_products' => Product::count(),
            'average_order_value' => Order::where('payment_status', 'paid')->avg('total') ?? 0,
        ]);
    }
}