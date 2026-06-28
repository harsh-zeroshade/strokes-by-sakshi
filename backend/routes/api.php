<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CustomOrderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Simple CORS test endpoint
Route::get('/cors-test', function () {
    return response()->json([
        'message' => 'CORS is working!',
        'timestamp' => now(),
        'origin' => request()->header('Origin'),
    ]);
});

// Handle CORS preflight requests — managed by Laravel's built-in CORS middleware (config/cors.php)

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Auth — rate-limited to reduce brute-force and OTP abuse
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
});
// Login has tighter throttle: 5 attempts per minute, then locked for 5 minutes
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/otp/send', [AuthController::class, 'sendOtp'])->middleware('throttle:3,1');
Route::get('/auth/google/redirect', [AuthController::class, 'googleRedirect']);
Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);

// Products
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/featured', [ProductController::class, 'featured']);
Route::get('/products/best-sellers', [ProductController::class, 'bestSellers']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

// Categories & Collections
Route::get('/categories', [ProductController::class, 'categories']);
Route::get('/collections', [ProductController::class, 'collections']);
Route::get('/mediums', [ProductController::class, 'mediums']);

// Cart (public with session)
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart/add', [CartController::class, 'add']);
Route::put('/cart/items/{item}', [CartController::class, 'update']);
Route::delete('/cart/items/{item}', [CartController::class, 'remove']);
Route::post('/cart/coupon', [CartController::class, 'applyCoupon']);
Route::delete('/cart/coupon', [CartController::class, 'removeCoupon']);

// Custom Orders
Route::post('/custom-orders', [CustomOrderController::class, 'store'])->middleware('throttle:10,1');
Route::post('/custom-orders/estimate', [CustomOrderController::class, 'calculateEstimate']);
Route::get('/custom-orders/track/{orderNumber}', [CustomOrderController::class, 'track']);

// Reviews
Route::get('/reviews/{product}', [ReviewController::class, 'index']);
Route::middleware('auth:sanctum')->get('/reviews/{product}/can-review', [ReviewController::class, 'canReview']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/avatar', [AuthController::class, 'uploadAvatar']);

    // Cart (authenticated)
    Route::post('/cart/save-for-later/{item}', [CartController::class, 'saveForLater']);
    Route::post('/cart/move-to-wishlist/{item}', [CartController::class, 'moveToWishlist']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::get('/orders/track/{orderNumber}', [OrderController::class, 'track']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);

    // Custom Orders
    Route::get('/custom-orders', [CustomOrderController::class, 'index']);
    Route::get('/custom-orders/{order}', [CustomOrderController::class, 'show']);
    Route::post('/custom-orders/{order}/files', [CustomOrderController::class, 'uploadFiles']);
    Route::delete('/custom-orders/files/{file}', [CustomOrderController::class, 'removeFile']);

    // Wishlist
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/{product}', [WishlistController::class, 'toggle']);
    Route::delete('/wishlist/{product}', [WishlistController::class, 'remove']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store'])->middleware('throttle:3,60');

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        // Orders
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::get('/orders/{order}', [AdminController::class, 'orderDetail']);
        Route::put('/orders/{order}/status', [AdminController::class, 'updateOrderStatus']);

        // Custom Orders
        Route::get('/custom-orders', [AdminController::class, 'customOrders']);
        Route::get('/custom-orders/{order}', [AdminController::class, 'customOrderDetail']);
        Route::put('/custom-orders/{order}/status', [AdminController::class, 'updateCustomOrderStatus']);
        Route::post('/custom-orders/{order}/quote', [AdminController::class, 'sendQuote']);

        // Products — explicit routes to match controller method names
        Route::get('/products',              [AdminController::class, 'productIndex']);
        Route::post('/products',             [AdminController::class, 'storeProduct']);
        Route::get('/products/{product}',    [AdminController::class, 'showProduct']);
        Route::post('/products/{product}',   [AdminController::class, 'updateProduct']);   // POST for multipart support
        Route::put('/products/{product}',    [AdminController::class, 'updateProduct']);
        Route::delete('/products/{product}', [AdminController::class, 'destroyProduct']);

        // Categories
        Route::get('/categories',              [AdminController::class, 'categoryIndex']);
        Route::post('/categories',             [AdminController::class, 'storeCategory']);
        Route::put('/categories/{category}',   [AdminController::class, 'updateCategory']);
        Route::delete('/categories/{category}',[AdminController::class, 'destroyCategory']);

        // Reviews
        Route::get('/reviews', [AdminController::class, 'reviews']);
        Route::put('/reviews/{review}/approve', [AdminController::class, 'approveReview']);

        // Users
        Route::get('/users', [AdminController::class, 'users']);

        // Analytics
        Route::get('/analytics', [AdminController::class, 'analytics']);
    });
});